// Card Maker server: serves the app, saves closed cards, and serves them back by link.
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '8mb' }));

const SIDES = ['env', 'front', 'open'];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
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
    )`);
  return {
    name: 'postgres',
    ready,
    async save(id, images) {
      await ready;
      await pool.query('INSERT INTO cards (id, env, front, open) VALUES ($1, $2, $3, $4)', [id, images.env, images.front, images.open]);
    },
    async load(id, side) {
      await ready;
      // side is checked against SIDES before it gets here, so it is safe as a column name
      const r = await pool.query(`SELECT ${side} AS image FROM cards WHERE id = $1`, [id]);
      return r.rows.length ? r.rows[0].image : null;
    },
    async exists(id) {
      await ready;
      const r = await pool.query('SELECT 1 FROM cards WHERE id = $1', [id]);
      return r.rows.length > 0;
    },
  };
}

function fileStore(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return {
    name: 'files in ' + dir,
    ready: Promise.resolve(),
    async save(id, images) {
      const folder = path.join(dir, id);
      await fs.promises.mkdir(folder);
      await Promise.all(SIDES.map((s) => fs.promises.writeFile(path.join(folder, s + '.jpg'), images[s])));
    },
    async load(id, side) {
      try {
        return await fs.promises.readFile(path.join(dir, id, side + '.jpg'));
      } catch (e) {
        return null;
      }
    },
    async exists(id) {
      return fs.existsSync(path.join(dir, id));
    },
  };
}

const store = process.env.DATABASE_URL
  ? pgStore(process.env.DATABASE_URL)
  : fileStore(path.join(__dirname, 'data'));

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

app.post('/api/cards', async (req, res) => {
  if (!allowed(req.ip)) return res.status(429).json({ error: 'Too many cards from this address. Try again later.' });
  const images = {};
  for (const side of SIDES) {
    images[side] = readImage(req.body && req.body[side]);
    if (!images[side]) return res.status(400).json({ error: 'The card pictures are missing or not valid.' });
  }
  try {
    const id = crypto.randomBytes(6).toString('base64url');
    await store.save(id, images);
    res.status(201).json({ id });
  } catch (e) {
    console.error('Could not save a card:', e.message);
    res.status(500).json({ error: 'The card could not be saved.' });
  }
});

app.get('/api/cards/:id/:side', async (req, res) => {
  const side = req.params.side.replace(/\.jpg$/, '');
  if (!ID_PATTERN.test(req.params.id) || !SIDES.includes(side)) return res.status(404).end();
  try {
    const image = await store.load(req.params.id, side);
    if (!image) return res.status(404).end();
    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(image);
  } catch (e) {
    console.error('Could not load a card:', e.message);
    res.status(500).end();
  }
});

app.get('/card/:id', async (req, res) => {
  try {
    if (!ID_PATTERN.test(req.params.id) || !(await store.exists(req.params.id))) {
      return res.status(404).sendFile(path.join(__dirname, 'public', 'missing.html'));
    }
    res.sendFile(path.join(__dirname, 'public', 'card.html'));
  } catch (e) {
    console.error('Could not open a card:', e.message);
    res.status(500).send('Something went wrong opening this card.');
  }
});

app.get('/healthz', (req, res) => res.send('ok'));

app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
store.ready
  .then(() => {
    app.listen(port, () => console.log(`Card Maker is running on port ${port}, saving cards to ${store.name}.`));
  })
  .catch((e) => {
    console.error('Could not reach the database:', e.message);
    process.exit(1);
  });
