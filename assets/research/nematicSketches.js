/*
 * Animated versions of the TikZ sketches in ../sketches (isotropic vs. nematic fluid,
 * wave propagation in both), drawn on <canvas> elements.
 *
 * Usage in a presentation:
 *   <canvas data-sketch="wavesNematicV3" style="width: 400px"></canvas>
 *   <script src="nematicSketches.js"></script>
 *
 * Available sketches (same names as the .tex files):
 *   isotropic, nematic, wavesIsotropic, wavesNematic          (first version)
 *   isotropicV2, nematicV2, wavesIsotropicV2, wavesNematicV2  (V2, coloured pressure field)
 *   isotropicV3, nematicV3, wavesIsotropicV3, wavesNematicV3  (V3, V2 look with rings)
 *
 * The canvas is always square (height follows the width).
 * Sketches only run while visible and show a still image if the viewer prefers reduced motion.
 * Sketches added to the page later can be started with NematicSketches.start(canvas).
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- constants (as in the TikZ styles)
  const SIDE = 5;              // side length of the square (cm in TikZ)
  const MARGIN = 0.1;          // border around the square (standalone border=1mm)
  const PT = 1 / 28.4527;      // one TeX point in cm
  const COL = {
    GOE: [35, 95, 150],
    DGOE: [24, 49, 102],
    HRED: [128, 23, 14],
  };
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  // TikZ colour mixing: mix(c, p) = p % of c and (100 - p) % white
  const mix = (c, p) => c.map((v) => Math.round(v * p / 100 + 255 * (1 - p / 100)));
  const black = (p) => mix([0, 0, 0], p);  // black!p

  // diverging colour map of the V2 pressure field (blue - off-white - red)
  const COLORMAP = [[24, 49, 102], [70, 130, 175], [246, 243, 236], [200, 95, 72], [128, 23, 14]];

  // ---------------------------------------------------------------- helpers
  // small seeded random number generator, so the molecules are the same on every load
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // TikZ Stealth arrow tip at (x, y) pointing in direction ang
  function stealth(ctx, x, y, ang, len, color) {
    const w = 0.6 * len, inset = 0.3 * len;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-len, w / 2);
    ctx.lineTo(-len + inset, 0);
    ctx.lineTo(-len, -w / 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  // arrow from (x1, y1) to (x2, y2); heads: 'end' or 'both'
  function arrow(ctx, x1, y1, x2, y2, { color, width, head, heads = 'end' }) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const back = 0.7 * head;
    const sx = heads === 'both' ? x1 + back * Math.cos(ang) : x1;
    const sy = heads === 'both' ? y1 + back * Math.sin(ang) : y1;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(x2 - back * Math.cos(ang), y2 - back * Math.sin(ang));
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'butt';
    ctx.stroke();
    stealth(ctx, x2, y2, ang, head, color);
    if (heads === 'both') stealth(ctx, x1, y1, ang + Math.PI, head, color);
  }

  function directorLabel(ctx, x, y, anchor, size) {
    ctx.fillStyle = rgb(COL.HRED);
    ctx.font = `italic bold ${size}px "XCharter", "Charter", "Georgia", serif`;
    ctx.textAlign = anchor;
    ctx.textBaseline = 'middle';
    ctx.fillText('n', x, y);
  }

  // ---------------------------------------------------------------- molecules
  // grid: { n, offset, spacing, jitter }; same layout as the \molecules macros
  const GRID = {
    v1: { n: 9, offset: 0.5, spacing: 0.5, jitter: 0.09, seed: 1234 },
    v2: { n: 12, offset: 0.21, spacing: 0.4167, jitter: 0.1, seed: 4711 },
  };

  // maxDev: max. deviation from the mean angle (deg); wobble: amplitude of the rotational fluctuations (deg)
  function makeMolecules(grid, { maxDev, wobble, exclude }) {
    const rand = mulberry32(grid.seed);
    const pm = () => 2 * rand() - 1;   // uniform in [-1, 1], like pgf's rand
    const list = [];
    for (let i = 0; i < grid.n; i++) {
      for (let j = 0; j < grid.n; j++) {
        const m = {
          x: grid.offset + grid.spacing * i + grid.jitter * pm(),
          y: grid.offset + grid.spacing * j + grid.jitter * pm(),
          a: maxDev * pm(),
          // smooth random motion: sums of sines with random frequencies and phases
          w: [0.5 + 0.7 * rand(), 1.1 + 0.9 * rand(), 0.4 + 0.5 * rand(), 0.4 + 0.5 * rand()],
          p: [0, 0, 0, 0].map(() => 2 * Math.PI * rand()),
          wobble,
        };
        if (exclude && m.x > exclude[0] && m.x < exclude[2] && m.y > exclude[1] && m.y < exclude[3]) continue;
        list.push(m);
      }
    }
    return list;
  }

  function moleculeState(m, t) {
    const da = m.wobble * (Math.sin(m.w[0] * t + m.p[0]) + 0.6 * Math.sin(m.w[1] * t + m.p[1])) / 1.6;
    return {
      x: m.x + 0.035 * Math.sin(m.w[2] * t + m.p[2]),
      y: m.y + 0.035 * Math.sin(m.w[3] * t + m.p[3]),
      a: (m.a + da) * Math.PI / 180,
    };
  }

  // first version: rounded rods
  function drawRods(ctx, mols, t, opacity) {
    ctx.strokeStyle = rgb(mix(COL.GOE, 85), opacity);
    ctx.lineWidth = 2.4 * PT;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const m of mols) {
      const s = moleculeState(m, t);
      const dx = 0.2 * Math.cos(s.a), dy = 0.2 * Math.sin(s.a);
      ctx.moveTo(s.x - dx, s.y - dy);
      ctx.lineTo(s.x + dx, s.y + dy);
    }
    ctx.stroke();
  }

  // V2 / V3: single-coloured ellipses
  function drawEllipsoids(ctx, mols, t, opacity) {
    const rx = 0.18, ry = 0.056;
    ctx.fillStyle = rgb(mix(COL.GOE, 85), opacity);
    ctx.beginPath();
    for (const m of mols) {
      const s = moleculeState(m, t);
      ctx.moveTo(s.x + rx * Math.cos(s.a), s.y + rx * Math.sin(s.a));
      ctx.ellipse(s.x, s.y, rx, ry, s.a, 0, 2 * Math.PI);
    }
    ctx.fill();
  }

  // ---------------------------------------------------------------- waves
  const RING_PERIOD = 1.6;  // seconds until a new wavefront leaves the source

  // wavefronts around the centre; ax, ay: distance between neighbouring fronts along x and y
  function drawRings(ctx, t, ax, ay) {
    const u = (t / RING_PERIOD) % 1;
    ctx.lineWidth = 1.1 * PT;
    for (let k = 0; k < 10; k++) {
      const s = k + u;
      if (s <= 0) continue;
      const op = Math.max(0, 1 - 0.09 * s) * Math.min(1, s / 0.6);
      ctx.strokeStyle = rgb(COL.GOE, op);
      ctx.beginPath();
      ctx.ellipse(SIDE / 2, SIDE / 2, ax * s, ay * s, 0, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }

  // V2: real part of an outgoing wave, lx, ly: wavelengths along x and y
  function makeField(lx, ly, res) {
    const off = document.createElement('canvas');
    off.width = off.height = res;
    const octx = off.getContext('2d');
    const img = octx.createImageData(res, res);
    // elliptical distance (in wavelengths) and amplitude are fixed, only the phase moves
    const S = new Float32Array(res * res), A = new Float32Array(res * res);
    for (let j = 0; j < res; j++) {
      for (let i = 0; i < res; i++) {
        const x = (i + 0.5) / res * SIDE - SIDE / 2;
        const y = SIDE / 2 - (j + 0.5) / res * SIDE;
        const s = Math.sqrt((x / lx) ** 2 + (y / ly) ** 2);
        S[j * res + i] = s;
        A[j * res + i] = 1 / (1 + 0.9 * s);
      }
    }
    return function draw(ctx, t) {
      const phase = t / RING_PERIOD;
      const d = img.data;
      for (let k = 0; k < S.length; k++) {
        const v = Math.cos(2 * Math.PI * (S[k] - phase)) * A[k];   // in [-1, 1]
        const q = (v + 1) / 2 * (COLORMAP.length - 1);
        const i0 = Math.min(COLORMAP.length - 2, Math.floor(q)), f = q - i0;
        const c0 = COLORMAP[i0], c1 = COLORMAP[i0 + 1];
        d[4 * k] = c0[0] + f * (c1[0] - c0[0]);
        d[4 * k + 1] = c0[1] + f * (c1[1] - c0[1]);
        d[4 * k + 2] = c0[2] + f * (c1[2] - c0[2]);
        d[4 * k + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      // the image is drawn upright, undo the flipped y axis for it
      ctx.save();
      ctx.translate(0, SIDE);
      ctx.scale(1, -1);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, SIDE, SIDE);
      ctx.restore();
    };
  }

  function speedArrows(ctx, lenX, lenY) {
    const style = { color: rgb(black(75)), width: 0.8 * PT, head: 5 * PT };
    arrow(ctx, SIDE / 2, SIDE / 2, SIDE / 2 + lenX, SIDE / 2, style);
    arrow(ctx, SIDE / 2, SIDE / 2, SIDE / 2, SIDE / 2 + lenY, style);
  }

  function source(ctx, color, radius) {
    ctx.beginPath();
    ctx.arc(SIDE / 2, SIDE / 2, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // ---------------------------------------------------------------- frames and legends
  const R6 = 6 * PT;  // rounded corners of V2 / V3

  function frameV1(ctx) {
    ctx.strokeStyle = rgb(black(70));
    ctx.lineWidth = 0.6 * PT;
    ctx.strokeRect(0, 0, SIDE, SIDE);
  }

  function backgroundV2(ctx) {
    roundedRect(ctx, 0, 0, SIDE, SIDE, R6);
    ctx.fillStyle = rgb(black(3));
    ctx.fill();
  }

  function clipV2(ctx) {
    roundedRect(ctx, 0, 0, SIDE, SIDE, R6);
    ctx.clip();
  }

  function frameV2(ctx) {
    roundedRect(ctx, 0, 0, SIDE, SIDE, R6);
    ctx.strokeStyle = rgb(black(55));
    ctx.lineWidth = 0.7 * PT;
    ctx.stroke();
  }

  // V2 / V3: director in a small box in the top right corner
  function directorLegend(ctx) {
    const cx = SIDE - 0.82, cy = SIDE - 0.42, w = 1.35, h = 0.5;
    roundedRect(ctx, cx - w / 2, cy - h / 2, w, h, 3 * PT);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    ctx.strokeStyle = rgb(black(15));
    ctx.lineWidth = 0.4 * PT;
    ctx.stroke();
    arrow(ctx, cx - w / 2 + 0.15, cy, cx + w / 2 - 0.5, cy,
      { color: rgb(COL.HRED), width: 1.2 * PT, head: 5 * PT, heads: 'both' });
    label(ctx, cx + w / 2 - 0.05, cy, 'right');
  }

  // text is drawn in device pixels with the y axis flipped back (tiny font sizes are unreliable)
  function label(ctx, x, y, anchor) {
    const m = ctx.getTransform();
    const s = Math.hypot(m.a, m.b);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1 / s, -1 / s);
    directorLabel(ctx, 0, 0, anchor, 0.42 * s);
    ctx.restore();
  }

  // ---------------------------------------------------------------- the sketches
  const ISO = { maxDev: 180, wobble: 35 };
  const NEM = { maxDev: 10, wobble: 6 };
  const EXCL_LEGEND = [3.8, 4.25, 6, 6];

  const SKETCHES = {
    // ---- first version
    isotropic() {
      const mols = makeMolecules(GRID.v1, ISO);
      return (ctx, t) => { drawRods(ctx, mols, t, 1); frameV1(ctx); };
    },
    nematic() {
      const mols = makeMolecules(GRID.v1, { ...NEM, maxDev: 12, exclude: [1.2, 2.25, 4.3, 2.75] });
      return (ctx, t) => {
        drawRods(ctx, mols, t, 1);
        arrow(ctx, 1.5, 2.5, 3.5, 2.5, { color: rgb(COL.HRED), width: 1.4 * PT, head: 7 * PT });
        label(ctx, 3.75, 2.5, 'center');
        frameV1(ctx);
      };
    },
    wavesIsotropic() {
      const mols = makeMolecules(GRID.v1, ISO);
      return (ctx, t) => {
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, SIDE, SIDE); ctx.clip();
        drawRods(ctx, mols, t, 0.18);
        drawRings(ctx, t, 0.42, 0.42);
        ctx.restore();
        speedArrows(ctx, 1.3, 1.3);
        source(ctx, rgb(COL.HRED), 2.2 * PT);
        frameV1(ctx);
      };
    },
    wavesNematic() {
      const mols = makeMolecules(GRID.v1, { ...NEM, maxDev: 12 });
      return (ctx, t) => {
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, SIDE, SIDE); ctx.clip();
        drawRods(ctx, mols, t, 0.18);
        drawRings(ctx, t, 0.56, 0.34);
        ctx.restore();
        speedArrows(ctx, 1.7, 1.0);
        source(ctx, rgb(COL.HRED), 2.2 * PT);
        roundedRect(ctx, 3.4, 0.18, 1.48, 0.44, 2 * PT);
        ctx.fillStyle = 'white';
        ctx.fill();
        arrow(ctx, 3.55, 0.4, 4.45, 0.4, { color: rgb(COL.HRED), width: 1.4 * PT, head: 7 * PT });
        label(ctx, 4.68, 0.4, 'center');
        frameV1(ctx);
      };
    },

    // ---- V2
    isotropicV2() {
      const mols = makeMolecules(GRID.v2, ISO);
      return (ctx, t) => {
        backgroundV2(ctx);
        ctx.save(); clipV2(ctx); drawEllipsoids(ctx, mols, t, 1); ctx.restore();
        frameV2(ctx);
      };
    },
    nematicV2() {
      const mols = makeMolecules(GRID.v2, { ...NEM, exclude: EXCL_LEGEND });
      return (ctx, t) => {
        backgroundV2(ctx);
        ctx.save(); clipV2(ctx); drawEllipsoids(ctx, mols, t, 1); ctx.restore();
        directorLegend(ctx);
        frameV2(ctx);
      };
    },
    wavesIsotropicV2() {
      const mols = makeMolecules(GRID.v2, ISO);
      const field = makeField(0.85, 0.85, 240);
      return (ctx, t) => {
        ctx.save(); clipV2(ctx);
        field(ctx, t);
        drawEllipsoids(ctx, mols, t, 0.22);
        ctx.restore();
        source(ctx, 'black', 1.8 * PT);
        frameV2(ctx);
      };
    },
    wavesNematicV2() {
      const mols = makeMolecules(GRID.v2, { ...NEM, exclude: EXCL_LEGEND });
      const field = makeField(1.15, 0.68, 240);
      return (ctx, t) => {
        ctx.save(); clipV2(ctx);
        field(ctx, t);
        drawEllipsoids(ctx, mols, t, 0.22);
        ctx.restore();
        source(ctx, 'black', 1.8 * PT);
        directorLegend(ctx);
        frameV2(ctx);
      };
    },

    // ---- V3
    isotropicV3() { return SKETCHES.isotropicV2(); },
    nematicV3() { return SKETCHES.nematicV2(); },
    wavesIsotropicV3() {
      const mols = makeMolecules(GRID.v2, ISO);
      return (ctx, t) => {
        backgroundV2(ctx);
        ctx.save(); clipV2(ctx);
        drawEllipsoids(ctx, mols, t, 0.42);
        drawRings(ctx, t, 0.42, 0.42);
        ctx.restore();
        speedArrows(ctx, 1.3, 1.3);
        source(ctx, rgb(COL.HRED), 2.2 * PT);
        frameV2(ctx);
      };
    },
    wavesNematicV3() {
      const mols = makeMolecules(GRID.v2, { ...NEM, exclude: EXCL_LEGEND });
      return (ctx, t) => {
        backgroundV2(ctx);
        ctx.save(); clipV2(ctx);
        drawEllipsoids(ctx, mols, t, 0.42);
        drawRings(ctx, t, 0.56, 0.34);
        ctx.restore();
        speedArrows(ctx, 1.7, 1.0);
        source(ctx, rgb(COL.HRED), 2.2 * PT);
        directorLegend(ctx);
        frameV2(ctx);
      };
    },
  };

  // ---------------------------------------------------------------- running a sketch on a canvas
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // coordinates as in TikZ: origin bottom left, y axis pointing up, units of the square
  function setupView(canvas, ctx) {
    const css = canvas.clientWidth || 300;
    const dpr = window.devicePixelRatio || 1;
    canvas.style.height = css + 'px';
    canvas.width = canvas.height = Math.round(css * dpr);
    const scale = canvas.width / (SIDE + 2 * MARGIN);
    ctx.setTransform(scale, 0, 0, -scale, MARGIN * scale, canvas.height - MARGIN * scale);
  }

  function start(canvas, name) {
    name = name || canvas.dataset.sketch;
    if (!SKETCHES[name]) throw new Error(`Unknown sketch "${name}". Available: ${Object.keys(SKETCHES).join(', ')}`);
    if (canvas._nematicSketch) return canvas._nematicSketch;
    const ctx = canvas.getContext('2d');
    const draw = SKETCHES[name]();
    let t = 0, last = null, paused = reducedMotion, visible = true, frame = null;

    function render() {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      draw(ctx, t);
    }
    function tick(now) {
      frame = null;
      if (last !== null) t += Math.min(0.1, (now - last) / 1000);
      last = now;
      render();
      schedule();
    }
    function schedule() {
      if (!paused && visible && frame === null) frame = requestAnimationFrame(tick);
      if ((paused || !visible) && frame !== null) { cancelAnimationFrame(frame); frame = null; }
      if (frame === null) last = null;
    }
    function resize() { setupView(canvas, ctx); render(); }

    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    if (window.IntersectionObserver) {
      new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; schedule(); }).observe(canvas);
    }
    resize();
    schedule();

    const control = {
      play() { paused = false; schedule(); },
      pause() { paused = true; schedule(); },
      reset() { t = 0; render(); },
    };
    canvas._nematicSketch = control;
    return control;
  }

  function startAll(root) {
    (root || document).querySelectorAll('canvas[data-sketch]').forEach((c) => start(c));
  }

  window.NematicSketches = { start, startAll, names: Object.keys(SKETCHES) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => startAll());
  else startAll();
})();
