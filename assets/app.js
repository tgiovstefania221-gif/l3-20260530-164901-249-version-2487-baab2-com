(function () {
  var header = document.querySelector('[data-header]');
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  function updateHeader() {
    if (!header) {
      return;
    }
    if (window.scrollY > 18) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if (menuButton && header && mobilePanel) {
    menuButton.addEventListener('click', function () {
      header.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;
    var timer = null;

    function activate(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    function play() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        activate(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        activate(Number(dot.getAttribute('data-hero-dot')) || 0);
        play();
      });
    });

    activate(0);
    play();
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function filterCards(query) {
    var list = document.querySelector('[data-card-list]');
    if (!list) {
      return;
    }
    var q = normalize(query);
    var cards = Array.prototype.slice.call(list.querySelectorAll('.movie-card'));
    cards.forEach(function (card) {
      var haystack = [
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-type'),
        card.getAttribute('data-genre'),
        card.getAttribute('data-tags'),
        card.getAttribute('data-year')
      ].join(' ').toLowerCase();
      card.classList.toggle('hidden-by-filter', Boolean(q) && haystack.indexOf(q) === -1);
    });
  }

  var localFilter = document.querySelector('.js-card-filter');
  var localClear = document.querySelector('.js-filter-clear');
  var chipButtons = Array.prototype.slice.call(document.querySelectorAll('[data-card-filter]'));

  if (localFilter) {
    localFilter.addEventListener('input', function () {
      filterCards(localFilter.value);
      chipButtons.forEach(function (button) {
        button.classList.toggle('active', button.getAttribute('data-card-filter') === '');
      });
    });
  }

  if (localClear && localFilter) {
    localClear.addEventListener('click', function () {
      localFilter.value = '';
      filterCards('');
      chipButtons.forEach(function (button) {
        button.classList.toggle('active', button.getAttribute('data-card-filter') === '');
      });
    });
  }

  chipButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var value = button.getAttribute('data-card-filter') || '';
      if (localFilter) {
        localFilter.value = value;
      }
      filterCards(value);
      chipButtons.forEach(function (item) {
        item.classList.toggle('active', item === button);
      });
    });
  });

  var searchInput = document.querySelector('.js-global-search');
  var searchPanel = document.getElementById('global-search-results');
  var searchClear = document.querySelector('.js-search-clear');

  function renderGlobalSearch(query) {
    if (!searchPanel || !window.SEARCH_MOVIES) {
      return;
    }
    var q = normalize(query);
    if (!q) {
      searchPanel.innerHTML = '';
      searchPanel.classList.remove('active');
      return;
    }
    var matches = window.SEARCH_MOVIES.filter(function (movie) {
      return normalize([
        movie.title,
        movie.region,
        movie.type,
        movie.genre,
        movie.tags,
        movie.year
      ].join(' ')).indexOf(q) !== -1;
    }).slice(0, 12);
    searchPanel.innerHTML = matches.map(function (movie) {
      return '<a class="search-result" href="' + movie.url + '">' +
        '<img src="' + movie.cover + '" alt="' + movie.title.replace(/"/g, '&quot;') + '">' +
        '<span><strong>' + movie.title + '</strong><span>' + movie.region + ' · ' + movie.year + ' · ' + movie.genre + '</span></span>' +
        '</a>';
    }).join('');
    searchPanel.classList.toggle('active', matches.length > 0);
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      renderGlobalSearch(searchInput.value);
    });
  }

  if (searchClear && searchInput) {
    searchClear.addEventListener('click', function () {
      searchInput.value = '';
      renderGlobalSearch('');
      searchInput.focus();
    });
  }
})();

function initMoviePlayer(videoId, startButtonId, overlayId, source) {
  var video = document.getElementById(videoId);
  var startButton = document.getElementById(startButtonId);
  var overlay = document.getElementById(overlayId);
  var hls = null;
  var ready = false;
  var wantedPlay = false;

  if (!video || !source) {
    return;
  }

  function startVideo() {
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        if (overlay) {
          overlay.hidden = false;
        }
      });
    }
  }

  function prepare() {
    if (ready) {
      return;
    }
    ready = true;
    video.controls = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.addEventListener('loadedmetadata', function () {
        if (wantedPlay) {
          startVideo();
        }
      }, { once: true });
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        if (wantedPlay) {
          startVideo();
        }
      });
      return;
    }

    video.src = source;
  }

  function playFromUserAction(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    wantedPlay = true;
    if (overlay) {
      overlay.hidden = true;
    }
    prepare();
    startVideo();
  }

  if (startButton) {
    startButton.addEventListener('click', playFromUserAction);
  }

  if (overlay) {
    overlay.addEventListener('click', playFromUserAction);
  }

  video.addEventListener('play', function () {
    if (overlay) {
      overlay.hidden = true;
    }
  });

  window.addEventListener('beforeunload', function () {
    if (hls) {
      hls.destroy();
    }
  });
}
