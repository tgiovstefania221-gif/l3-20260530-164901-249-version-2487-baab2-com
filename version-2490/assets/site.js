
(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const toggle = $('[data-mobile-toggle]');
  const nav = $('[data-nav-links]');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }

  const slides = $$('.hero-slide');
  if (slides.length) {
    let i = 0;
    const set = (n) => {
      slides.forEach((s, idx) => s.classList.toggle('active', idx === n));
      $$('.thumb[data-slide-target]').forEach((t, idx) => t.classList.toggle('active', idx === n));
      i = n;
    };
    set(0);
    let timer = setInterval(() => set((i + 1) % slides.length), 4200);
    slides.forEach((s, idx) => {
      s.addEventListener('mouseenter', () => { clearInterval(timer); set(idx); });
      s.addEventListener('mouseleave', () => { clearInterval(timer); timer = setInterval(() => set((i + 1) % slides.length), 4200); });
    });
    $$('.thumb[data-slide-target]').forEach((t, idx) => t.addEventListener('click', () => set(idx)));
  }

  const heroSearch = $('.hero .searchbar input[data-search-input]');
  const firstZoneInput = $('[data-filter-zone] input[data-search-input]');
  if (heroSearch && firstZoneInput) {
    heroSearch.addEventListener('input', () => {
      firstZoneInput.value = heroSearch.value;
      firstZoneInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  const zones = $$('[data-filter-zone]');
  zones.forEach(zone => {
    const cards = $$('[data-filter-card]', zone);
    const search = $('[data-search-input]', zone);
    const select = $('[data-type-select]', zone);
    const count = $('[data-visible-count]', zone);
    const apply = () => {
      const q = (search?.value || '').trim().toLowerCase();
      const t = (select?.value || '').trim();
      let visible = 0;
      cards.forEach(card => {
        const hay = [card.dataset.title, card.dataset.region, card.dataset.type, card.dataset.genre, card.dataset.tags, card.dataset.year].join(' ').toLowerCase();
        const okQ = !q || hay.includes(q);
        const okT = !t || t === '全部' || card.dataset.type === t || card.dataset.region === t || (card.dataset.genre || '').includes(t);
        const show = okQ && okT;
        card.classList.toggle('hidden', !show);
        if (show) visible++;
      });
      if (count) count.textContent = visible;
    };
    search && search.addEventListener('input', apply);
    select && select.addEventListener('change', apply);
    apply();
  });

  $$('video[data-hls]').forEach(video => {
    const hlsUrl = video.dataset.hls;
    const mp4Url = video.dataset.mp4;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl || mp4Url || '';
    } else if (window.Hls && Hls.isSupported() && hlsUrl) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
    } else if (mp4Url) {
      video.src = mp4Url;
    }
  });
})();
