
const hlsModulePromise = import("./hls.js").catch(() => null);

function ready(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

function setupMobileMenu() {
  const button = document.querySelector("[data-menu-button]");
  const panel = document.querySelector("[data-mobile-panel]");
  if (!button || !panel) {
    return;
  }
  button.addEventListener("click", () => {
    panel.classList.toggle("open");
  });
}

function setupHero() {
  const slides = Array.from(document.querySelectorAll("[data-hero-slide]"));
  const dots = Array.from(document.querySelectorAll("[data-hero-dot]"));
  if (slides.length === 0) {
    return;
  }
  let index = 0;
  const show = nextIndex => {
    index = nextIndex;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("active", slideIndex === index);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === index);
    });
  };
  dots.forEach((dot, dotIndex) => {
    dot.addEventListener("click", () => show(dotIndex));
  });
  window.setInterval(() => {
    show((index + 1) % slides.length);
  }, 5200);
}

function setupLocalFilters() {
  const form = document.querySelector("[data-local-search-form]");
  const input = document.querySelector("[data-local-search-input]");
  const region = document.querySelector("[data-region-filter]");
  const sort = document.querySelector("[data-sort-filter]");
  const grid = document.querySelector("[data-local-grid]");
  const empty = document.querySelector("[data-empty-state]");
  if (!grid) {
    return;
  }
  const cards = Array.from(grid.querySelectorAll("[data-search-card]"));
  const apply = event => {
    if (event) {
      event.preventDefault();
    }
    const query = (input && input.value ? input.value : "").trim().toLowerCase();
    const regionValue = region ? region.value : "all";
    const sorted = cards.slice().sort((a, b) => {
      if (!sort || sort.value === "default") {
        return Number(a.dataset.index || 0) - Number(b.dataset.index || 0);
      }
      if (sort.value === "year") {
        return Number(b.dataset.year || 0) - Number(a.dataset.year || 0);
      }
      return String(a.dataset.title || "").localeCompare(String(b.dataset.title || ""), "zh-Hans-CN");
    });
    let visible = 0;
    sorted.forEach(card => {
      grid.appendChild(card);
      const haystack = [card.dataset.title, card.dataset.tags, card.dataset.type, card.dataset.region, card.dataset.year].join(" ").toLowerCase();
      const regionMatched = regionValue === "all" || card.dataset.region === regionValue;
      const queryMatched = query === "" || haystack.includes(query);
      const matched = regionMatched && queryMatched;
      card.style.display = matched ? "" : "none";
      if (matched) {
        visible += 1;
      }
    });
    if (empty) {
      empty.classList.toggle("show", visible === 0);
    }
  };
  if (form) {
    form.addEventListener("submit", apply);
  }
  [input, region, sort].forEach(control => {
    if (control) {
      control.addEventListener("input", apply);
      control.addEventListener("change", apply);
    }
  });
  apply();
}

async function attachHls(video, src, errorNode) {
  if (!video || !src) {
    return;
  }
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = src;
    return;
  }
  const mod = await hlsModulePromise;
  const Hls = mod && mod.H;
  if (Hls && Hls.isSupported()) {
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true
    });
    hls.loadSource(src);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data && data.fatal && errorNode) {
        errorNode.textContent = "视频加载暂时不可用，请稍后重试。";
        errorNode.classList.add("show");
      }
    });
    video.addEventListener("emptied", () => hls.destroy(), { once: true });
    return;
  }
  if (errorNode) {
    errorNode.textContent = "当前浏览器暂不支持 HLS 视频播放。";
    errorNode.classList.add("show");
  }
}

function setupPlayers() {
  const shells = Array.from(document.querySelectorAll("[data-player]"));
  shells.forEach(shell => {
    const video = shell.querySelector("video");
    const playButtons = Array.from(shell.querySelectorAll("[data-play-button]"));
    const muteButton = shell.querySelector("[data-mute-button]");
    const fullButton = shell.querySelector("[data-fullscreen-button]");
    const errorNode = shell.querySelector("[data-player-error]");
    const src = shell.getAttribute("data-src");
    attachHls(video, src, errorNode);
    const sync = () => {
      shell.classList.toggle("playing", !video.paused);
      playButtons.forEach(button => {
        button.textContent = video.paused ? "▶" : "Ⅱ";
        button.setAttribute("aria-label", video.paused ? "播放" : "暂停");
      });
    };
    const togglePlay = () => {
      if (video.paused) {
        video.play().catch(() => {
          if (errorNode) {
            errorNode.textContent = "播放启动失败，请再次点击播放。";
            errorNode.classList.add("show");
          }
        });
      } else {
        video.pause();
      }
    };
    video.addEventListener("click", togglePlay);
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    playButtons.forEach(button => button.addEventListener("click", togglePlay));
    if (muteButton) {
      muteButton.addEventListener("click", () => {
        video.muted = !video.muted;
        muteButton.textContent = video.muted ? "取消静音" : "静音";
      });
    }
    if (fullButton) {
      fullButton.addEventListener("click", () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          shell.requestFullscreen().catch(() => {});
        }
      });
    }
    sync();
  });
}

function setupGlobalSearch() {
  const page = document.querySelector("[data-global-search-page]");
  if (!page || !window.MOVIE_SEARCH_DATA) {
    return;
  }
  const form = page.querySelector("[data-global-search-form]");
  const input = page.querySelector("[data-global-search-input]");
  const region = page.querySelector("[data-region-filter]");
  const grid = page.querySelector("[data-global-results]");
  const empty = page.querySelector("[data-empty-state]");
  const cardTemplate = item => `
    <article class="movie-card">
      <a class="poster-wrap" href="./${item.file}" aria-label="${escapeHtml(item.title)}">
        <img src="${item.cover}" alt="${escapeHtml(item.title)}" loading="lazy">
        <span class="poster-shade"></span>
        <span class="play-chip">播放</span>
      </a>
      <div class="movie-info">
        <a class="movie-title" href="./${item.file}">${escapeHtml(item.title)}</a>
        <div class="movie-meta"><span>${escapeHtml(item.year)}</span><span>${escapeHtml(item.region)}</span><span>${escapeHtml(item.type)}</span></div>
        <p>${escapeHtml(item.oneLine)}</p>
        <div class="tag-row">${item.tags.slice(0, 3).map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
    </article>`;
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") || "";
  if (initialQuery && input) {
    input.value = initialQuery;
  }
  const apply = event => {
    if (event) {
      event.preventDefault();
    }
    const query = (input && input.value ? input.value : "").trim().toLowerCase();
    const regionValue = region ? region.value : "all";
    const items = window.MOVIE_SEARCH_DATA.filter(item => {
      const haystack = [item.title, item.tags.join(" "), item.region, item.type, item.year, item.oneLine].join(" ").toLowerCase();
      const queryMatched = query === "" || haystack.includes(query);
      const regionMatched = regionValue === "all" || item.region === regionValue;
      return queryMatched && regionMatched;
    }).slice(0, 120);
    grid.innerHTML = items.map(cardTemplate).join("");
    if (empty) {
      empty.classList.toggle("show", items.length === 0);
    }
  };
  if (form) {
    form.addEventListener("submit", apply);
  }
  if (input) {
    input.addEventListener("input", apply);
  }
  if (region) {
    region.addEventListener("change", apply);
  }
  apply();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  }[character]));
}

ready(() => {
  setupMobileMenu();
  setupHero();
  setupLocalFilters();
  setupPlayers();
  setupGlobalSearch();
});
