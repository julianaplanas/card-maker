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
  function play(url) {
    try {
      if (playing) playing.pause();
      playing = new Audio(url);
      playing.play().catch(() => {});
    } catch (e) {
      /* this browser cannot play the recording */
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
      b.appendChild(im);
      const wiggle = () => {
        b.classList.remove('cv-wig');
        void b.offsetWidth;
        b.classList.add('cv-wig');
      };
      b.addEventListener('click', () => {
        play(s.audio);
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
      if (n === 2 && data.opening) play(data.opening);
    });
    show(0, false);
    return {
      stop() {
        if (playing) playing.pause();
      },
    };
  }

  window.CardViewer = { mount };
})();
