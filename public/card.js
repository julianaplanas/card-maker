// The page someone gets when they open a card's link: envelope, tap, front, tap, inside.
(function () {
  const id = location.pathname.split('/').filter(Boolean).pop();
  const pic = document.getElementById('pic');
  const view = document.getElementById('view');
  const say = document.getElementById('say');
  const STAGES = [
    { side: 'env', alt: 'A closed envelope', label: 'An envelope. Tap to open it.', said: 'Back in the envelope.' },
    { side: 'front', alt: 'The front of the card', label: 'The front of the card. Tap to open it.', said: 'The front of the card.' },
    { side: 'open', alt: 'The inside of the card', label: 'The inside of the card. Tap to put it back.', said: 'The card, open.' },
  ];
  let at = 0;

  // load all three pictures up front so opening is instant
  STAGES.forEach((s) => {
    s.url = '/api/cards/' + id + '/' + s.side + '.jpg';
    new Image().src = s.url;
  });

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

  function show(i, spoken) {
    at = i;
    const s = STAGES[i];
    pic.src = s.url;
    pic.alt = s.alt;
    view.setAttribute('aria-label', s.label);
    if (spoken) say.textContent = s.said;
  }

  view.addEventListener('click', () => {
    const next = (at + 1) % STAGES.length;
    paper(next === 1 ? 1300 : 700, next === 1 ? 0.22 : 0.12);
    show(next, true);
  });

  show(0, false);
})();
