(function () {
    var header = document.querySelector('[data-header]');
    var menuButton = document.querySelector('[data-menu-toggle]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    function syncHeader() {
        if (!header) {
            return;
        }
        if (window.scrollY > 16) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
    }

    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });

    if (menuButton && mobileNav && header) {
        menuButton.addEventListener('click', function () {
            mobileNav.classList.toggle('is-open');
            header.classList.toggle('is-open');
        });
    }

    document.querySelectorAll('[data-hero]').forEach(function (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
        var current = 0;

        function show(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                show(index);
            });
        });

        show(0);
        if (slides.length > 1) {
            window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }
    });

    document.querySelectorAll('[data-filter-area]').forEach(function (area) {
        var input = area.querySelector('[data-search-input]');
        var yearFilter = area.querySelector('[data-year-filter]');
        var regionFilter = area.querySelector('[data-region-filter]');
        var scope = area.parentElement || document;
        var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-movie-card]'));

        function normalize(value) {
            return (value || '').toString().trim().toLowerCase();
        }

        function runFilter() {
            var keyword = normalize(input && input.value);
            var year = normalize(yearFilter && yearFilter.value);
            var region = normalize(regionFilter && regionFilter.value);

            cards.forEach(function (card) {
                var text = normalize([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-genre'),
                    card.getAttribute('data-type')
                ].join(' '));
                var matchesKeyword = !keyword || text.indexOf(keyword) !== -1;
                var matchesYear = !year || normalize(card.getAttribute('data-year')) === year;
                var matchesRegion = !region || normalize(card.getAttribute('data-region')) === region;
                card.style.display = matchesKeyword && matchesYear && matchesRegion ? '' : 'none';
            });
        }

        if (input) {
            input.addEventListener('input', runFilter);
        }
        if (yearFilter) {
            yearFilter.addEventListener('change', runFilter);
        }
        if (regionFilter) {
            regionFilter.addEventListener('change', runFilter);
        }
    });
})();
