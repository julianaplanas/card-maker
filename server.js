// Card Maker server: serves the app, saves closed cards, and serves them back by link.
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '25mb' }));

const SIDES = ['env', 'front', 'open'];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const KEEP_DAYS = 14; // a card is removed this many days after its envelope is closed
const KEEP_MS = KEEP_DAYS * 86400000;
const ID_PATTERN = /^[A-Za-z0-9_-]{6,16}$/;

// ---------- storage: Postgres when DATABASE_URL is set, plain files otherwise ----------

function pgStore(url) {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: url });
  const ready = pool.query(`
    CREATE TABLE IF NOT EXISTS cards (
      id text PRIMARY KEY,
      env bytea NOT NULL,
      front bytea NOT NULL,
      open bytea NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`).then(() => pool.query('ALTER TABLE cards ADD COLUMN IF NOT EXISTS extras text'));
  return {
    name: 'postgres',
    ready,
    async save(id, images, extras) {
      await ready;
      await pool.query('INSERT INTO cards (id, env, front, open, extras) VALUES ($1, $2, $3, $4, $5)', [id, images.env, images.front, images.open, extras]);
    },
    async loadExtras(id) {
      await ready;
      const r = await pool.query('SELECT extras FROM cards WHERE id = $1', [id]);
      return r.rows.length ? r.rows[0].extras : null;
    },
    async load(id, side) {
      await ready;
      // side is checked against SIDES before it gets here, so it is safe as a column name
      const r = await pool.query(`SELECT ${side} AS image FROM cards WHERE id = $1`, [id]);
      return r.rows.length ? r.rows[0].image : null;
    },
    async created(id) {
      await ready;
      const r = await pool.query('SELECT created_at FROM cards WHERE id = $1', [id]);
      return r.rows.length ? new Date(r.rows[0].created_at) : null;
    },
    async sweep() {
      await ready;
      await pool.query('DELETE FROM cards WHERE created_at < $1', [new Date(Date.now() - KEEP_MS)]);
    },
  };
}

function fileStore(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return {
    name: 'files in ' + dir,
    ready: Promise.resolve(),
    async save(id, images, extras) {
      const folder = path.join(dir, id);
      await fs.promises.mkdir(folder);
      await Promise.all(SIDES.map((s) => fs.promises.writeFile(path.join(folder, s + '.jpg'), images[s])));
      await fs.promises.writeFile(path.join(folder, 'extras.json'), extras);
    },
    async loadExtras(id) {
      try {
        return await fs.promises.readFile(path.join(dir, id, 'extras.json'), 'utf8');
      } catch (e) {
        return null;
      }
    },
    async load(id, side) {
      try {
        return await fs.promises.readFile(path.join(dir, id, side + '.jpg'));
      } catch (e) {
        return null;
      }
    },
    async created(id) {
      try {
        return (await fs.promises.stat(path.join(dir, id, 'extras.json'))).mtime;
      } catch (e) {
        return null;
      }
    },
    async sweep() {
      for (const id of await fs.promises.readdir(dir)) {
        const made = await this.created(id);
        if (made && Date.now() - made.getTime() > KEEP_MS) await fs.promises.rm(path.join(dir, id), { recursive: true, force: true });
      }
    },
  };
}

const store = process.env.DATABASE_URL
  ? pgStore(process.env.DATABASE_URL)
  : fileStore(path.join(__dirname, 'data'));

// When a card stops existing, or null if there is no such card (or it is already past its date).
async function until(id) {
  const made = await store.created(id);
  if (!made) return null;
  const end = made.getTime() + KEEP_MS;
  return end > Date.now() ? end : null;
}
function sweep() {
  store.sweep().catch((e) => console.error('Could not remove old cards:', e.message));
}
setInterval(sweep, 3600000).unref();

// ---------- a small limit on how many cards one address can save per hour ----------

const SAVES_PER_HOUR = 30;
const recent = new Map();
function allowed(ip) {
  const now = Date.now();
  const times = (recent.get(ip) || []).filter((t) => now - t < 3600000);
  if (times.length >= SAVES_PER_HOUR) {
    recent.set(ip, times);
    return false;
  }
  times.push(now);
  recent.set(ip, times);
  return true;
}

// ---------- routes ----------

