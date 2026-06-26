const GRID = "rgba(255, 255, 255, 0.06)";
const AXIS = "rgba(255, 255, 255, 0.35)";
const CURVE = "#f2f2f2";

/**
 * Build a 2D plotter over a canvas with a world coordinate view.
 * fit() must run while the canvas is visible so its CSS box has a size.
 */
export function createGraph(canvas) {
  const ctx = canvas.getContext("2d");
  let view = { xmin: -6.5, xmax: 6.5, ymin: -3, ymax: 3 };
  let w = 0;
  let h = 0;

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

    ctx.strokeStyle = AXIS;
    ctx.beginPath();
    ctx.moveTo(0, py(0));
    ctx.lineTo(w, py(0));
    ctx.moveTo(px(0), 0);
    ctx.lineTo(px(0), h);
    ctx.stroke();
  }

  /**
   * Stroke y = fn(x) across the viewport, lifting the pen on non-finite
   * values and on large jumps so vertical asymptotes are not bridged.
   */
  function curve(fn, color = CURVE) {
    const span = view.ymax - view.ymin;
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
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
  }

  return {
    ctx,
    fit,
    clear,
    axes,
    curve,
    px,
    py,
    getView: () => view,
    setView: (v) => {
      view = v;
    },
    size: () => ({ w, h }),
  };
}
