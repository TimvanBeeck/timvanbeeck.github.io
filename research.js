/* ════════════════════════════════════════════════════
   research.html — interactive figures
   Loaded after script.js (which fills the .research-ref cards).
   ════════════════════════════════════════════════════ */

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(name, attrs = {}, text) {
  const el = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text !== undefined) el.textContent = text;
  return el;
}

/* ── Segmented buttons: mark the clicked one active ── */
function activate(btn) {
  btn.parentElement.querySelectorAll('.seg-btn').forEach(b => {
    b.classList.toggle('is-active', b === btn);
    b.setAttribute('aria-pressed', b === btn);
  });
}

/* ── Captions that change with a button: every variant is laid out in the same
   grid cell and only the active one is visible, so the caption is always as tall
   as its longest variant and switching never moves the layout. ── */
function stackCaption(caption, buttons) {
  if (!caption) return () => {};
  const texts = [caption.textContent.trim()];
  buttons.forEach(b => {
    if (b.dataset.caption && !texts.includes(b.dataset.caption)) texts.push(b.dataset.caption);
  });
  caption.textContent = '';
  caption.classList.add('caption-stack');
  const spans = texts.map((t, i) => {
    const span = document.createElement('span');
    span.textContent = t;
    if (i) span.classList.add('is-off');
    caption.append(span);
    return span;
  });
  return text => {
    if (!text) return;
    spans.forEach(span => span.classList.toggle('is-off', span.textContent !== text));
  };
}

/* ── Live readouts: only ever grow, so a longer value never pushes the page
   down and back up again. Reset when the width changes, since that rewraps. ── */
function holdHeight(el) {
  let width = el.clientWidth;
  return () => {
    if (el.clientWidth !== width) { width = el.clientWidth; el.style.minHeight = ''; }
    el.style.minHeight = el.offsetHeight + 'px';
  };
}

/* ════════════════════════════════════════════════════
   Image switchers (surface flows, Sun)
   A .seg-btn with data-src swaps the figure's image and, if it carries
   data-caption, the caption. Buttons with data-group switch between
   sub-rows of buttons (.fig-controls--sub[data-for]).
   ════════════════════════════════════════════════════ */

document.querySelectorAll('.switcher').forEach(fig => {
  const img = fig.querySelector('.switcher-img');
  const setCaption = stackCaption(fig.querySelector('.switcher-caption'),
                                  fig.querySelectorAll('.seg-btn[data-caption]'));

  function show(btn) {
    activate(btn);
    if (img.getAttribute('src') !== btn.dataset.src) {
      img.classList.add('is-swapping');
      const next = new Image();
      next.onload = next.onerror = () => {
        img.src = btn.dataset.src;
        img.classList.remove('is-swapping');
      };
      next.src = btn.dataset.src;
    }
    setCaption(btn.dataset.caption);
  }

  fig.querySelectorAll('.seg-btn[data-src]').forEach(btn => {
    btn.addEventListener('click', () => show(btn));
    // warm the cache so the swap is instant
    btn.addEventListener('pointerenter', () => { new Image().src = btn.dataset.src; }, { once: true });
  });

  fig.querySelectorAll('.seg-btn[data-group]').forEach(btn => {
    btn.addEventListener('click', () => {
      activate(btn);
      fig.querySelectorAll('.fig-controls--sub').forEach(row => {
        row.classList.toggle('is-off', row.dataset.for !== btn.dataset.group);
      });
      const row = fig.querySelector(`.fig-controls--sub[data-for="${btn.dataset.group}"]`);
      show(row.querySelector('.seg-btn.is-active') || row.querySelector('.seg-btn'));
    });
  });
});

/* ════════════════════════════════════════════════════
   Click-to-load embeds (nematic drum, 3D scattering scenes)
   ════════════════════════════════════════════════════ */

function loadEmbed(slot, src) {
  slot.querySelectorAll('iframe, .embed-load, .embed-alt').forEach(el => el.remove());
  const frame = document.createElement('iframe');
  frame.src = src;
  frame.title = slot.dataset.title || '';
  frame.loading = 'lazy';
  slot.appendChild(frame);
  slot.classList.add('is-loaded');
  slot.dataset.src = src;
}

document.querySelectorAll('.embed-slot').forEach(slot => {
  const btn = slot.querySelector('.embed-load');
  if (btn) btn.addEventListener('click', () => loadEmbed(slot, slot.dataset.src));
});

/* Figures whose buttons switch between embedded scenes (resonator, scattering).
   Before the first load a button only changes what will be loaded; afterwards it
   swaps the scene. A data-caption on the button replaces the figure's caption. */
