(function () {
    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    function initMobileNav() {
        var button = document.querySelector("[data-mobile-menu-button]");
        var menu = document.querySelector("[data-mobile-menu]");
        if (!button || !menu) {
            return;
        }
        button.addEventListener("click", function () {
            menu.classList.toggle("is-open");
        });
    }

    function initHero() {
        var slider = document.querySelector("[data-hero-slider]");
        if (!slider) {
            return;
        }
        var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
        var index = 0;
        var timer = null;

        function show(next) {
            if (!slides.length) {
                return;
            }
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("active", i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("active", i === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                var next = Number(dot.getAttribute("data-hero-dot"));
                show(next);
                start();
            });
        });

        slider.addEventListener("mouseenter", stop);
        slider.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function initFilters() {
        var boxes = Array.prototype.slice.call(document.querySelectorAll("[data-filter-box]"));
        if (!boxes.length) {
            return;
        }
        boxes.forEach(function (box) {
            var input = box.querySelector("[data-search-input]");
            var chips = Array.prototype.slice.call(box.querySelectorAll("[data-filter]"));
            var scope = box.parentElement || document;
            var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-movie-card]"));
            if (!cards.length) {
                scope = document;
                cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
            }
            var emptyState = scope.querySelector("[data-empty-state]");
            var activeFilter = "all";

            function apply() {
                var query = input ? input.value.trim().toLowerCase() : "";
                var visible = 0;
                cards.forEach(function (card) {
                    var text = (card.getAttribute("data-search") || "").toLowerCase();
                    var matchesText = !query || text.indexOf(query) !== -1;
                    var matchesFilter = activeFilter === "all" || text.indexOf(activeFilter.toLowerCase()) !== -1;
                    var show = matchesText && matchesFilter;
                    card.style.display = show ? "" : "none";
                    if (show) {
                        visible += 1;
                    }
                });
                if (emptyState) {
                    emptyState.classList.toggle("is-visible", visible === 0);
                }
            }

            if (input) {
                input.addEventListener("input", apply);
            }
            chips.forEach(function (chip) {
                chip.addEventListener("click", function () {
                    activeFilter = chip.getAttribute("data-filter") || "all";
                    chips.forEach(function (item) {
                        item.classList.toggle("active", item === chip);
                    });
                    apply();
                });
            });
            apply();
        });
    }

    window.initMoviePlayer = function (videoUrl) {
        var video = document.getElementById("movie-video");
        var cover = document.querySelector("[data-play-cover]");
        if (!video || !videoUrl) {
            return;
        }
        var started = false;
        var hls = null;

        function playVideo() {
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {});
            }
        }

        function loadVideo() {
            if (started) {
                playVideo();
                return;
            }
            started = true;
            if (cover) {
                cover.classList.add("is-hidden");
            }
            video.controls = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = videoUrl;
                video.addEventListener("loadedmetadata", playVideo, { once: true });
                video.load();
                playVideo();
                return;
            }
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(videoUrl);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.MANIFEST_PARSED, playVideo);
                return;
            }
            video.src = videoUrl;
            video.load();
            playVideo();
        }

        if (cover) {
            cover.addEventListener("click", loadVideo);
        }
        video.addEventListener("click", function () {
            if (!started || video.paused) {
                loadVideo();
            }
        });
        window.addEventListener("beforeunload", function () {
            if (hls) {
                hls.destroy();
            }
        });
    };

    ready(function () {
        initMobileNav();
        initHero();
        initFilters();
    });
})();
