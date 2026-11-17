/* David Casper portfolio. No dependencies.
   1. Copy-to-clipboard buttons   2. Photo lightbox   3. Reduced-motion video   4. Line charts */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- open every page at the top, unless the link points to a section ---------- */
  if (!location.hash) {
    try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}
    var toTop = function () {
      var top = document.getElementById("top");
      try { if (top && top.scrollIntoView) top.scrollIntoView({ block: "start", behavior: "instant" }); } catch (e) { if (top) top.scrollIntoView(true); }
      try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch (e) { window.scrollTo(0, 0); }
    };
    toTop();
    window.addEventListener("load", toTop);
  }

  /* ---------- 0. hero sound toggle ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-sound]"), function (btn) {
    var vid = btn.parentNode.querySelector("video");
    if (!vid) { btn.hidden = true; return; }
    btn.addEventListener("click", function () {
      var on = vid.muted;
      vid.muted = !on;
      if (on) { try { vid.currentTime = 0; var p = vid.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
      btn.classList.toggle("is-on", on);
      btn.textContent = on ? "Mute" : "Unmute";
      btn.setAttribute("aria-label", (on ? "Mute" : "Unmute") + " the hot fire video");
    });
  });

  /* ---------- 1. copy buttons ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-copy]"), function (btn) {
    var label = btn.textContent;
    var timer = null;
    function say(msg) {
      btn.textContent = msg;
      clearTimeout(timer);
      timer = setTimeout(function () { btn.textContent = label; }, 2200);
    }
    function selectInstead() {
      var target = document.getElementById(btn.getAttribute("aria-controls") || "");
      if (target && window.getSelection) {
        var range = document.createRange();
        range.selectNodeContents(target);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
      say("Selected");
    }
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { say("Copied"); }, selectInstead);
      } else {
        selectInstead();
      }
    });
  });

  /* ---------- 2. lightbox ---------- */
  var dlg = document.querySelector("dialog.lightbox");
  if (dlg && typeof dlg.showModal === "function") {
    var bigCap = dlg.querySelector("p");
    var bigImg = null; // added on open and removed on close, so the page never holds an image without a source
    document.addEventListener("click", function (e) {
      var link = e.target && e.target.closest ? e.target.closest("a.frame") : null;
      if (!link) return;
      e.preventDefault();
      var thumb = link.querySelector("img");
      if (bigImg) bigImg.remove();
      bigImg = document.createElement("img");
      bigImg.alt = thumb ? thumb.alt : "";
      bigImg.src = link.getAttribute("href");
      dlg.insertBefore(bigImg, bigCap);
      bigCap.textContent = link.getAttribute("data-caption") || "";
      dlg.showModal();
    });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("close", function () { if (bigImg) { bigImg.remove(); bigImg = null; } });
  }

  /* ---------- 3. video ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("video[autoplay]"), function (v) {
    if (reduceMotion) {
      v.removeAttribute("autoplay");
      v.removeAttribute("loop");
      v.pause();
      v.controls = true;
      var sb = v.parentNode.querySelector("[data-sound]");
      if (sb) sb.hidden = true;
    }
  });

  /* ---------- 4. charts ---------- */
  var NS = "http://www.w3.org/2000/svg";
  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  function fmt(v, kind) {
    if (kind === "pct") return (Math.round(v * 10) / 10).toFixed(1) + "%";
    if (kind === "degC") return v.toFixed(1) + " °C";
    if (kind === "s") return (v < 0 ? "−" : "+") + Math.abs(v).toFixed(2) + " s";
    if (kind === "min") return (v < 0 ? "−" : "+") + Math.abs(v).toFixed(1) + " min";
    return String(v);
  }
  function tickText(v, kind) {
    if (kind === "pct") return v + "%";
    if (kind === "degC") return v + "°";
    return (v < 0 ? "−" + Math.abs(v) : String(v));
  }

  function drawChart(host, spec) {
    var width = Math.max(260, Math.floor(host.clientWidth));
    var height = Math.round(Math.min(360, Math.max(240, width * 0.46)));
    var endLabels = spec.series.length > 1 && spec.series.every(function (s) { return s.short; });
    var m = { top: 10, right: endLabels ? 46 : 14, bottom: 44, left: 44 };
    var iw = width - m.left - m.right;
    var ih = height - m.top - m.bottom;
    var xd = spec.xDomain, yd = spec.yDomain;
    function sx(v) { return m.left + (v - xd[0]) / (xd[1] - xd[0]) * iw; }
    function sy(v) { return m.top + (1 - (v - yd[0]) / (yd[1] - yd[0])) * ih; }

    host.textContent = "";
    var svg = el("svg", { viewBox: "0 0 " + width + " " + height, width: width, height: height, role: "img", tabindex: "0", "aria-label": spec.label }, host);

    // grid and y ticks
    spec.yTicks.forEach(function (v) {
      el("line", { class: "gridline", x1: m.left, x2: m.left + iw, y1: sy(v), y2: sy(v) }, svg);
      var tx = el("text", { x: m.left - 8, y: sy(v) + 4, "text-anchor": "end" }, svg);
      tx.textContent = tickText(v, spec.yFmt);
    });
    // baseline
    el("line", { class: "axisline", x1: m.left, x2: m.left + iw, y1: sy(spec.baseline), y2: sy(spec.baseline) }, svg);
    // x ticks
    spec.xTicks.forEach(function (v) {
      el("line", { class: "axisline", x1: sx(v), x2: sx(v), y1: m.top + ih, y2: m.top + ih + 5 }, svg);
      var tx = el("text", { x: sx(v), y: m.top + ih + 19, "text-anchor": "middle" }, svg);
      tx.textContent = tickText(v, "x");
    });
    var xt = el("text", { x: m.left + iw / 2, y: height - 6, "text-anchor": "middle", class: "lbl" }, svg);
    xt.textContent = spec.xTitle;

    // event marks (ignition, burnout)
    (spec.marks || []).forEach(function (mk) {
      el("line", { class: "ann", x1: sx(mk.x), x2: sx(mk.x), y1: m.top + 4, y2: m.top + ih }, svg);
      var tx = el("text", { x: sx(mk.x) + (mk.side === "left" ? -6 : 6), y: m.top + 13, "text-anchor": mk.side === "left" ? "end" : "start", class: "lbl" }, svg);
      tx.textContent = mk.label;
    });

    // series
    spec.series.forEach(function (s) {
      var d = "";
      for (var i = 0; i < spec.x.length; i++) d += (i ? "L" : "M") + sx(spec.x[i]).toFixed(1) + " " + sy(s.y[i]).toFixed(1);
      el("path", { class: "line", d: d, style: "stroke: var(" + s.color + ")" }, svg);
      if (endLabels) {
        var last = s.y.length - 1;
        var tx = el("text", { x: m.left + iw + 6, y: sy(s.y[last]) + 4, class: "lbl lbl-strong" }, svg);
        tx.textContent = s.short;
      }
    });

    // hover layer
    var cross = el("line", { class: "cross", y1: m.top, y2: m.top + ih, x1: 0, x2: 0, visibility: "hidden" }, svg);
    var dots = spec.series.map(function (s) {
      return el("circle", { class: "dot", r: 4.5, cx: 0, cy: 0, visibility: "hidden", style: "fill: var(" + s.color + ")" }, svg);
    });
    var hit = el("rect", { x: m.left, y: m.top, width: iw, height: ih, fill: "transparent", style: "cursor: crosshair" }, svg);

    var tip = document.createElement("div");
    tip.className = "tip";
    tip.hidden = true;
    host.appendChild(tip);

    var current = -1;
    function show(i) {
      i = Math.max(0, Math.min(spec.x.length - 1, i));
      current = i;
      var px = sx(spec.x[i]);
      cross.setAttribute("x1", px); cross.setAttribute("x2", px); cross.setAttribute("visibility", "visible");
      var top = Infinity;
      tip.textContent = "";
      var head = document.createElement("div");
      head.className = "t";
      head.textContent = fmt(spec.x[i], spec.xFmt);
      tip.appendChild(head);
      spec.series.forEach(function (s, k) {
        var py = sy(s.y[i]);
        top = Math.min(top, py);
        dots[k].setAttribute("cx", px); dots[k].setAttribute("cy", py); dots[k].setAttribute("visibility", "visible");
        var row = document.createElement("div");
        row.className = "r";
        var key = document.createElement("i");
        key.style.setProperty("--c", "var(" + s.color + ")");
        var val = document.createElement("b");
        val.textContent = fmt(s.y[i], spec.yFmt);
        var name = document.createElement("span");
        name.textContent = s.name;
        row.appendChild(key); row.appendChild(val); row.appendChild(name);
        tip.appendChild(row);
      });
      tip.hidden = false;
      var half = tip.offsetWidth / 2;
      var left = Math.max(half, Math.min(width - half, px));
      var y = top - 12;
      if (y - tip.offsetHeight < 0) y = top + tip.offsetHeight + 16; // flip below the point when there is no room above
      tip.style.left = left + "px";
      tip.style.top = y + "px";
    }
    function hide() {
      current = -1;
      cross.setAttribute("visibility", "hidden");
      dots.forEach(function (d) { d.setAttribute("visibility", "hidden"); });
      tip.hidden = true;
    }
    function nearest(clientX) {
      var box = svg.getBoundingClientRect();
      var v = xd[0] + ((clientX - box.left) * (width / box.width) - m.left) / iw * (xd[1] - xd[0]);
      var lo = 0, hi = spec.x.length - 1;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (spec.x[mid] < v) lo = mid; else hi = mid; }
      return Math.abs(spec.x[lo] - v) <= Math.abs(spec.x[hi] - v) ? lo : hi;
    }
    hit.addEventListener("pointermove", function (e) { show(nearest(e.clientX)); });
    hit.addEventListener("pointerdown", function (e) { show(nearest(e.clientX)); });
    hit.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") hide(); });
    svg.addEventListener("blur", hide);
    svg.addEventListener("keydown", function (e) {
      var step = Math.max(1, Math.round(spec.x.length / 60));
      if (e.key === "ArrowRight") { show(current < 0 ? 0 : current + step); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { show(current < 0 ? spec.x.length - 1 : current - step); e.preventDefault(); }
      else if (e.key === "Escape") hide();
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll(".chart[data-chart]"), function (host) {
    var src = document.getElementById(host.getAttribute("data-chart"));
    if (!src) return;
    var spec;
    try { spec = JSON.parse(src.textContent); } catch (err) { return; }
    var lastWidth = 0;
    function render() {
      var w = Math.floor(host.clientWidth);
      if (!w || w === lastWidth) return;
      lastWidth = w;
      drawChart(host, spec);
    }
    render();
    if (window.ResizeObserver) new ResizeObserver(render).observe(host);
    else window.addEventListener("resize", render);
  });
})();