document.querySelectorAll('.research-fig').forEach(fig => {
  const slot = fig.querySelector('.embed-slot');
  const setCaption = stackCaption(fig.querySelector('.embed-caption'),
                                  fig.querySelectorAll('.seg-btn[data-caption]'));
  fig.querySelectorAll('.seg-btn[data-embed]').forEach(btn => {
    btn.addEventListener('click', () => {
      activate(btn);
      if (slot.classList.contains('is-loaded')) loadEmbed(slot, btn.dataset.embed);
      else slot.dataset.src = btn.dataset.embed;
      setCaption(btn.dataset.caption);
    });
  });
});

/* ════════════════════════════════════════════════════
   Axisymmetric Stokes: error against unknowns, 3D vs. 2D
   Data: H(div)-HDG, k = 1, annular cylinder, manufactured solution.
   [unknowns, L2 velocity error]; the 3D error does not depend on nu.
   ════════════════════════════════════════════════════ */

(function costChart() {
  const svg = document.getElementById('cost-chart');
  if (!svg) return;

  const D3 = [[15315, 1.495], [36571, 0.6073], [98477, 0.3204], [323682, 0.1293]];
  const D2 = {
    '1':    [[1690, 0.04658], [6642, 0.01233], [26360, 0.003188], [104464, 0.000801], [416142, 0.0002034], [1659278, 5.119e-05]],
    '1e-2': [[1690, 0.04823], [6642, 0.01296], [26360, 0.003361], [104464, 0.0008422], [416142, 0.0002138], [1659278, 5.377e-05]],
    '1e-4': [[1690, 0.8332], [6642, 0.183], [26360, 0.0506], [104464, 0.01261], [416142, 0.003239], [1659278, 0.0008043]],
    '1e-6': [[1690, 82.66], [6642, 17.9], [26360, 4.961], [104464, 1.238], [416142, 0.318], [1659278, 0.07896]],
    '1e-8': [[1690, 8265], [6642, 1790], [26360, 496], [104464, 123.7], [416142, 31.8], [1659278, 7.894]],
  };
  const NU_LABEL = { '1': '1', '1e-2': '10⁻²', '1e-4': '10⁻⁴', '1e-6': '10⁻⁶', '1e-8': '10⁻⁸' };
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const pow10 = e => '10' + String(e).split('').map(c => SUP[c]).join('');

  const W = 560, H = 360, M = { l: 58, r: 20, t: 16, b: 46 };
  const X = [3, 8.5], Y = [-5, 4.3];           // log10 ranges
  const x = n => M.l + (Math.log10(n) - X[0]) / (X[1] - X[0]) * (W - M.l - M.r);
  const y = e => H - M.b - (Math.log10(e) - Y[0]) / (Y[1] - Y[0]) * (H - M.t - M.b);
  const path = pts => pts.map(([n, e], i) => `${i ? 'L' : 'M'}${x(n).toFixed(1)},${y(e).toFixed(1)}`).join('');

  const target = D3[D3.length - 1];            // finest 3D run
  const tip = document.getElementById('cost-tip');
  const readout = document.getElementById('cost-readout');
  const holdReadout = holdHeight(readout);

  /* Unknowns the 2D method needs to reach the target error: log-log
     interpolation between runs, extrapolation with the last/first slope outside. */
  function unknownsAtTarget(pts) {
    const L = pts.map(([n, e]) => [Math.log10(n), Math.log10(e)]);
    const t = Math.log10(target[1]);
    let i = L.findIndex(([, e]) => e <= t);
    let extrapolated = false;
    if (i === -1) { i = L.length - 1; extrapolated = true; }
    if (i === 0)  { i = 1; extrapolated = true; }
    const [n0, e0] = L[i - 1], [n1, e1] = L[i];
    return { n: 10 ** (n0 + (t - e0) * (n1 - n0) / (e1 - e0)), extrapolated };
  }

  function fmt(v) {
    if (v >= 100) return Math.round(v / 10) * 10 + '';
    if (v >= 10) return Math.round(v) + '';
    return v.toPrecision(2);
  }

  function draw(nu) {
    svg.replaceChildren();
    const pts = D2[nu];

    // grid and axes
    for (let e = Y[0]; e <= 4; e++) {
      const yy = y(10 ** e);
      svg.append(svgEl('line', { class: 'grid', x1: M.l, x2: W - M.r, y1: yy, y2: yy }));
      if ((e - Y[0]) % 2 === 1) svg.append(svgEl('text', { x: M.l - 8, y: yy + 4, 'text-anchor': 'end' }, pow10(e)));
    }
    for (let e = X[0]; e <= 8; e++) {
      const xx = x(10 ** e);
      svg.append(svgEl('line', { class: 'axis', x1: xx, x2: xx, y1: H - M.b, y2: H - M.b + 5 }));
      svg.append(svgEl('text', { x: xx, y: H - M.b + 19, 'text-anchor': 'middle' }, pow10(e)));
    }
    svg.append(svgEl('line', { class: 'axis', x1: M.l, x2: W - M.r, y1: H - M.b, y2: H - M.b }));
    svg.append(svgEl('text', { class: 'axis-title', x: (M.l + W - M.r) / 2, y: H - 8, 'text-anchor': 'middle' }, 'number of unknowns'));
    svg.append(svgEl('text', { class: 'axis-title', x: 14, y: (M.t + H - M.b) / 2, 'text-anchor': 'middle',
      transform: `rotate(-90 14 ${(M.t + H - M.b) / 2})` }, 'L² velocity error'));

    // target level: the error of the finest 3D run
    const hit = unknownsAtTarget(pts);
    const inRange = Math.log10(hit.n) <= X[1] && Math.log10(hit.n) >= X[0];
    svg.append(svgEl('line', { class: 'target', x1: M.l, x2: W - M.r, y1: y(target[1]), y2: y(target[1]) }));

    // 2D: extrapolation to the target if the runs do not reach it
    if (hit.extrapolated && inRange) {
      const from = hit.n > pts[pts.length - 1][0] ? pts[pts.length - 1] : pts[0];
      svg.append(svgEl('path', { class: 'line line--2d line--extra', d: path([from, [hit.n, target[1]]]) }));
    }
    svg.append(svgEl('path', { class: 'line line--3d', d: path(D3) }));
    svg.append(svgEl('path', { class: 'line line--2d', d: path(pts) }));
    if (inRange) svg.append(svgEl('circle', { class: 'cross', cx: x(hit.n), cy: y(target[1]), r: 5 }));

    // points with hover targets
    const series = [
      { name: '3D, pressure-robust', cls: '3d', data: D3 },
      { name: `2D axisymmetric, ν = ${NU_LABEL[nu]}`, cls: '2d', data: pts },
    ];
    series.forEach(s => s.data.forEach(([n, e]) => {
      svg.append(svgEl('circle', { class: `dot dot--${s.cls}`, cx: x(n), cy: y(e), r: 4.5 }));
      const target = svgEl('circle', { class: 'hit', cx: x(n), cy: y(e), r: 13, tabindex: 0 });
      const showTip = () => {
        tip.innerHTML = `<b>${s.name}</b><br>${n.toLocaleString('en-US')} unknowns<br>error ${e.toExponential(2)}`;
        tip.style.left = (x(n) / W * 100) + '%';
        tip.style.top = (y(e) / H * 100) + '%';
        tip.hidden = false;
      };
      target.addEventListener('pointerenter', showTip);
      target.addEventListener('focus', showTip);
      target.addEventListener('pointerleave', () => { tip.hidden = true; });
      target.addEventListener('blur', () => { tip.hidden = true; });
      svg.append(target);
    }));

    // direct labels
    svg.append(svgEl('text', { class: 'direct-label', x: x(D3[0][0]) - 8, y: y(D3[0][1]) + 18, 'text-anchor': 'end' }, '3D, robust'));
    const last = pts[pts.length - 1], below = y(last[1]) < y(target[1]) - 30 || y(last[1]) > H - M.b - 30;
    svg.append(svgEl('text', { class: 'direct-label', x: x(last[0]) + 8, y: y(last[1]) + (below ? -12 : 20),
      'text-anchor': 'end' }, '2D axisymmetric'));

    // readout
    const ratio = hit.n / target[0];
    const approx = hit.extrapolated ? ' (extrapolated)' : '';
    readout.innerHTML = ratio < 1
      ? `To match the finest 3D run, the 2D reduction needs about <strong>${fmt(1 / ratio)}× fewer</strong> unknowns${approx}.`
      : `To match the finest 3D run, the 2D reduction needs about <strong>${fmt(ratio)}× more</strong> unknowns${approx}.`;
    holdReadout();
  }

  // viscosity buttons
  const group = document.getElementById('cost-nu');
  Object.keys(D2).forEach(nu => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seg-btn';
    btn.textContent = NU_LABEL[nu];
    btn.addEventListener('click', () => { activate(btn); draw(nu); });
    group.append(btn);
    if (nu === '1e-6') { activate(btn); }
  });
  draw('1e-6');
})();

