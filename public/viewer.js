// Shows a card the way its recipient gets it: envelope, tap, front, tap, inside.
// Pieces that carry a sound sit on top of the picture, wiggle when their side appears, and play when tapped.
// Used by the recipient's page and by the maker's "put the card in" preview, so both always match.
(function () {
  const STAGES = [
    { side: 'env', alt: 'A closed envelope', label: 'An envelope. Tap to open it.', said: 'Back in the envelope.' },
    { side: 'front', alt: 'The front of the card', label: 'The front of the card. Tap to open it.', said: 'The front of the card.' },
    { side: 'open', alt: 'The inside of the card', label: 'The inside of the card. Tap to put it back.', said: 'The card, open.' },
  ];

  let ac = null;
  function paper(freq, dur) {
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const n = Math.floor(ac.sampleRate * dur);
      const b = ac.createBuffer(1, n, ac.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = ac.createBufferSource();
      src.buffer = b;
      const f = ac.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = freq;
      const g = ac.createGain();
      g.gain.value = 0.35;
      src.connect(f);
      f.connect(g);
      g.connect(ac.destination);
      src.start();
    } catch (e) {
      /* no sound available; the card still opens */
    }
  }

  let playing = null;
  let spinning = null;
  let turn = 0;
  const tapes = new Map();
  function hush() {
    turn++;
    if (playing) playing.pause();
    if (spinning) {
      try {
        spinning.stop();
      } catch (e) {
        /* already finished */
      }
      spinning = null;
    }
  }
  function plain(url) {
    try {
      playing = new Audio(url);
      playing.play().catch(() => {});
    } catch (e) {
      /* this browser cannot play the recording */
    }
  }
  function decode(url) {
    if (!tapes.has(url)) {
      const raw = atob(url.slice(url.indexOf(',') + 1));
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      tapes.set(url, new Promise((ok, no) => ac.decodeAudioData(bytes.buffer, ok, no)));
    }
    return tapes.get(url);
  }
  // A recording plays like a tape. t (optional) says how: { rate: speed, back: true for backwards, a and b: where it starts and ends, 0 to 1 }.
  function play(url, t) {
    hush();
    t = t || {};
    const rate = t.rate || 1;
    const a = t.a > 0 ? t.a : 0;
    const b = t.b < 1 ? t.b : 1;
    if (!t.back && rate === 1 && a === 0 && b === 1) return plain(url);
    const mine = turn;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      decode(url).then(
        (buf) => {
          if (mine !== turn) return;
          let tape = buf;
          if (t.back) {
            if (!buf.flipped) {
              buf.flipped = ac.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
              for (let c = 0; c < buf.numberOfChannels; c++) buf.flipped.getChannelData(c).set(Float32Array.from(buf.getChannelData(c)).reverse());
            }
            tape = buf.flipped;
          }
          const from = t.back ? 1 - b : a;
          const src = ac.createBufferSource();
          src.buffer = tape;
          src.playbackRate.value = rate;
          src.connect(ac.destination);
          src.start(0, from * tape.duration, Math.max(0.05, (b - a) * tape.duration));
          spinning = src;
        },
        () => {
          if (mine === turn) plain(url); // this browser cannot take the recording apart, so it plays as recorded
        }
      );
    } catch (e) {
      plain(url);
    }
  }

  // data: { faces: {env, front, open} picture addresses, sounds: [{face, x, y, w, h, r, img, audio}], opening: audio or null }
  function mount(root, data, onSay) {
    root.textContent = '';
    root.classList.add('cv');
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'cv-next';
    const pic = document.createElement('img');
    pic.className = 'cv-face';
    next.appendChild(pic);
    root.appendChild(next);

    const pieces = (data.sounds || []).map((s) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cv-piece';
      b.hidden = true;
      b.setAttribute('aria-label', 'A piece of the card that plays a sound');
      b.style.left = s.x * 100 + '%';
      b.style.top = s.y * 100 + '%';
      b.style.width = s.w * 100 + '%';
      b.style.height = s.h * 100 + '%';
      b.style.setProperty('--r', (s.r || 0) + 'deg');
      const im = document.createElement('img');
      im.src = s.img;
      im.alt = '';
      im.draggable = false; // otherwise the browser drags the picture away instead of letting the piece turn
      b.appendChild(im);
      const wiggle = () => {
        b.classList.remove('cv-wig');
        void b.offsetWidth;
        b.classList.add('cv-wig');
      };
      let spun = false;
      if (!s.audio) b.classList.add('cv-quiet');
      if (s.pin) {
        // The piece is laid out by its top-left corner but turns around its pin, so shift it to where the maker left it.
        const F = s.face === 'front' ? [600, 840] : [1200, 840];
        const R = ((s.r || 0) * Math.PI) / 180;
        const dx = (0.5 - s.pin.x) * s.w * F[0];
        const dy = (0.5 - s.pin.y) * s.h * F[1];
        const left = s.x + (dx - (Math.cos(R) * dx - Math.sin(R) * dy)) / F[0];
        const top = s.y + (dy - (Math.sin(R) * dx + Math.cos(R) * dy)) / F[1];
        b.style.left = left * 100 + '%';
        b.style.top = top * 100 + '%';
        b.style.transformOrigin = s.pin.x * 100 + '% ' + s.pin.y * 100 + '%';
        b.classList.add('cv-pin');
        b.setAttribute('aria-label', s.audio ? 'A piece of the card that spins and plays a sound' : 'A piece of the card that spins. Drag it, or use the left and right arrow keys.');
        let ang = s.r || 0;
        let from = null;
        const about = (e) => {
          const r = root.getBoundingClientRect();
          return (Math.atan2(e.clientY - (r.top + (top + s.h * s.pin.y) * r.height), e.clientX - (r.left + (left + s.w * s.pin.x) * r.width)) * 180) / Math.PI;
        };
        const set = (a) => {
          ang = a;
          b.style.setProperty('--r', a.toFixed(1) + 'deg');
        };
        b.addEventListener('pointerdown', (e) => {
          try {
            b.setPointerCapture(e.pointerId);
          } catch (_) {
            /* the piece still turns while the pointer stays over it */
          }
          from = { a: about(e), r: ang };
          spun = false;
          b.classList.add('cv-held');
        });
        b.addEventListener('pointermove', (e) => {
          if (!from) return;
          const d = about(e) - from.a;
          if (Math.abs(d) > 3) spun = true;
          if (spun) set(from.r + d);
        });
        const drop = () => {
          from = null;
          b.classList.remove('cv-held');
        };
        b.addEventListener('pointerup', drop);
        b.addEventListener('pointercancel', drop);
        b.addEventListener('keydown', (e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          set(ang + (e.key === 'ArrowLeft' ? -10 : 10));
        });
      }
      b.addEventListener('click', () => {
        if (spun) {
          spun = false;
          return;
        }
        if (s.audio) play(s.audio, s.t);
        wiggle();
      });
      // when the wiggle ends, go back to the gentle sway that marks a piece as having a sound
      b.addEventListener('animationend', (ev) => {
        if (ev.animationName === 'cv-wig') b.classList.remove('cv-wig');
      });
      root.appendChild(b);
      return { face: s.face, el: b, wiggle };
    });

    let at = 0;
    function show(i, spoken) {
      at = i;
      const st = STAGES[i];
      pic.src = data.faces[st.side];
      pic.alt = st.alt;
      next.setAttribute('aria-label', st.label);
      pieces.forEach((p) => {
        p.el.hidden = p.face !== st.side;
        if (p.face === st.side) setTimeout(p.wiggle, 450);
      });
      if (spoken && onSay) onSay(st.said);
    }
    next.addEventListener('click', () => {
      const n = (at + 1) % STAGES.length;
      paper(n === 1 ? 1300 : 700, n === 1 ? 0.22 : 0.12);
      show(n, true);
      if (n === 2 && data.opening) play(data.opening, data.openingTape);
    });
    show(0, false);
    return {
      stop() {
        hush();
      },
    };
  }

  // "21 October" for the day a card stops existing
  function day(until) {
    return new Date(until).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  }

  function asData(url) {
    if (url.indexOf('data:') === 0) return Promise.resolve(url);
    return fetch(url)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error('missing'))))
      .then(
        (b) =>
          new Promise((ok, no) => {
            const fr = new FileReader();
            fr.onload = () => ok(fr.result);
            fr.onerror = no;
            fr.readAsDataURL(b);
          })
      );
  }
  const text = (url) => fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(new Error('missing'))));

  // Saves the card as one file that opens like the link does: pictures, sounds and this viewer are all inside it.
  function keep(data) {
    const sides = ['env', 'front', 'open'];
    return Promise.all([text('/viewer.js'), text('/style.css'), Promise.all(sides.map((s) => asData(data.faces[s])))]).then((got) => {
      const faces = {};
      sides.forEach((s, i) => (faces[s] = got[2][i]));
      const card = JSON.stringify({ faces, sounds: data.sounds || [], opening: data.opening || null, openingTape: data.openingTape || null }).replace(/</g, '\\u003c');
      const html =
        '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
        '<title>A card for you</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;700&display=swap">' +
        '<style>' + got[1] + 'html,body{height:100%}body{padding:16px;box-sizing:border-box;display:flex;align-items:center;justify-content:center}.cv-face{max-height:90vh}</style>' +
        '</head><body><div id="view"></div><p id="say" class="sr" role="status"></p>' +
        '<script>' + got[0] + '</' + 'script><script>CardViewer.mount(document.getElementById("view"),' + card +
        ',function(t){document.getElementById("say").textContent=t;});</' + 'script></body></html>';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      a.download = 'card.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    });
  }

  window.CardViewer = { mount, keep, day, play };
})();
