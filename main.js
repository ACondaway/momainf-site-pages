/* MoMaInf project page: language toggle, scroll reveal, counters, video handling, lightbox. No dependencies. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var hasIO = "IntersectionObserver" in window;
  var TITLES = {
    en: "MoMaInf · Embodied indoor mobile manipulation research",
    zh: "MoMaInf · 具身室内移动操作研究"
  };

  function each(selector, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), fn);
  }

  /* ------------------------------------------------------------ language */
  function swapAttr(el, attr, zhAttr, enAttr, lang) {
    if (!el.hasAttribute(enAttr)) el.setAttribute(enAttr, el.getAttribute(attr) || "");
    el.setAttribute(attr, el.getAttribute(lang === "zh" ? zhAttr : enAttr));
  }

  function applyLang(lang) {
    root.setAttribute("data-lang", lang);
    root.lang = lang === "zh" ? "zh-CN" : "en";
    document.title = TITLES[lang];
    each("[data-zh-alt]", function (el) { swapAttr(el, "alt", "data-zh-alt", "data-en-alt", lang); });
    each("[data-zh-label]", function (el) { swapAttr(el, "aria-label", "data-zh-label", "data-en-label", lang); });
  }

  applyLang(root.getAttribute("data-lang") === "zh" ? "zh" : "en");

  var toggle = document.querySelector(".lang-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-lang") === "zh" ? "en" : "zh";
      applyLang(next);
      try { localStorage.setItem("momainf-lang", next); } catch (e) { /* private mode */ }
    });
  }

  /* ------------------------------------------------------------ nav */
  var nav = document.querySelector(".nav");
  function onScroll() { if (nav) nav.classList.toggle("scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (hasIO) {
    var links = {};
    each(".links a", function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(links).forEach(function (id) { links[id].classList.toggle("active", id === entry.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(links).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  /* ------------------------------------------------------------ scroll reveal */
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !hasIO) {
    each(".reveal", function (el) { el.classList.add("in"); });
  } else {
    each(".reveal", function (el) {
      var siblings = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains("reveal"); });
      var i = siblings.indexOf(el);
      if (i > 0) {
        el.style.transitionDelay = Math.min(i, 6) * 70 + "ms";
        el.addEventListener("transitionend", function clear() {
          el.style.transitionDelay = "";
          el.removeEventListener("transitionend", clear);
        });
      }
    });
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    Array.prototype.forEach.call(reveals, function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------------------------ counters */
  function format(value, decimals) {
    return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-to"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var duration = 1600;
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      el.textContent = format(target * (1 - Math.pow(1 - p, 3)), decimals);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (!reduceMotion && hasIO) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    each(".count", function (el) {
      el.textContent = format(0, parseInt(el.getAttribute("data-decimals") || "0", 10));
      counterObserver.observe(el);
    });
  }

  /* ------------------------------------------------------------ videos: play when visible, pause off-screen */
  function tryPlay(video) {
    video.muted = true;
    var p = video.play();
    if (p && typeof p.catch === "function") p.catch(function () { /* autoplay refused: poster stays */ });
  }

  var videos = document.querySelectorAll("video");
  if (hasIO) {
    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        v.setAttribute("data-inview", entry.isIntersecting ? "1" : "0");
        if (entry.isIntersecting) {
          if (v.hasAttribute("data-autoplay") && !reduceMotion && !document.hidden) tryPlay(v);
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { threshold: 0.2 });
    Array.prototype.forEach.call(videos, function (v) { videoObserver.observe(v); });
  } else if (!reduceMotion) {
    each("video[data-autoplay]", tryPlay);
  }

  document.addEventListener("visibilitychange", function () {
    Array.prototype.forEach.call(videos, function (v) {
      if (document.hidden) {
        if (!v.paused) v.pause();
      } else if (v.hasAttribute("data-autoplay") && v.getAttribute("data-inview") === "1" && !reduceMotion) {
        tryPlay(v);
      }
    });
  });

  /* ------------------------------------------------------------ lightbox */
  var box = document.querySelector(".lightbox");
  if (box) {
    var boxImg = box.querySelector("img");
    var closeBtn = box.querySelector(".lightbox-close");
    var lastFocus = null;

    var open = function (img) {
      boxImg.src = img.currentSrc || img.src;
      boxImg.alt = img.alt;
      lastFocus = document.activeElement;
      box.hidden = false;
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    };
    var close = function () {
      box.hidden = true;
      boxImg.removeAttribute("src");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };

    each(".zoom", function (button) {
      button.addEventListener("click", function () { open(button.querySelector("img")); });
    });
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target === closeBtn) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !box.hidden) close();
    });
  }
})();
