(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function bindMobileMenu() {
    var toggle = document.querySelector(".mobile-toggle");
    var panel = document.querySelector(".mobile-panel");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("open");
    });
  }

  function bindHero() {
    var hero = document.querySelector(".hero");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dots button"));
    var prev = hero.querySelector(".hero-prev");
    var next = hero.querySelector(".hero-next");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        restart();
      });
    });
    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        restart();
      });
    }
    show(0);
    restart();
  }

  function bindFilters() {
    var forms = document.querySelectorAll("[data-filter-form]");
    forms.forEach(function (form) {
      var scope = document.querySelector(form.getAttribute("data-filter-form"));
      if (!scope) {
        return;
      }
      var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-title]"));
      var keyword = form.querySelector("[data-filter-keyword]");
      var year = form.querySelector("[data-filter-year]");
      var region = form.querySelector("[data-filter-region]");
      var genre = form.querySelector("[data-filter-genre]");

      function filter() {
        var q = keyword ? keyword.value.trim().toLowerCase() : "";
        var y = year ? year.value : "";
        var r = region ? region.value : "";
        var g = genre ? genre.value : "";
        cards.forEach(function (card) {
          var text = [card.dataset.title, card.dataset.region, card.dataset.genre, card.dataset.category].join(" ").toLowerCase();
          var ok = true;
          if (q && text.indexOf(q) === -1) {
            ok = false;
          }
          if (y && card.dataset.year !== y) {
            ok = false;
          }
          if (r && card.dataset.region !== r) {
            ok = false;
          }
          if (g && (card.dataset.genre || "").indexOf(g) === -1) {
            ok = false;
          }
          card.style.display = ok ? "" : "none";
        });
      }

      [keyword, year, region, genre].forEach(function (input) {
        if (input) {
          input.addEventListener("input", filter);
          input.addEventListener("change", filter);
        }
      });
    });
  }

  function createSearchCard(movie) {
    var article = document.createElement("article");
    article.className = "movie-card";
    article.setAttribute("data-title", movie.title || "");
    article.setAttribute("data-year", movie.year || "");
    article.setAttribute("data-region", movie.region || "");
    article.setAttribute("data-genre", movie.genre || "");
    article.innerHTML = [
      '<a href="' + movie.href + '" class="movie-cover" aria-label="观看 ' + escapeHtml(movie.title) + '">',
      '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '<span class="play-float">▶</span>',
      '</a>',
      '<div class="movie-info">',
      '<div class="movie-meta"><span>' + escapeHtml(movie.category) + '</span><span>' + escapeHtml(movie.year) + '</span></div>',
      '<h3><a href="' + movie.href + '">' + escapeHtml(movie.title) + '</a></h3>',
      '<p>' + escapeHtml(movie.oneLine || "") + '</p>',
      '<div class="tag-row"><span>' + escapeHtml(movie.region || "") + '</span><span>' + escapeHtml(movie.type || "电影") + '</span></div>',
      '</div>'
    ].join("");
    return article;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char];
    });
  }

  function bindSearchPage() {
    var resultNode = document.querySelector("[data-search-results]");
    var headline = document.querySelector("[data-search-headline]");
    if (!resultNode || !window.MOVIES) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var q = (params.get("q") || "").trim().toLowerCase();
    if (headline) {
      headline.textContent = q ? "搜索结果" : "影片检索";
    }
    var list = q ? window.MOVIES.filter(function (movie) {
      return [movie.title, movie.oneLine, movie.region, movie.genre, movie.category, movie.year].join(" ").toLowerCase().indexOf(q) !== -1;
    }) : window.MOVIES.slice(0, 60);
    if (!list.length) {
      resultNode.innerHTML = '<div class="search-empty">没有找到匹配的影片</div>';
      return;
    }
    resultNode.innerHTML = "";
    list.slice(0, 240).forEach(function (movie) {
      resultNode.appendChild(createSearchCard(movie));
    });
  }

  function bindPlayers() {
    var players = document.querySelectorAll("[data-player]");
    players.forEach(function (shell) {
      var video = shell.querySelector("video");
      var overlay = shell.querySelector(".player-overlay");
      var message = shell.querySelector(".player-message");
      if (!video || !overlay) {
        return;
      }
      var source = video.getAttribute("data-src");
      var loaded = false;
      var hls = null;

      function showMessage(text) {
        if (message) {
          message.textContent = text;
          message.classList.add("show");
        }
      }

      function start() {
        overlay.classList.add("hidden");
        if (!source) {
          showMessage("播放暂时不可用");
          return;
        }
        if (!loaded) {
          if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({ enableWorker: true });
            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
              video.play().catch(function () {});
            });
            hls.on(window.Hls.Events.ERROR, function (event, data) {
              if (data && data.fatal) {
                showMessage("播放暂时不可用");
              }
            });
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = source;
            video.addEventListener("loadedmetadata", function () {
              video.play().catch(function () {});
            }, { once: true });
          } else {
            video.src = source;
          }
          loaded = true;
        }
        video.play().catch(function () {});
      }

      overlay.addEventListener("click", start);
      video.addEventListener("click", function () {
        if (!loaded) {
          start();
        }
      });
      window.addEventListener("pagehide", function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  ready(function () {
    bindMobileMenu();
    bindHero();
    bindFilters();
    bindSearchPage();
    bindPlayers();
  });
})();
