const ACCENT = "#5b8cff";
const FILL = "rgba(91, 140, 255, 0.18)";
const ORIGIN = 0;
const RIEMANN_N = 24;

function derivative(fn, x) {
  const h = 1e-4;
  return (fn(x + h) - fn(x - h)) / (2 * h);
}

// trapezoid for accuracy; the Riemann rectangles stay coarse on purpose
function integral(fn, a, b, steps = 400) {
  const dx = (b - a) / steps;
  let sum = 0;
  for (let i = 0; i <= steps; i++) {
    const w = i === 0 || i === steps ? 0.5 : 1;
    sum += w * fn(a + i * dx);
  }
  return sum * dx;
}

function drawBar(g, c) {
  const { h } = g.size();
  g.ctx.save();
  g.ctx.strokeStyle = "rgba(91, 140, 255, 0.5)";
  g.ctx.lineWidth = 1.5;
  g.ctx.beginPath();
  g.ctx.moveTo(g.px(c), 0);
  g.ctx.lineTo(g.px(c), h);
  g.ctx.stroke();
  g.ctx.restore();
}

function drawDot(g, x, y) {
  g.ctx.fillStyle = ACCENT;
  g.ctx.beginPath();
  g.ctx.arc(g.px(x), g.py(y), 4, 0, Math.PI * 2);
  g.ctx.fill();
}

function tangent(g, fn, c) {
  const v = g.getView();
  const y0 = fn(c);
  const m = derivative(fn, c);

  g.ctx.strokeStyle = ACCENT;
  g.ctx.lineWidth = 1.5;
  g.ctx.beginPath();
  g.ctx.moveTo(g.px(v.xmin), g.py(y0 + m * (v.xmin - c)));
  g.ctx.lineTo(g.px(v.xmax), g.py(y0 + m * (v.xmax - c)));
  g.ctx.stroke();

  drawBar(g, c);
  drawDot(g, c, y0);
  return `x = ${c.toFixed(2)}    slope f'(x) = ${m.toFixed(3)}`;
}

function riemann(g, fn, c) {
  const dx = (c - ORIGIN) / RIEMANN_N;
  let area = 0;

  g.ctx.fillStyle = FILL;
  g.ctx.strokeStyle = "rgba(91, 140, 255, 0.6)";
  g.ctx.lineWidth = 1;
  for (let i = 0; i < RIEMANN_N; i++) {
    const x = ORIGIN + i * dx;
    const height = fn(x);
    area += height * dx;
    const left = g.px(x);
    const width = g.px(x + dx) - left;
    const top = g.py(height);
    const base = g.py(0);
    g.ctx.fillRect(left, base, width, top - base);
    g.ctx.strokeRect(left, base, width, top - base);
  }

  drawBar(g, c);
  return `area over [0, ${c.toFixed(2)}] ~ ${area.toFixed(3)}    (n = ${RIEMANN_N})`;
}

function fundamental(g, fn, c) {
  const steps = 160;
  const dx = (c - ORIGIN) / steps;

  g.ctx.fillStyle = FILL;
  g.ctx.beginPath();
  g.ctx.moveTo(g.px(ORIGIN), g.py(0));
  for (let i = 0; i <= steps; i++) {
    const x = ORIGIN + i * dx;
    g.ctx.lineTo(g.px(x), g.py(fn(x)));
  }
  g.ctx.lineTo(g.px(c), g.py(0));
  g.ctx.closePath();
  g.ctx.fill();

  const area = integral(fn, ORIGIN, c);
  drawBar(g, c);
  drawDot(g, c, fn(c));
  return `F(x) = area = ${area.toFixed(3)}    F'(x) = f(x) = ${fn(c).toFixed(3)}`;
}

export function shadedArea(fn, c) {
  return integral(fn, ORIGIN, c);
}

// shaded region spans 0..c, between the axis and the curve
export function inShade(fn, c, x, y) {
  const lo = Math.min(ORIGIN, c);
  const hi = Math.max(ORIGIN, c);
  if (x < lo || x > hi) return false;
  const fx = fn(x);
  if (!isFinite(fx)) return false;
  return y >= Math.min(0, fx) && y <= Math.max(0, fx);
}

export function renderMode(graph, mode, fn, c) {
  if (mode === "tangent") return tangent(graph, fn, c);
  if (mode === "riemann") return riemann(graph, fn, c);
  return fundamental(graph, fn, c);
}
