const GRID = "rgba(255, 255, 255, 0.05)";
const AXIS = "rgba(255, 255, 255, 0.3)";
const TICK = "rgba(255, 255, 255, 0.45)";
const CURVE = "#f2f2f2";
const TICK_LEN = 5;

export function createGraph(canvas) {
  const ctx = canvas.getContext("2d");
  let view = { xmin: -2 * Math.PI, xmax: 2 * Math.PI, ymin: -3, ymax: 3 };
  let w = 0;
  let h = 0;

  // must run while the canvas is visible; a hidden box measures as 0
  function fit() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    w = rect.width;
    h = rect.height;
  }

  const px = (x) => ((x - view.xmin) / (view.xmax - view.xmin)) * w;
  const py = (y) => h - ((y - view.ymin) / (view.ymax - view.ymin)) * h;

  function clear() {
    ctx.clearRect(0, 0, w, h);
  }

  function axes() {
    ctx.lineWidth = 1;
    ctx.strokeStyle = GRID;
    ctx.beginPath();
    for (let gx = Math.ceil(view.xmin); gx <= Math.floor(view.xmax); gx++) {
      ctx.moveTo(px(gx), 0);
      ctx.lineTo(px(gx), h);
    }
    for (let gy = Math.ceil(view.ymin); gy <= Math.floor(view.ymax); gy++) {
      ctx.moveTo(0, py(gy));
      ctx.lineTo(w, py(gy));
    }
    ctx.stroke();

    const y0 = py(0);
    const x0 = px(0);
    ctx.strokeStyle = AXIS;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.lineTo(w, y0);
    ctx.moveTo(x0, 0);
    ctx.lineTo(x0, h);
    ctx.stroke();

    // short ticks on each axis; skip 0 so the crossing stays clean
    ctx.strokeStyle = TICK;
    ctx.beginPath();
    for (let gx = Math.ceil(view.xmin); gx <= Math.floor(view.xmax); gx++) {
      if (gx === 0) continue;
      ctx.moveTo(px(gx), y0 - TICK_LEN);
      ctx.lineTo(px(gx), y0 + TICK_LEN);
    }
    for (let gy = Math.ceil(view.ymin); gy <= Math.floor(view.ymax); gy++) {
      if (gy === 0) continue;
      ctx.moveTo(x0 - TICK_LEN, py(gy));
      ctx.lineTo(x0 + TICK_LEN, py(gy));
    }
    ctx.stroke();
  }

  // lift the pen on gaps and big jumps, otherwise asymptotes get bridged
  function curve(fn, color = CURVE) {
    const span = view.ymax - view.ymin;
    // glow is isolated here so the mode overlays don't inherit shadowBlur
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.lineJoin = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 7;
    ctx.beginPath();

    let prevY = null;
    let drawing = false;
    for (let sx = 0; sx <= w; sx++) {
      const x = view.xmin + (sx / w) * (view.xmax - view.xmin);
      const y = fn(x);
      if (!isFinite(y) || (prevY !== null && Math.abs(y - prevY) > span * 4)) {
        drawing = false;
        prevY = isFinite(y) ? y : null;
        continue;
      }
      if (drawing) ctx.lineTo(sx, py(y));
      else {
        ctx.moveTo(sx, py(y));
        drawing = true;
      }
      prevY = y;
    }
    ctx.stroke();
    ctx.restore();
  }

  return {
    ctx,
    fit,
    clear,
    axes,
    curve,
    px,
    py,
    worldX: (sx) => view.xmin + (sx / w) * (view.xmax - view.xmin),
    worldY: (sy) => view.ymax - (sy / h) * (view.ymax - view.ymin),
    getView: () => view,
    setView: (v) => {
      view = v;
    },
    size: () => ({ w, h }),
  };
}
