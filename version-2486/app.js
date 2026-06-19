
  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => nav.classList.toggle('is-open'));
  }

  const hero = document.querySelector('[data-hero]');
  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const thumbs = Array.from(hero.querySelectorAll('[data-hero-thumb]'));
    let active = 0;
    let timer = null;
    const setActive = (index) => {
      active = (index + slides.length) % slides.length;
      slides.forEach((el, i) => el.classList.toggle('is-active', i === active));
      dots.forEach((el, i) => el.classList.toggle('is-active', i === active));
      thumbs.forEach((el, i) => el.classList.toggle('is-active', i === active));
    };
    const start = () => {
      stop();
      timer = window.setInterval(() => setActive(active + 1), 5200);
    };
    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };
    dots.forEach((dot, i) => dot.addEventListener('click', () => { setActive(i); start(); }));
    thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => { setActive(i); start(); }));
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    setActive(0);
    start();
  }

  const search = document.querySelector('[data-search]');
  const cards = Array.from(document.querySelectorAll('[data-movie-card]'));
  const chips = Array.from(document.querySelectorAll('[data-chip]'));
  const noResults = document.querySelector('[data-no-results]');
  let selectedChip = '';

  function applyFilters() {
    const q = (search?.value || '').trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const blob = (card.dataset.blob || '').toLowerCase();
      const chipValue = card.dataset.chips || '';
      const matchesQuery = !q || blob.includes(q);
      const matchesChip = !selectedChip || chipValue.includes(selectedChip);
      const show = matchesQuery && matchesChip;
      card.classList.toggle('hidden', !show);
      if (show) visible += 1;
    });
    if (noResults) noResults.classList.toggle('hidden', visible !== 0);
  }

  if (search) search.addEventListener('input', applyFilters);
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const value = chip.dataset.chip || '';
    if (selectedChip === value) {
      selectedChip = '';
      chips.forEach((c) => c.classList.remove('active'));
    } else {
      selectedChip = value;
      chips.forEach((c) => c.classList.toggle('active', c === chip));
    }
    applyFilters();
  }));
  if (cards.length) applyFilters();

  document.querySelectorAll('[data-video-player]').forEach((video) => {
    const hlsUrl = video.dataset.hls;
    const mp4Url = video.dataset.mp4;
    const tryNative = () => {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
        return true;
      }
      return false;
    };
    if (!tryNative()) {
      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({ enableWorker: false });
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
      } else if (mp4Url) {
        video.src = mp4Url;
      }
    }
  });
});
