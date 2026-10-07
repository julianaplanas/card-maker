// The page someone gets when they open a card's link.
(function () {
  const id = location.pathname.split('/').filter(Boolean).pop();
  const say = document.getElementById('say');
  const base = '/api/cards/' + id + '/';
  const faces = { env: base + 'env.jpg', front: base + 'front.jpg', open: base + 'open.jpg' };

  // load the three pictures up front so opening is instant
  Object.keys(faces).forEach((k) => {
    new Image().src = faces[k];
  });

  function start(extras) {
    const keep = document.getElementById('keep');
    if (extras && extras.until) {
      const label = 'THIS CARD LASTS UNTIL ' + window.CardViewer.day(extras.until).toUpperCase() + '. KEEP IT';
      keep.textContent = label;
      keep.hidden = false;
      keep.addEventListener('click', () => {
        window.CardViewer.keep({ faces, sounds: extras.sounds, opening: extras.opening, openingTape: extras.openingTape }).then(
          () => (say.textContent = 'The card was saved as a file.'),
          () => {
            keep.textContent = 'COULD NOT SAVE IT. TRY AGAIN';
            setTimeout(() => (keep.textContent = label), 2500);
          }
        );
      });
    }
    window.CardViewer.mount(
      document.getElementById('view'),
      { faces, sounds: (extras && extras.sounds) || [], opening: (extras && extras.opening) || null, openingTape: (extras && extras.openingTape) || null },
      (text) => {
        say.textContent = text;
      }
    );
  }

  // sounds are optional: a card without them, or a failed download, still opens
  fetch(base + 'extras.json')
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then(start);
})();