/* ════════════════════════════════════════════════════
   Unfitted meshes: a draggable domain on a fixed background mesh
   The boundary is the zero level of phi = |x - c| - r, interpolated
   linearly on each triangle, as in an unfitted method with a P1 level set.
   ════════════════════════════════════════════════════ */

(function cutMesh() {
  const svg = document.getElementById('cut-svg');
  if (!svg) return;
  const slider = document.getElementById('cut-radius');
  const readout = document.getElementById('cut-readout');
  const holdReadout = holdHeight(readout);

  const S = 400, N = 10, h = 1 / N;
  const state = { cx: 0.512, cy: 0.487, r: parseFloat(slider.value) };

  // structured triangulation of the unit square
  const tris = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const a = [i * h, j * h], b = [(i + 1) * h, j * h], c = [(i + 1) * h, (j + 1) * h], d = [i * h, (j + 1) * h];
    if ((i + j) % 2) tris.push([a, b, d], [b, c, d]); else tris.push([a, b, c], [a, c, d]);
  }
  const els = tris.map(t => {
    const el = svgEl('polygon', { class: 'tri', points: t.map(p => `${p[0] * S},${(1 - p[1]) * S}`).join(' ') });
    svg.append(el);
    return el;
  });
  const bnd = svgEl('circle', { class: 'bnd' });
  svg.append(bnd);

  const area = P => Math.abs(P.reduce((s, p, i) => {
    const q = P[(i + 1) % P.length];
    return s + p[0] * q[1] - q[0] * p[1];
  }, 0)) / 2;

  // fraction of the triangle where the linear interpolant of phi is negative
  function insideFraction(t, phi) {
    const P = [];
    for (let i = 0; i < 3; i++) {
      const j = (i + 1) % 3;
      if (phi[i] < 0) P.push(t[i]);
      if ((phi[i] < 0) !== (phi[j] < 0)) {
        const s = phi[i] / (phi[i] - phi[j]);
        P.push([t[i][0] + s * (t[j][0] - t[i][0]), t[i][1] + s * (t[j][1] - t[i][1])]);
      }
    }
    return P.length < 3 ? 0 : area(P) / area(t);
  }

  function render() {
    const { cx, cy, r } = state;
    let inner = 0, cut = 0, smallest = 1, smallestEl = null;
    tris.forEach((t, k) => {
      const phi = t.map(p => Math.hypot(p[0] - cx, p[1] - cy) - r);
      const neg = phi.filter(v => v < 0).length;
      let cls = 'tri';
      if (neg === 3) { cls += ' tri--inner'; inner++; }
      else if (neg > 0) {
        cls += ' tri--cut'; cut++;
        const f = insideFraction(t, phi);
        if (f < smallest) { smallest = f; smallestEl = els[k]; }
      }
      els[k].setAttribute('class', cls);
    });
    if (smallestEl) smallestEl.setAttribute('class', 'tri tri--small');
    bnd.setAttribute('cx', cx * S);
    bnd.setAttribute('cy', (1 - cy) * S);
    bnd.setAttribute('r', r * S);
    const pct = smallest * 100;
    readout.innerHTML = `Active mesh: ${inner + cut} elements, ${cut} of them cut. `
      + `Smallest cut: <strong>${pct < 0.1 ? pct.toExponential(0) : pct.toPrecision(2)}%</strong> of its element.`;
    holdReadout();
  }

  function moveTo(evt) {
    const box = svg.getBoundingClientRect();
    const m = state.r + 0.02;
    state.cx = Math.min(1 - m, Math.max(m, (evt.clientX - box.left) / box.width));
    state.cy = Math.min(1 - m, Math.max(m, 1 - (evt.clientY - box.top) / box.height));
    render();
  }

  svg.addEventListener('pointerdown', e => {
    svg.setPointerCapture(e.pointerId);
    svg.classList.add('is-dragging');
    moveTo(e);
  });
  svg.addEventListener('pointermove', e => { if (svg.classList.contains('is-dragging')) moveTo(e); });
  ['pointerup', 'pointercancel'].forEach(t => svg.addEventListener(t, () => svg.classList.remove('is-dragging')));

  svg.addEventListener('keydown', e => {
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    if (!step) return;
    e.preventDefault();
    const m = state.r + 0.02;
    state.cx = Math.min(1 - m, Math.max(m, state.cx + step[0] * 0.005));
    state.cy = Math.min(1 - m, Math.max(m, state.cy + step[1] * 0.005));
    render();
  });

  slider.addEventListener('input', () => {
    state.r = parseFloat(slider.value);
    const m = state.r + 0.02;
    state.cx = Math.min(1 - m, Math.max(m, state.cx));
    state.cy = Math.min(1 - m, Math.max(m, state.cy));
    render();
  });

  render();
})();

