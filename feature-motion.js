/* Reversible scroll scrubbing: transforms only, no scroll hijacking or dependencies. */
(function () {
  "use strict";
  var section = document.querySelector(".feature-constellation");
  if (!section || !window.matchMedia) return;
  var board = section.querySelector(".feature-board");
  var tiles = Array.prototype.slice.call(section.querySelectorAll(".feature-tile:not(.feature-brand)"));
  var brand = section.querySelector(".feature-brand");
  var cue = section.querySelector(".feature-scroll-cue");
  var skip = section.querySelector(".feature-skip");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var compact = window.matchMedia("(max-width: 640px)");
  var enabled = false;
  var pending = 0;
  var sectionTop = 0;
  var scrollRange = 1;
  var offsets = [];
  var observer;

  function clamp(n) { return Math.max(0, Math.min(1, n)); }
  function ease(n) { return n * n * (3 - 2 * n); }

  function render(progress) {
    section.dataset.progress = progress.toFixed(3);
    tiles.forEach(function (tile, i) {
      var start = .075 + (i % 4) * .035;
      var finish = .76 + (i % 3) * .035;
      var local = clamp((progress - start) / (finish - start));
      var remaining = 1 - ease(local);
      var alpha = ease(clamp(local * 4));
      tile.style.transform = "translate3d(" + (offsets[i].x * remaining).toFixed(2) + "px," +
        (offsets[i].y * remaining).toFixed(2) + "px,0) scale(" + (1 - .08 * remaining).toFixed(4) +
        ") rotate(" + (offsets[i].r * remaining).toFixed(3) + "deg)";
      tile.style.opacity = alpha.toFixed(3);
      tile.classList.toggle("is-visible", local > 0);
      tile.tabIndex = local >= .999 ? 0 : -1;
      tile.inert = local < .999;
    });
    brand.style.transform = "scale(" + (1.05 - .05 * ease(clamp(progress / .85))).toFixed(4) + ")";
    cue.style.opacity = (1 - ease(clamp(progress / .24))).toFixed(3);
  }

  function update() {
    pending = 0;
    if (enabled) render(clamp((window.scrollY - sectionTop) / scrollRange));
  }
  function schedule() {
    if (enabled && !pending) pending = window.requestAnimationFrame(update);
  }
  function measure() {
    if (!enabled) return;
    var rect = section.getBoundingClientRect();
    sectionTop = rect.top + window.scrollY;
    scrollRange = Math.max(1, section.offsetHeight - section.querySelector(".feature-pin").offsetHeight);
    var boardRect = board.getBoundingClientRect();
    var pinHeight = section.querySelector(".feature-pin").offsetHeight;
    offsets = tiles.map(function (tile, i) {
      var dx = Number(tile.dataset.fromX);
      var dy = Number(tile.dataset.fromY);
      var w = parseFloat(tile.style.getPropertyValue("--tile-w")) * boardRect.width / 100;
      var h = parseFloat(tile.style.getPropertyValue("--tile-h")) * boardRect.height / 100;
      var cx = boardRect.left + parseFloat(tile.style.getPropertyValue("--tile-x")) * boardRect.width / 100 + w / 2;
      var cy = (pinHeight - boardRect.height) / 2 + parseFloat(tile.style.getPropertyValue("--tile-y")) * boardRect.height / 100 + h / 2;
      var toX = dx > 0 ? (window.innerWidth - cx + w / 2 + 32) / dx :
        dx < 0 ? (-cx - w / 2 - 32) / dx : Infinity;
      var toY = dy > 0 ? (pinHeight - cy + h / 2 + 32) / dy :
        dy < 0 ? (-cy - h / 2 - 32) / dy : Infinity;
      var distance = Math.min(toX, toY) + 80;
      return {
        x: dx * distance,
        y: dy * distance,
        r: (i % 2 ? 1 : -1) * 5
      };
    });
    schedule();
  }
  function configure() {
    enabled = !reduced.matches && !compact.matches;
    section.classList.toggle("is-animated", enabled);
    if (enabled) {
      measure();
    } else {
      if (pending) window.cancelAnimationFrame(pending);
      pending = 0;
      delete section.dataset.progress;
      tiles.forEach(function (tile) {
        tile.style.removeProperty("transform");
        tile.style.removeProperty("opacity");
        tile.classList.remove("is-visible");
        tile.tabIndex = 0;
        tile.inert = false;
      });
      brand.style.removeProperty("transform");
      cue.style.removeProperty("opacity");
    }
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  window.addEventListener("pageshow", measure);
  window.addEventListener("load", measure);
  [reduced, compact].forEach(function (query) {
    if (query.addEventListener) query.addEventListener("change", configure);
    else query.addListener(configure);
  });
  if ("ResizeObserver" in window) {
    observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(board);
  }
  skip.addEventListener("click", function () {
    if (!enabled) return;
    window.scrollTo({ top: sectionTop + scrollRange * .88, behavior: "instant" });
    update();
    tiles[0].focus({ preventScroll: true });
  });
  configure();
})();
