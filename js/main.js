const MIN_SPLASH_MS = 2000;
const DEFAULT_LATEX = "\\frac{d}{dx}\\int_{a}^{x} f(t)\\,dt = f(x)";

/**
 * Resolve once fonts and KaTeX are usable.
 * Waits on the load event so the deferred KaTeX script has run, then on
 * document.fonts so math and Pretendard glyphs are ready before reveal.
 */
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

/**
 * Render a LaTeX string into the display, ignoring syntax errors so a
 * half-typed formula does not blank the output.
 */
function renderFormula(latex, target) {
  katex.render(latex, target, {
    displayMode: true,
    throwOnError: false,
  });
}

function hideLoader(loader, stage) {
  loader.classList.add("is-done");
  stage.hidden = false;
  loader.addEventListener(
    "transitionend",
    () => loader.remove(),
    { once: true }
  );
}

function init() {
  const loader = document.getElementById("loader");
  const stage = document.querySelector(".stage");
  const display = document.getElementById("display");
  const input = document.getElementById("formula");

  input.value = DEFAULT_LATEX;
  renderFormula(DEFAULT_LATEX, display);
  input.addEventListener("input", () => renderFormula(input.value, display));

  Promise.all([whenReady(), delay(MIN_SPLASH_MS)]).then(() =>
    hideLoader(loader, stage)
  );
}

window.addEventListener("DOMContentLoaded", init);