/* ════════════════════════════════════════════════════
   Keyed video: the renders have a near-black background (about rgb 17),
   which is made transparent frame by frame on a canvas. Plays muted and
   looping while on screen; a pause by the viewer sticks. The file is only
   fetched once the figure first scrolls into view.
   ════════════════════════════════════════════════════ */

document.querySelectorAll('.keyed-video').forEach(box => {
  const video = box.querySelector('video');
  const canvas = box.querySelector('canvas');
  const btn = box.querySelector('.video-toggle');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BG = 17, LO = 24, HI = 52;   // max channel <= LO: transparent, >= HI: opaque

  function fallback() {
    box.classList.add('is-fallback');
    video.controls = true;
    video.poster = video.dataset.poster;
  }

  function drawKeyed(src) {
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    let img;
    try { img = ctx.getImageData(0, 0, canvas.width, canvas.height); }
    catch (e) { fallback(); return false; }   // e.g. opened from file://
    const d = img.data;
    for (let k = 0; k < d.length; k += 4) {
      const m = Math.max(d[k], d[k + 1], d[k + 2]);
      if (m >= HI) continue;
      if (m <= LO) { d[k + 3] = 0; continue; }
      const a = (m - LO) / (HI - LO);
      // undo the blend with the dark background, so edges do not get a grey halo
      const lift = BG * (1 - a);
      d[k] = Math.min(255, (d[k] - lift) / a);
      d[k + 1] = Math.min(255, (d[k + 1] - lift) / a);
      d[k + 2] = Math.min(255, (d[k + 2] - lift) / a);
      d[k + 3] = Math.round(255 * a);
    }
    ctx.putImageData(img, 0, 0);
    return true;
  }

  // the poster, keyed the same way, until the video plays
  const poster = new Image();
  poster.onload = () => { if (video.paused && video.currentTime === 0) drawKeyed(poster); };
  poster.src = video.dataset.poster;

  const useVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
  function loop() {
    if (video.paused || video.ended) return;
    if (video.readyState >= 2 && !drawKeyed(video)) return;
    useVFC ? video.requestVideoFrameCallback(loop) : requestAnimationFrame(loop);
  }

  let userPaused = false;
  const setIcon = () => {
    btn.innerHTML = video.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    btn.setAttribute('aria-label', video.paused ? 'Play' : 'Pause');
  };
  video.addEventListener('play', () => { setIcon(); loop(); });
  video.addEventListener('pause', setIcon);

  const toggle = () => {
    if (video.paused) { userPaused = false; video.play().catch(() => {}); }
    else { userPaused = true; video.pause(); }
  };
  btn.addEventListener('click', toggle);
  canvas.addEventListener('click', toggle);

  if (reduced || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { if (!userPaused) video.play().catch(() => {}); }
    else if (!video.paused) video.pause();
  }, { threshold: 0.5 }).observe(box);
});