function readImage(dataUrl) {
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(typeof dataUrl === 'string' ? dataUrl : '');
  if (!m) return null;
  const buf = Buffer.from(m[1], 'base64');
  // every JPEG starts with FF D8
  if (buf.length < 4 || buf.length > MAX_IMAGE_BYTES || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  return buf;
}

// Sounds travel as text: each recording, and the picture of the piece it belongs to, is a data: address.
const AUDIO = /^data:audio\/(webm|mp4|ogg)(;codecs=[A-Za-z0-9.,_-]+)?;base64,[A-Za-z0-9+/=]+$/;
const PNG = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;
const MAX_SOUNDS = 40;
const MAX_AUDIO_CHARS = 700000; // about half a megabyte of sound
const MAX_PIECE_CHARS = 2000000;

function readAudio(v) {
  return typeof v === 'string' && v.length <= MAX_AUDIO_CHARS && AUDIO.test(v) ? v : null;
}

// How a recording is played back: speed, direction, and where it starts and ends (0 to 1).
function readTape(t) {
  if (t == null || typeof t !== 'object') return null;
  const rate = Number(t.rate) || 1;
  const a = Number(t.a) || 0;
  const b = t.b == null ? 1 : Number(t.b);
  if (!(rate >= 0.4 && rate <= 2.5) || !(a >= 0 && a < b && b <= 1)) return null;
  return { rate, back: !!t.back, a, b };
}

// Returns a cleaned copy holding only what the viewer needs, or null if anything looks wrong.
function readExtras(raw) {
  if (raw == null) return { sounds: [], opening: null, openingTape: null };
  if (typeof raw !== 'object' || (raw.sounds != null && !Array.isArray(raw.sounds))) return null;
  const list = raw.sounds || [];
  if (list.length > MAX_SOUNDS) return null;
  const sounds = [];
  for (const s of list) {
    if (!s || !SIDES.includes(s.face)) return null;
    const nums = [s.x, s.y, s.w, s.h, s.r].map(Number);
    if (nums.some((n) => !Number.isFinite(n) || Math.abs(n) > 400)) return null;
    const audio = s.audio == null ? null : readAudio(s.audio);
    // a pin: where on the piece (0 to 1 across and down) it turns around
    const pin = s.pin && [s.pin.x, s.pin.y].every((n) => typeof n === 'number' && n >= 0 && n <= 1) ? { x: s.pin.x, y: s.pin.y } : null;
    if ((s.audio != null && !audio) || (!audio && !pin) || typeof s.img !== 'string' || s.img.length > MAX_PIECE_CHARS || !PNG.test(s.img)) return null;
    sounds.push({ face: s.face, x: nums[0], y: nums[1], w: nums[2], h: nums[3], r: nums[4], img: s.img, audio, t: audio ? readTape(s.t) : null, pin });
  }
  let opening = null;
  if (raw.opening != null) {
    opening = readAudio(raw.opening);
    if (!opening) return null;
  }
  return { sounds, opening, openingTape: opening ? readTape(raw.openingTape) : null };
}

app.post('/api/cards', async (req, res) => {
  if (!allowed(req.ip)) return res.status(429).json({ error: 'Too many cards from this address. Try again later.' });
  const images = {};
  for (const side of SIDES) {
    images[side] = readImage(req.body && req.body[side]);
    if (!images[side]) return res.status(400).json({ error: 'The card pictures are missing or not valid.' });
  }
  const extras = readExtras(req.body.extras);
  if (!extras) return res.status(400).json({ error: 'The card sounds are not valid.' });
  try {
    const id = crypto.randomBytes(6).toString('base64url');
    await store.save(id, images, JSON.stringify(extras));
    res.status(201).json({ id, until: Date.now() + KEEP_MS });
  } catch (e) {
    console.error('Could not save a card:', e.message);
    res.status(500).json({ error: 'The card could not be saved.' });
  }
});

app.get('/api/cards/:id/extras.json', async (req, res) => {
  if (!ID_PATTERN.test(req.params.id)) return res.status(404).end();
  try {
    const end = await until(req.params.id);
    if (!end) return res.status(404).end();
    const extras = JSON.parse((await store.loadExtras(req.params.id)) || '{"sounds":[],"opening":null}');
    extras.until = end;
    res.set('Cache-Control', 'private, max-age=3600');
    res.json(extras);
  } catch (e) {
    console.error('Could not load a card:', e.message);
    res.status(500).end();
  }
});

app.get('/api/cards/:id/:side', async (req, res) => {
  const side = req.params.side.replace(/\.jpg$/, '');
  if (!ID_PATTERN.test(req.params.id) || !SIDES.includes(side)) return res.status(404).end();
  try {
    const image = (await until(req.params.id)) ? await store.load(req.params.id, side) : null;
    if (!image) return res.status(404).end();
    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'private, max-age=3600');
    res.send(image);
  } catch (e) {
    console.error('Could not load a card:', e.message);
    res.status(500).end();
  }
});

app.get('/card/:id', async (req, res) => {
  try {
    if (!ID_PATTERN.test(req.params.id) || !(await until(req.params.id))) {
      return res.status(404).sendFile(path.join(__dirname, 'public', 'missing.html'));
    }
    res.sendFile(path.join(__dirname, 'public', 'card.html'));
  } catch (e) {
    console.error('Could not open a card:', e.message);
    res.status(500).send('Something went wrong opening this card.');
  }
});

// The pictures in the boxes: whatever image files sit in public/materials/magazines and /paintings.
const MATERIALS = { mags: 'magazines', paint: 'paintings' };
app.get('/api/materials', (req, res) => {
  const out = {};
  for (const box of Object.keys(MATERIALS)) {
    try {
      out[box] = fs
        .readdirSync(path.join(__dirname, 'public', 'materials', MATERIALS[box]))
        .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
        .sort()
        .map((f) => '/materials/' + MATERIALS[box] + '/' + encodeURIComponent(f));
    } catch (e) {
      out[box] = [];
    }
  }
  res.json(out);
});

app.get('/healthz', (req, res) => res.send('ok'));

app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
store.ready
  .then(() => {
    sweep();
    app.listen(port, () => console.log(`Card Maker is running on port ${port}, saving cards to ${store.name}.`));
  })
  .catch((e) => {
    console.error('Could not reach the database:', e.message);
    process.exit(1);
  });
