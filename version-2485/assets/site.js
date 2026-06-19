(function() {
  var header = document.getElementById("siteHeader");
  var menuToggle = document.getElementById("menuToggle");
  var mobileNav = document.getElementById("mobileNav");
  function setHeader() {
    if (!header) {
      return;
    }
    if (window.scrollY > 18) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  setHeader();
  window.addEventListener("scroll", setHeader, { passive: true });
  if (menuToggle && mobileNav && header) {
    menuToggle.addEventListener("click", function() {
      mobileNav.classList.toggle("is-open");
      header.classList.toggle("is-open");
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
  var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
  var current = 0;
  function showSlide(next) {
    if (!slides.length) {
      return;
    }
    current = (next + slides.length) % slides.length;
    slides.forEach(function(slide, index) {
      slide.classList.toggle("active", index === current);
    });
    dots.forEach(function(dot, index) {
      dot.classList.toggle("active", index === current);
    });
  }
  dots.forEach(function(dot, index) {
    dot.addEventListener("click", function() {
      showSlide(index);
    });
  });
  if (slides.length > 1) {
    setInterval(function() {
      showSlide(current + 1);
    }, 5000);
  }

  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-filter-card]"));
  var keyword = document.getElementById("filterKeyword");
  var yearSelect = document.getElementById("filterYear");
  var typeSelect = document.getElementById("filterType");
  var regionSelect = document.getElementById("filterRegion");
  var emptyState = document.getElementById("emptyState");

  function uniqueValues(key) {
    var values = cards.map(function(card) {
      return card.getAttribute(key) || "";
    }).filter(Boolean);
    return Array.from(new Set(values)).sort(function(a, b) {
      return String(b).localeCompare(String(a), "zh-CN");
    });
  }

  function fillSelect(select, values) {
    if (!select) {
      return;
    }
    values.forEach(function(value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  fillSelect(yearSelect, uniqueValues("data-year"));
  fillSelect(typeSelect, uniqueValues("data-type"));
  fillSelect(regionSelect, uniqueValues("data-region"));

  function applyQueryParam() {
    if (!keyword) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var q = params.get("q");
    if (q) {
      keyword.value = q;
    }
  }

  function filterCards() {
    if (!cards.length) {
      return;
    }
    var q = keyword ? keyword.value.trim().toLowerCase() : "";
    var year = yearSelect ? yearSelect.value : "";
    var type = typeSelect ? typeSelect.value : "";
    var region = regionSelect ? regionSelect.value : "";
    var shown = 0;
    cards.forEach(function(card) {
      var text = [
        card.getAttribute("data-title") || "",
        card.getAttribute("data-region") || "",
        card.getAttribute("data-type") || "",
        card.getAttribute("data-genre") || "",
        card.getAttribute("data-year") || ""
      ].join(" ").toLowerCase();
      var ok = true;
      if (q && text.indexOf(q) === -1) {
        ok = false;
      }
      if (year && card.getAttribute("data-year") !== year) {
        ok = false;
      }
      if (type && card.getAttribute("data-type") !== type) {
        ok = false;
      }
      if (region && card.getAttribute("data-region") !== region) {
        ok = false;
      }
      card.style.display = ok ? "" : "none";
      if (ok) {
        shown += 1;
      }
    });
    if (emptyState) {
      emptyState.classList.toggle("is-visible", shown === 0);
    }
  }

  applyQueryParam();
  [keyword, yearSelect, typeSelect, regionSelect].forEach(function(control) {
    if (control) {
      control.addEventListener("input", filterCards);
      control.addEventListener("change", filterCards);
    }
  });
  filterCards();
})();
