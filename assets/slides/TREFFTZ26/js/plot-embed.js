/* Helpers shared by the standalone pages in figs/ that the deck embeds through
 * <iframe class="slide-iframe">. Loaded as a plain script next to
 * js/plotly.min.js, so the embeds keep working offline. Everything except
 * forwardDeckNav() assumes the page is a plotly plot; that one is for any
 * embed at all. */

/* Give the deck back the keys and clicks the embed has no use for.
 *
 * An iframe is its own browsing context: the moment the pointer goes into one,
 * the focus is inside it, and the deck's own key handler and click-to-advance
 * never fire again. Mid-talk that reads as the deck having frozen -- the
 * clicker does nothing, `f` does nothing, and only the menu still responds.
 *
 * So the keys are handed up to js/slides.js, which answers them as if they had
 * arrived there directly:
 *
 *   - PageDown/PageUp (what a presenter clicker sends) and `f` always go up,
 *     since no control in an embed uses them;
 *   - arrows, space, Backspace, Home and End go up only when the focus is not
 *     in a control that needs them itself -- a focused slider must still be
 *     nudged by an arrow key rather than skipping the slide;
 *   - a click goes up only from the page's own background: a click on a plot,
 *     a canvas or a control belongs to the embed.
 *
 * `interactive` is a selector for anything in this page that owns its own
 * keys and clicks, on top of the form controls and links that always do. */
function forwardDeckNav(interactive = '') {   // eslint-disable-line no-unused-vars
  if (window.parent === window) return;

  const CONTROLS = ['input', 'select', 'textarea', 'button', 'a[href]']
    .concat(interactive ? [interactive] : []).join(', ');
  const ALWAYS = new Set(['PageDown', 'PageUp', 'f', 'F']);
  const WHEN_FREE = new Set(['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown',
    ' ', 'Backspace', 'Home', 'End']);
  const inControl = (target) => Boolean(target?.closest?.(CONTROLS));

  window.addEventListener('keydown', (e) => {
    const forward = ALWAYS.has(e.key) || (WHEN_FREE.has(e.key) && !inControl(e.target));
    if (!forward) return;
    // Space would scroll this document, arrows would nudge whatever the browser
    // decides is focusable next; neither should happen when the key was meant
    // for the deck. `f` is left alone: it is a plain letter here.
    if (e.key !== 'f' && e.key !== 'F') e.preventDefault();
    window.parent.postMessage({ type: 'html-talk-key', key: e.key }, '*');
  });

  window.addEventListener('click', (e) => {
    if (inControl(e.target)) return;
    // Same left-fifth/right-rest split the deck uses on its own slides, taken
    // across this frame -- which is the part of the slide it covers.
    window.parent.postMessage(
      { type: 'html-talk-click', x: e.clientX / window.innerWidth }, '*');
  });
}

/* A slide is display:none until it becomes active, so an embedded document can
 * parse while its container still measures 0x0 -- plotly bakes that first
 * measurement into its legend metrics and never re-derives it, and no later
 * resize or relayout undoes it. So only plot once the container has a size. */
function whenSized(el, cb) {           // eslint-disable-line no-unused-vars
  if (el.clientWidth > 0 && el.clientHeight > 0) { cb(); return; }
  const ro = new ResizeObserver(() => {
    if (el.clientWidth > 0 && el.clientHeight > 0) { ro.disconnect(); cb(); }
  });
  ro.observe(el);
}

/* Plotly's `responsive` config only listens for window resizes, but these
 * pages are laid out in a flex column inside an iframe, so the plot's own box
 * changes without the window doing anything -- when the legend row wraps, when
 * the zoom control changes the root font size, when the deck resizes the
 * iframe. Track the box itself and redraw to it. */
function autoResize(plotDiv) {         // eslint-disable-line no-unused-vars
  new ResizeObserver(() => Plotly.Plots.resize(plotDiv)).observe(plotDiv);
}

/* Follow the deck's zoom control: js/slides.js broadcasts the effective font
 * percentage to every iframe, and answers the ready-ping below for embeds that
 * only loaded after the last change. `base` maps plotly relayout paths to their
 * 100% value (e.g. {'font.size': 14, 'margin.b': 90}); each is scaled with the
 * zoom, and the page's own root font-size follows along, which is what carries
 * the zoom into the html legend and the controls under the plot. */
function followDeckZoom(plotDiv, base) {   // eslint-disable-line no-unused-vars
  window.addEventListener('message', (e) => {
    if (!e.data || e.data.type !== 'html-talk-zoom') return;
    const s = e.data.pct / 100;
    document.documentElement.style.fontSize = e.data.pct + '%';
    const patch = {};
    Object.keys(base).forEach((k) => { patch[k] = Math.round(base[k] * s); });
    Plotly.relayout(plotDiv, patch);
  });
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'html-talk-ready' }, '*');
  }
}

/* ---- html legend ---------------------------------------------------------
 * The static figures put their legend under the whole plot, centred and
 * without a frame. Plotly's own legend can be placed there, but its offset is
 * a fraction of the plotting area, so it walks into the x axis titles as soon
 * as the embed gets short -- which it does, in a slide column. This one is a
 * plain flex row under the plot instead: it cannot collide with anything, and
 * it scales with the root font-size, hence with the deck's zoom control.
 * Items are {key, label, color, fill, symbol, dash, width}; clicking one calls
 * onToggle(key, on). */
const LEGEND_MARKS = {
  circle: '<circle cx="17" cy="7" r="4.4"/>',
  pentagon: '<polygon points="17,2.3 21.6,5.6 19.8,11 14.2,11 12.4,5.6"/>',
  'triangle-up': '<polygon points="17,2.4 21.8,11 12.2,11"/>',
  diamond: '<polygon points="17,2 21.4,7 17,12 12.6,7"/>',
  square: '<rect x="13.2" y="3.2" width="7.6" height="7.6"/>',
};

function htmlLegend(el, items, onToggle) {   // eslint-disable-line no-unused-vars
  el.innerHTML = items.map((it) => {
    const dash = it.dash ? ` stroke-dasharray="${it.dash}"` : '';
    const mark = it.symbol
      ? `<g fill="${it.fill || it.color}" stroke="${it.color}" stroke-width="1.4">`
        + LEGEND_MARKS[it.symbol] + '</g>'
      : '';
    return `<span class="legend-item" data-key="${it.key}" role="button" tabindex="0">`
      + `<svg width="34" height="14" aria-hidden="true">`
      + `<line x1="1" y1="7" x2="33" y2="7" stroke="${it.color}"`
      + ` stroke-width="${it.width || 2.4}"${dash}/>${mark}</svg>`
      + `<span class="legend-label">${it.label}</span></span>`;
  }).join('');

  el.querySelectorAll('.legend-item').forEach((node) => {
    const toggle = () => {
      const off = node.classList.toggle('is-off');
      onToggle(node.dataset.key, !off);
    };
    node.addEventListener('click', toggle);
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
}
