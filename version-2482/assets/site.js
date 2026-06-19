function handleImageError(image) {
  var holder = image.closest(".poster, .detail-poster, .rank-poster, .hero-poster-card");
  if (holder) {
    holder.classList.add("is-empty");
  }
  image.remove();
}

(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function initMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    if (!toggle) {
      return;
    }

    toggle.addEventListener("click", function () {
      document.body.classList.toggle("menu-open");
    });
  }

  function initHeroSlider() {
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    var previous = document.querySelector("[data-hero-prev]");
    var next = document.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === current);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }

      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        restart();
      });
    });

    if (previous) {
      previous.addEventListener("click", function () {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        restart();
      });
    }

    show(0);
    restart();
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll("[data-video-player]"));

    players.forEach(function (player) {
      var source = player.getAttribute("data-source");
      var video = player.querySelector("video");
      var playButton = player.querySelector("[data-play-button]");
      var message = player.querySelector("[data-player-message]");
      var hlsInstance = null;
      var initialized = false;

      if (!source || !video || !playButton) {
        return;
      }

      function setMessage(text) {
        if (message) {
          message.textContent = text;
        }
      }

      function loadVideo() {
        if (initialized) {
          return;
        }

        initialized = true;

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          setMessage("正在准备播放");
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });

          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);

          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            setMessage("视频已就绪");
          });

          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setMessage("播放加载遇到问题，请稍后重试");
            }
          });

          return;
        }

        setMessage("当前浏览器需要支持 HLS 播放");
      }

      function startPlayback() {
        loadVideo();
        player.classList.add("is-playing");

        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {
            player.classList.remove("is-playing");
            setMessage("请再次点击播放按钮开始播放");
          });
        }
      }

      playButton.addEventListener("click", startPlayback);

      player.addEventListener("click", function (event) {
        if (event.target === video) {
          return;
        }

        if (!player.classList.contains("is-playing")) {
          startPlayback();
        }
      });

      video.addEventListener("play", function () {
        player.classList.add("is-playing");
      });

      video.addEventListener("pause", function () {
        if (!video.ended) {
          player.classList.remove("is-playing");
        }
      });

      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  function createCard(movie) {
    var tags = movie.tags && movie.tags.length ? movie.tags.slice(0, 2) : [movie.type];
    var tagHtml = tags.map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");

    return [
      '<article class="movie-card">',
      '  <a href="' + movie.url + '" aria-label="查看' + escapeHtml(movie.title) + '">',
      '    <div class="poster">',
      '      <img src="' + movie.poster + '" alt="' + escapeHtml(movie.title) + '海报" loading="lazy" onerror="handleImageError(this)">',
      '      <span class="poster-badge">' + escapeHtml(movie.type) + '</span>',
      '    </div>',
      '    <div class="movie-card-body">',
      '      <div class="movie-meta"><span>' + escapeHtml(movie.region) + '</span><span>·</span><span>' + escapeHtml(movie.year) + '</span></div>',
      '      <h3>' + escapeHtml(movie.title) + '</h3>',
      '      <p>' + escapeHtml(movie.oneLine || movie.summary || "") + '</p>',
      '      <div class="card-tags">' + tagHtml + '</div>',
      '    </div>',
      '  </a>',
      '</article>'
    ].join("");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initSearchPage() {
    var input = document.querySelector("[data-search-input]");
    var results = document.querySelector("[data-search-results]");
    var stats = document.querySelector("[data-search-stats]");
    var form = document.querySelector("[data-search-page-form]");

    if (!input || !results || !window.MOVIE_SEARCH_INDEX) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get("q") || "";
    input.value = initialQuery;

    function filterMovies(query) {
      var value = query.trim().toLowerCase();

      if (!value) {
        return window.MOVIE_SEARCH_INDEX.slice(0, 60);
      }

      return window.MOVIE_SEARCH_INDEX.filter(function (movie) {
        var text = [
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          movie.tags,
          movie.oneLine,
          movie.summary
        ].join(" ").toLowerCase();

        return text.indexOf(value) !== -1;
      }).slice(0, 120);
    }

    function render() {
      var query = input.value;
      var filtered = filterMovies(query);

      results.innerHTML = filtered.map(createCard).join("");

      if (stats) {
        if (query.trim()) {
          stats.textContent = "搜索“" + query.trim() + "”共显示 " + filtered.length + " 条相关影片";
        } else {
          stats.textContent = "默认展示最新索引中的 60 部影片，可输入片名、地区、年份或题材继续筛选";
        }
      }
    }

    input.addEventListener("input", render);

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        render();
      });
    }

    render();
  }

  ready(function () {
    initMenu();
    initHeroSlider();
    initPlayers();
    initSearchPage();
  });
})();
