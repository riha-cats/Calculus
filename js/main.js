import { compile, normalizeLatex } from "./parser.js";
import { createGraph } from "./graph.js";
import { renderMode, inShade, shadedArea } from "./modes.js";

const MIN_SPLASH_MS = 2000;
const DEFAULT_EXPR = "sin(x)";

function whenReady() {
  const loaded =
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise((r) => window.addEventListener("load", r, { once: true }));
  return loaded.then(() => document.fonts.ready);
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// display only; the parser is what actually evaluates the expression
function toLatexBody(expr) {
  let s = expr.replace(/sqrt\(([^()]+)\)/g, "\\sqrt{$1}");
  s = s.replace(/\b(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|ln|log|exp)\b/g, "\\$1 ");
  s = s.replace(/\bpi\b/g, "\\pi");
  s = s.replace(/\*/g, " \\cdot ");
  return s;
}

// clamp samples so one asymptote spike doesn't flatten the rest of the curve
function updateView(graph, fn) {
  const v = graph.getView();
  let lo = Infinity;
  let hi = -Infinity;
  const steps = 400;
  for (let i = 0; i <= steps; i++) {
    const x = v.xmin + (i / steps) * (v.xmax - v.xmin);
    const y = fn(x);
    if (isFinite(y) && Math.abs(y) < 1e4) {
      lo = Math.min(lo, y);
      hi = Math.max(hi, y);
    }
  }
  if (!isFinite(lo)) {
    graph.setView({ ...v, ymin: -3, ymax: 3 });
    return;
  }
  const pad = (hi - lo) * 0.15 || 1;
  graph.setView({ ...v, ymin: lo - pad, ymax: hi + pad });
}

function init() {
  const loader = document.getElementById("loader");
  const stage = document.querySelector(".stage");
  const display = document.getElementById("display");
  const input = document.getElementById("formula");
  const canvas = document.getElementById("graph");
  const bar = document.getElementById("bar");
  const readout = document.getElementById("readout");
  const tooltip = document.getElementById("tooltip");
  const modeButtons = [...document.querySelectorAll(".mode-btn")];

  const graph = createGraph(canvas);
  const state = { mode: "tangent", fn: null, c: 0 };

  function redraw() {
    graph.fit();
    graph.clear();
    graph.axes();
    if (!state.fn) return;
    graph.curve(state.fn);
    readout.textContent = renderMode(graph, state.mode, state.fn, state.c);
  }

  function applyExpr(src) {
    const text = src.trim();
    if (!text) return;
    let fn;
    try {
      fn = compile(normalizeLatex(text));
      fn(0);
    } catch {
      input.classList.add("is-error");
      return;
    }
    input.classList.remove("is-error");
    state.fn = fn;
    updateView(graph, fn);
    const body = text.includes("\\") ? text : toLatexBody(text);
    katex.render("f(x) = " + body, display, { displayMode: true, throwOnError: false });
    redraw();
  }

  function setMode(mode) {
    state.mode = mode;
    modeButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.mode === mode));
    tooltip.hidden = true;
    redraw();
  }

  input.value = DEFAULT_EXPR;
  applyExpr(DEFAULT_EXPR);
  input.addEventListener("input", () => applyExpr(input.value));

  modeButtons.forEach((b) =>
    b.addEventListener("click", () => setMode(b.dataset.mode))
  );

  bar.addEventListener("input", () => {
    const v = graph.getView();
    state.c = v.xmin + parseFloat(bar.value) * (v.xmax - v.xmin);
    redraw();
  });

  canvas.addEventListener("mousemove", (e) => {
    if (state.mode !== "ftc" || !state.fn) {
      tooltip.hidden = true;
      return;
    }
    const x = graph.worldX(e.offsetX);
    const y = graph.worldY(e.offsetY);
    if (inShade(state.fn, state.c, x, y)) {
      tooltip.hidden = false;
      tooltip.style.left = `${e.offsetX}px`;
      tooltip.style.top = `${e.offsetY}px`;
      tooltip.textContent = `area = ${shadedArea(state.fn, state.c).toFixed(3)}`;
    } else {
      tooltip.hidden = true;
    }
  });

  canvas.addEventListener("mouseleave", () => {
    tooltip.hidden = true;
  });

  window.addEventListener("resize", redraw);

  Promise.all([whenReady(), delay(MIN_SPLASH_MS)]).then(() => {
    loader.classList.add("is-done");
    stage.hidden = false;
    loader.addEventListener("transitionend", () => loader.remove(), { once: true });
    requestAnimationFrame(redraw);
  });
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
