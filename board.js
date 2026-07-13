/* samjett.dev — PCB hero board (vanilla JS, no dependencies)
   Renders the board SVG, silkscreen labels, and animated signal pips. */
(function () {
  "use strict";

  var NETS = [
    { id: "systems", label: "Systems" },
    { id: "hardware", label: "Hardware" },
    { id: "gamedev", label: "Game Dev" },
    { id: "music", label: "Music" },
    { id: "homelab", label: "Homelab" },
    { id: "graphics", label: "Graphics" }
  ];

  var DESKTOP = {
    w: 1000, h: 860,
    chip: "M130 160 H406 L450 204 V540 H130 Z",
    pin1: [158, 512],
    name: { left: 150, top: 200, width: 280, size: 64, meta: 13 },
    stubs: [
      "M130 200 H70 L40 230 V300", "M130 240 H90", "M130 300 H60 L20 340 V430",
      "M130 360 H80 L50 390 H10", "M130 480 H70", "M330 160 V120 L360 90 H420", "M250 160 V110"
    ],
    stubVias: [[90, 240], [70, 480], [250, 110], [40, 300], [20, 430], [420, 90]],
    nets: [
      { traces: ["M450 228 H612 L672 168 H820", "M450 236 H620 L680 176 H820", "M450 244 H628 L688 184 H820"],
        hit: "M450 236 H620 L680 176 H820", pip: "M450 236 H620 L680 176 H820",
        silk: [700, 148], chipPad: [440, 222, 14, 28], endPad: [814, 164, 8, 28], vias: [[620, 236]] },
      { traces: ["M450 330 H820", "M450 338 H820"],
        hit: "M450 334 H820", pip: "M450 330 H820",
        silk: [588, 310], chipPad: [440, 324, 14, 20], endPad: [814, 326, 8, 20], vias: [] },
      { traces: ["M450 430 H600 L650 480 H820", "M450 438 H592 L642 488 H820"],
        hit: "M450 434 H596 L646 484 H820", pip: "M450 430 H600 L650 480 H820",
        silk: [470, 410], chipPad: [440, 424, 14, 20], endPad: [814, 476, 8, 20], vias: [[600, 430]] },
      { traces: ["M370 540 V570 L420 620 H820", "M362 540 V578 L412 628 H820"],
        hit: "M366 540 V574 L416 624 H820", pip: "M370 540 V570 L420 620 H820",
        silk: [560, 600], chipPad: [356, 534, 20, 14], endPad: [814, 616, 8, 20], vias: [[420, 620]] },
      { traces: ["M290 540 V640 L340 690 H820", "M282 540 V648 L332 698 H820"],
        hit: "M286 540 V644 L336 694 H820", pip: "M290 540 V640 L340 690 H820",
        silk: [648, 670], chipPad: [276, 534, 20, 14], endPad: [814, 686, 8, 20], vias: [[340, 690]] },
      { traces: ["M210 540 V710 L260 760 H820", "M202 540 V718 L252 768 H820"],
        hit: "M206 540 V714 L256 764 H820", pip: "M210 540 V710 L260 760 H820",
        silk: [490, 740], chipPad: [196, 534, 20, 14], endPad: [814, 756, 8, 20], vias: [[260, 760]] }
    ]
  };

  function compactNet(i) {
    var x = 70 + 44 * i;
    var y = 280 + 56 * i;
    var main = "M" + x + " 210 V" + (y - 28) + " L" + (x + 28) + " " + y + " H372";
    var second = "M" + (x - 8) + " 210 V" + (y - 20) + " L" + (x + 20) + " " + (y + 8) + " H372";
    var third = "M" + (x + 8) + " 210 V" + (y - 36) + " L" + (x + 36) + " " + (y - 8) + " H372";
    return {
      traces: i === 0 ? [second, main, third] : [second, main],
      hit: main, pip: main,
      silk: [x + 48, y - 22],
      chipPad: [x - 14, 204, i === 0 ? 28 : 22, 14],
      endPad: [366, y - 12, 8, i === 0 ? 28 : 22],
      vias: [[x + 28, y]]
    };
  }

  var COMPACT = {
    w: 400, h: 640,
    chip: "M40 40 H276 L320 84 V210 H40 Z",
    pin1: [66, 184],
    name: { left: 58, top: 66, width: 220, size: 44, meta: 11 },
    stubs: ["M40 90 H16", "M40 130 H24 L10 116", "M120 40 V16", "M200 40 V20 L214 6"],
    stubVias: [[16, 90], [10, 116], [120, 16], [214, 6]],
    nets: [0, 1, 2, 3, 4, 5].map(compactNet)
  };

  var SVG_NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function build(container, geo) {
    container.innerHTML = "";
    var scale = Math.min(container.clientWidth / geo.w, 1.2);
    var stage = document.createElement("div");
    stage.style.cssText =
      "position:relative;width:" + geo.w + "px;height:" + geo.h + "px;" +
      "transform:translateX(-50%) scale(" + scale + ");transform-origin:top center;" +
      "position:absolute;top:0;left:50%";
    var outer = document.createElement("div");
    outer.style.cssText = "position:relative;width:100%;height:" + geo.h * scale + "px;overflow:hidden";
    outer.appendChild(stage);
    container.appendChild(outer);

    var svg = svgEl("svg", { viewBox: "0 0 " + geo.w + " " + geo.h, width: geo.w, height: geo.h, fill: "none" });
    svg.style.cssText = "position:absolute;inset:0";
    stage.appendChild(svg);

    // dummy stubs + vias
    geo.stubs.forEach(function (d) {
      svg.appendChild(svgEl("path", { d: d, stroke: "var(--trace-dim)", "stroke-width": 1.5 }));
    });
    geo.stubVias.forEach(function (v) {
      svg.appendChild(svgEl("circle", { cx: v[0], cy: v[1], r: 3, stroke: "var(--trace)", "stroke-width": 1.5 }));
    });

    var groups = {};
    var netGeo = {};
    geo.nets.forEach(function (n, i) {
      var net = NETS[i];
      netGeo[net.id] = n;
      var g = svgEl("g", { class: "net-group", "data-net": net.id });
      n.traces.forEach(function (d) {
        g.appendChild(svgEl("path", { class: "trace", d: d, "stroke-width": 1.5 }));
      });
      g.appendChild(svgEl("path", { d: n.hit, stroke: "transparent", "stroke-width": 18 }));
      n.vias.forEach(function (v) {
        g.appendChild(svgEl("circle", { cx: v[0], cy: v[1], r: 4, fill: "var(--board-bg)", stroke: "var(--via-stroke)", "stroke-width": 1.5 }));
      });
      [n.chipPad, n.endPad].forEach(function (p) {
        g.appendChild(svgEl("rect", { x: p[0], y: p[1], width: p[2], height: p[3], fill: "var(--pad)" }));
      });
      svg.appendChild(g);
      groups[net.id] = [g];
    });

    // chip package on top
    svg.appendChild(svgEl("path", { d: geo.chip, fill: "var(--board-bg)", stroke: "var(--pad)", "stroke-width": 2 }));
    svg.appendChild(svgEl("circle", { cx: geo.pin1[0], cy: geo.pin1[1], r: 5, fill: "rgba(255,255,255,0.5)" }));

    // chip name
    var name = document.createElement("div");
    name.className = "chip-name";
    name.style.cssText = "left:" + geo.name.left + "px;top:" + geo.name.top + "px;width:" + geo.name.width + "px;font-size:" + geo.name.size + "px";
    name.textContent = "SAM\nJETT";
    var meta = document.createElement("div");
    meta.className = "chip-meta";
    meta.style.fontSize = geo.name.meta + "px";
    meta.textContent = "Stanford Physics, CS";
    name.appendChild(meta);
    stage.appendChild(name);

    // silkscreen labels
    geo.nets.forEach(function (n, i) {
      var net = NETS[i];
      var s = document.createElement("span");
      s.className = "silk-label";
      s.setAttribute("data-net", net.id);
      s.style.cssText = "left:" + n.silk[0] + "px;top:" + n.silk[1] + "px";
      s.textContent = net.label;
      stage.appendChild(s);
      groups[net.id].push(s);
    });

    // hover + click
    function setHot(id, hot) {
      groups[id].forEach(function (el) { el.classList.toggle("hot", hot); });
    }
    Object.keys(groups).forEach(function (id) {
      groups[id].forEach(function (el) {
        el.addEventListener("mouseenter", function () { setHot(id, true); });
        el.addEventListener("mouseleave", function () { setHot(id, false); });
        el.addEventListener("click", function () {
          for (var b = 0; b < 6; b++) {
            setTimeout(function () { spawn(netGeo[id], true); }, b * 130);
          }
        });
      });
    });

    // pips
    var live = 0;
    function spawn(onNet, burst) {
      if (live >= (burst ? 26 : 14) || !document.body.contains(stage)) return;
      var n = onNet || geo.nets[Math.floor(Math.random() * geo.nets.length)];
      var violet = Math.random() < 0.45;
      var size = violet ? 7 : 5;
      var pip = document.createElement("div");
      pip.className = "pip";
      pip.style.cssText =
        "width:" + size + "px;height:" + size + "px;" +
        "background:" + (violet ? "var(--pip-violet)" : "#ffffff") + ";" +
        "box-shadow:" + (violet
          ? "0 0 8px 2px rgba(139,92,246,0.85), 0 0 20px 6px rgba(139,92,246,0.35)"
          : "0 0 6px 1px rgba(255,255,255,0.8)") + ";" +
        "offset-path:path('" + n.pip + "');" +
        "animation:" + (Math.random() < 0.45 ? "pipMoveRev" : "pipMove") + " " +
        (2.5 + Math.random() * 4.5).toFixed(2) + "s linear 1";
      live++;
      pip.addEventListener("animationend", function () { pip.remove(); live--; });
      stage.appendChild(pip);
    }
    for (var i = 0; i < 5; i++) setTimeout(spawn, i * 350);
    if (container._pipTimer) clearInterval(container._pipTimer);
    container._pipTimer = setInterval(function () { if (Math.random() < 0.75) spawn(); }, 550);
  }

  function init() {
    var container = document.getElementById("board");
    if (!container) return;
    var mode = null;
    function render() {
      var next = container.clientWidth < 620 ? "compact" : "desktop";
      var geo = next === "compact" ? COMPACT : DESKTOP;
      if (next !== mode) { mode = next; build(container, geo); }
      else {
        // rescale only — outer wrapper is container.firstChild, stage is its firstChild
        var outer = container.firstChild;
        var stage = outer && outer.firstChild;
        if (!stage) { build(container, geo); return; }
        var scale = Math.min(container.clientWidth / geo.w, 1.2);
        stage.style.transform = "translateX(-50%) scale(" + scale + ")";
        outer.style.height = geo.h * scale + "px";
      }
    }
    render();
    var t;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(render, 120); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
