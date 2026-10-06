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
    window.CardViewer.mount(
      document.getElementById('view'),
      { faces, sounds: (extras && extras.sounds) || [], opening: (extras && extras.opening) || null },
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