/* ════════════════════════════════════════════════════
   Axisymmetric reduction: the meridian domain (r, z) is swept around the
   symmetry axis to build the 3D domain; one point traces its circle.
   Left: oblique 3D view. Right: the flat 2D meridian domain with a mesh.
   ════════════════════════════════════════════════════ */

(function axisymSketch() {
  const canvas = document.getElementById('axisym-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the meridian domain: 0 <= r <= R(z), 0 <= z <= H (a vase touching the axis)
  const H = 1.4;
  const R = z => 0.42 + 0.16 * Math.sin(Math.PI * (1.25 * z / H + 0.15)) + 0.1 * (z / H) ** 3;
  const NZ = 28;
  const prof = Array.from({ length: NZ + 1 }, (_, i) => { const z = H * i / NZ; return [R(z), z]; });
  const RMAX = Math.max(...prof.map(p => p[0]));
  const P = { r: 0.36, z: 0.62 };          // the marked point

  // timeline (seconds): fade in, sweep, hold, fade out
  const T_IN = 0.8, T_SWEEP = 4.2, T_HOLD = 2.6, T_OUT = 0.8;
  const PERIOD = T_IN + T_SWEEP + T_HOLD + T_OUT;
  const ease = u => u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;

  const EL = 0.42, AZ = -0.5;              // camera elevation and azimuth
  let W = 0, Hc = 0, dpr = 1, S = 1, cx3 = 0, cy3 = 0;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; Hc = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(Hc * dpr);
    const w3 = W * 0.58;
    S = Math.min(w3 / (2 * RMAX + 0.3), (Hc - 50) / (H * Math.cos(EL) + 2 * RMAX * Math.sin(EL) + 0.45));
    cx3 = w3 / 2;
    cy3 = (Hc + 24) / 2 + S * (H * Math.cos(EL) - 2 * RMAX * Math.sin(EL)) / 2;
  }

  // 3D (r, phi, z) -> screen (x, y) and depth (> 0: towards the viewer)
  function proj(r, phi, z) {
    const x = r * Math.cos(phi), y = r * Math.sin(phi);
    const xs = x * Math.cos(AZ) - y * Math.sin(AZ);
    const d = x * Math.sin(AZ) + y * Math.cos(AZ);
    return [cx3 + S * xs, cy3 - S * z * Math.cos(EL) + S * d * Math.sin(EL), d];
  }

  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const RED = '#c0392b';

  // polyline in 3D, faded where it lies behind the axis
  function arc3(r, z, phi0, phi1, color, width, alphaFront, alphaBack) {
    const n = Math.max(2, Math.ceil(Math.abs(phi1 - phi0) / 0.05));
    let prev = proj(r, phi0, z);
    ctx.lineWidth = width; ctx.strokeStyle = color; ctx.lineCap = 'round';
    for (let i = 1; i <= n; i++) {
      const cur = proj(r, phi0 + (phi1 - phi0) * i / n, z);
      const front = (prev[2] + cur[2]) / 2 >= 0;
      ctx.globalAlpha = front ? alphaFront : alphaBack;
      ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(cur[0], cur[1]); ctx.stroke();
      prev = cur;
    }
    ctx.globalAlpha = 1;
  }

  function slicePath(phi) {
    ctx.beginPath();
    let p = proj(0, phi, 0); ctx.moveTo(p[0], p[1]);
    for (const [r, z] of prof) { p = proj(r, phi, z); ctx.lineTo(p[0], p[1]); }
    p = proj(0, phi, H); ctx.lineTo(p[0], p[1]);
    ctx.closePath();
  }

  function draw3D(sweep, fade) {
    const accent = css('--accent'), ink = css('--text'), muted = css('--text-muted');
    // swept body: latitude rings and meridians every 30 degrees
    for (let i = 0; i <= NZ; i += 4) {
      const [r, z] = prof[i];
      arc3(r, z, 0, sweep, accent, 1.1, 0.75 * fade, 0.22 * fade);
    }
    for (let k = 1; k * Math.PI / 6 <= sweep + 1e-6 && k < 12; k++) {
      const phi = k * Math.PI / 6;
      const front = proj(RMAX, phi, H / 2)[2] >= 0;
      ctx.globalAlpha = (front ? 0.55 : 0.18) * fade;
      ctx.strokeStyle = accent; ctx.lineWidth = 1;
      ctx.beginPath();
      prof.forEach(([r, z], i) => { const p = proj(r, phi, z); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // symmetry axis
    const a0 = proj(0, 0, -0.18), a1 = proj(0, 0, H + 0.22);
    ctx.setLineDash([5, 4]); ctx.strokeStyle = RED; ctx.lineWidth = 1.3; ctx.globalAlpha = fade;
    ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke();
    ctx.setLineDash([]);

    // the rotating meridian slice
    slicePath(sweep);
    ctx.globalAlpha = 0.3 * fade; ctx.fillStyle = accent; ctx.fill();
    ctx.globalAlpha = fade; ctx.strokeStyle = accent; ctx.lineWidth = 1.8; ctx.stroke();

    // the marked point and the circle it traces
    arc3(P.r, P.z, 0, sweep, RED, 2, 0.95 * fade, 0.4 * fade);
    const pp = proj(P.r, sweep, P.z);
    ctx.globalAlpha = fade; ctx.fillStyle = RED;
    ctx.beginPath(); ctx.arc(pp[0], pp[1], 4, 0, 2 * Math.PI); ctx.fill();

    // labels
    ctx.globalAlpha = fade;
    ctx.font = '600 13px system-ui, sans-serif'; ctx.fillStyle = ink; ctx.textAlign = 'center';
    ctx.fillText('3D domain', cx3, 16);
    ctx.font = '12px system-ui, sans-serif'; ctx.fillStyle = muted; ctx.textAlign = 'left';
    ctx.fillText(`θ = ${Math.round(sweep * 180 / Math.PI)}°`, 6, Hc - 8);
    ctx.globalAlpha = 1;
  }

  function draw2D() {
    const accent = css('--accent'), ink = css('--text'), muted = css('--text-muted');
    const x0 = W * 0.64, w2 = W * 0.33;
    const s = Math.min(w2 / (RMAX + 0.3), (Hc - 70) / (H + 0.1));
    const ox = x0 + 22, oy = Hc - 26;
    const X = r => ox + s * r, Y = z => oy - s * z;

    // structured triangular mesh of the meridian domain
    const NR = 5, NZM = 10;
    const node = (i, j) => { const z = H * j / NZM; return [X(R(z) * i / NR), Y(z)]; };
    const outline = () => {
      ctx.beginPath(); ctx.moveTo(X(0), Y(0));
      for (const [r, z] of prof) ctx.lineTo(X(r), Y(z));
      ctx.lineTo(X(0), Y(H));
    };
    outline(); ctx.closePath();
    ctx.globalAlpha = 0.16; ctx.fillStyle = accent; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = accent; ctx.globalAlpha = 0.35; ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let j = 0; j < NZM; j++) for (let i = 0; i < NR; i++) {
      const a = node(i, j), b = node(i + 1, j), c = node(i + 1, j + 1), d = node(i, j + 1);
      ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...a); ctx.lineTo(...d); ctx.lineTo(...c);
    }
    ctx.stroke(); ctx.globalAlpha = 1;

    // boundary
    outline();
    ctx.strokeStyle = accent; ctx.lineWidth = 1.8; ctx.stroke();

    // axis r = 0, part of the 2D boundary
    ctx.setLineDash([5, 4]); ctx.strokeStyle = RED; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(X(0), Y(-0.05)); ctx.lineTo(X(0), Y(H + 0.08)); ctx.stroke();
    ctx.setLineDash([]);

    // the marked point
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(X(P.r), Y(P.z), 4, 0, 2 * Math.PI); ctx.fill();

    // r axis and labels
    ctx.strokeStyle = muted; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X(0), oy + 8); ctx.lineTo(X(RMAX + 0.12), oy + 8); ctx.stroke();
    ctx.font = 'italic 12px Georgia, serif'; ctx.fillStyle = muted; ctx.textAlign = 'left';
    ctx.fillText('r', X(RMAX + 0.12) + 4, oy + 12);
    ctx.fillText('z', X(0) - 4, Y(H + 0.08) - 6);
    ctx.save();
    ctx.translate(X(0) - 8, Y(H / 2)); ctx.rotate(-Math.PI / 2);
    ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = RED; ctx.textAlign = 'center';
    ctx.fillText('axis r = 0', 0, 0);
    ctx.restore();
    ctx.font = '600 13px system-ui, sans-serif'; ctx.fillStyle = ink; ctx.textAlign = 'center';
    ctx.fillText('2D meridian domain', x0 + w2 / 2, 16);
  }

  function render(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hc);
    let sweep, fade;
    if (t < T_IN) { sweep = 0; fade = t / T_IN; }
    else if (t < T_IN + T_SWEEP) { sweep = 2 * Math.PI * ease((t - T_IN) / T_SWEEP); fade = 1; }
    else if (t < T_IN + T_SWEEP + T_HOLD) { sweep = 2 * Math.PI; fade = 1; }
    else { sweep = 2 * Math.PI; fade = 1 - (t - T_IN - T_SWEEP - T_HOLD) / T_OUT; }
    draw3D(sweep, Math.max(0.0, fade));
    draw2D();
  }

  let t = 0, last = null, frame = null, visible = false;
  function tick(now) {
    frame = null;
    if (last !== null) t = (t + Math.min(0.1, (now - last) / 1000)) % PERIOD;
    last = now;
    render(t);
    schedule();
  }
  function schedule() {
    if (visible && !reduced && frame === null) frame = requestAnimationFrame(tick);
    if (!visible) { if (frame !== null) cancelAnimationFrame(frame); frame = null; last = null; }
  }

  new ResizeObserver(() => {
    if (!canvas.clientWidth) return;
    resize();
    render(reduced ? T_IN + T_SWEEP + 0.1 : t);
  }).observe(canvas);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }).observe(canvas);
})();

/* ════════════════════════════════════════════════════
   Fitted vs unfitted: a wobbling, drifting domain. Left, a fitted mesh
   (rings x sectors) deforms with the boundary; right, a fixed background
   mesh where only the classification into interior / cut elements changes.
   ════════════════════════════════════════════════════ */

(function unfittedSketch() {
  const canvas = document.getElementById('unfitted-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // domain in the unit square: rho < radius(theta, t) around a drifting centre
  const centre = t => [0.5 + 0.07 * Math.cos(0.45 * t), 0.5 + 0.05 * Math.sin(0.6 * t)];
  const radius = (th, t) => 0.27 * (1 + 0.16 * Math.sin(3 * th + 0.8 * t) + 0.07 * Math.cos(2 * th - 0.5 * t));
  const phi = (x, y, t) => {
    const [cx, cy] = centre(t);
    const dx = x - cx, dy = y - cy;
    return Math.hypot(dx, dy) - radius(Math.atan2(dy, dx), t);
  };

  // background mesh: structured, alternating diagonals (as in the figure above)
  const N = 12, h = 1 / N, tris = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const a = [i * h, j * h], b = [(i + 1) * h, j * h], c = [(i + 1) * h, (j + 1) * h], d = [i * h, (j + 1) * h];
    if ((i + j) % 2) tris.push([a, b, d], [b, c, d]); else tris.push([a, b, c], [a, c, d]);
  }
  // fitted mesh: NR rings x NS sectors, centre fan
  const NR = 5, NS = 18;

  let W = 0, Hc = 0, dpr = 1;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; Hc = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(Hc * dpr);
  }

  function panel(i) {
    const top = 24, size = Math.min(W / 2 - 14, Hc - top - 4);
    const x0 = i ? W / 2 + (W / 2 - size) / 2 : (W / 2 - size) / 2;
    return { x0, y0: top, size, X: x => x0 + size * x, Y: y => top + size * (1 - y) };
  }

  function boundary(p, t, color) {
    const [cx, cy] = centre(t);
    ctx.beginPath();
    for (let k = 0; k <= 120; k++) {
      const th = 2 * Math.PI * k / 120, r = radius(th, t);
      const x = p.X(cx + r * Math.cos(th)), y = p.Y(cy + r * Math.sin(th));
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
  }

  function frameBox(p, line) {
    ctx.strokeStyle = line; ctx.lineWidth = 1;
    ctx.strokeRect(p.x0 + 0.5, p.y0 + 0.5, p.size - 1, p.size - 1);
  }

  function render(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hc);
    const accent = css('--accent'), ink = css('--text'), line = css('--border');
    const inner = css('--cut-inner'), cut = css('--cut-cut');

    // ---- left: fitted mesh
    const L = panel(0);
    frameBox(L, line);
    const [cx, cy] = centre(t);
    const node = (i, j) => {
      const th = 2 * Math.PI * j / NS, r = radius(th, t) * i / NR;
      return [L.X(cx + r * Math.cos(th)), L.Y(cy + r * Math.sin(th))];
    };
    ctx.beginPath();
    for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) {
      const a = node(i, j), b = node(i + 1, j), c = node(i + 1, j + 1), d = node(i, j + 1);
      if (i === 0) { ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.closePath(); continue; }
      ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...d); ctx.closePath();
      ctx.moveTo(...a); ctx.lineTo(...c);
    }
    ctx.fillStyle = inner; ctx.fill();
    ctx.strokeStyle = accent; ctx.globalAlpha = 0.55; ctx.lineWidth = 0.7; ctx.stroke(); ctx.globalAlpha = 1;
    boundary(L, t, accent);

    // ---- right: unfitted
    const R = panel(1);
    for (const tri of tris) {
      const v = tri.map(([x, y]) => phi(x, y, t));
      const neg = v.filter(s => s < 0).length;
      ctx.beginPath();
      tri.forEach(([x, y], k) => k ? ctx.lineTo(R.X(x), R.Y(y)) : ctx.moveTo(R.X(x), R.Y(y)));
      ctx.closePath();
      if (neg === 3) { ctx.fillStyle = inner; ctx.fill(); }
      else if (neg > 0) { ctx.fillStyle = cut; ctx.fill(); }
      ctx.strokeStyle = line; ctx.lineWidth = 0.7; ctx.stroke();
    }
    frameBox(R, line);
    boundary(R, t, ink);

    // titles
    ctx.font = '600 13px system-ui, sans-serif'; ctx.fillStyle = ink; ctx.textAlign = 'center';
    ctx.fillText('Fitted mesh', L.x0 + L.size / 2, 15);
    ctx.fillText('Unfitted: fixed background mesh', R.x0 + R.size / 2, 15);
  }

  let t = 0, last = null, frame = null, visible = false;
  function tick(now) {
    frame = null;
    if (last !== null) t += Math.min(0.1, (now - last) / 1000);
    last = now;
    render(t);
    schedule();
  }
  function schedule() {
    if (visible && !reduced && frame === null) frame = requestAnimationFrame(tick);
    if (!visible) { if (frame !== null) cancelAnimationFrame(frame); frame = null; last = null; }
  }
  new ResizeObserver(() => { if (canvas.clientWidth) { resize(); render(t); } }).observe(canvas);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }).observe(canvas);
})();
