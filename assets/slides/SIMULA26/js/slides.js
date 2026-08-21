/* Slide navigation: arrow keys / presenter clicker (PageDown/PageUp,
 * Space) and click-to-advance, similar to a PDF presentation viewer. */

(function () {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const counterEl = document.querySelector('.slide-counter');
  const progressEl = document.querySelector('.progress-bar');
  const total = slides.length;

  // The title slide sits outside the numbering (beamer's \frame[plain]): it
  // shows no counter and leaves the progress bar empty, and the slides after
  // it count from 1. numberOf[i] is the displayed number, 0 = not counted.
  const numberOf = [];
  let countedTotal = 0;
  slides.forEach((s, i) => {
    const counted = !s.classList.contains('slide--title');
    numberOf[i] = counted ? ++countedTotal : 0;
  });

  function slideIndexFromHash() {
    const n = parseInt(location.hash.replace('#', ''), 10);
    if (Number.isInteger(n) && n >= 1 && n <= total) return n - 1;
    return 0;
  }

  let current = slideIndexFromHash();
  let menuItems = [];

  // Beamer-\pause / \uncover<n-> equivalent: elements marked .fragment stay
  // hidden until an extra next()/click reveals them one at a time. Jumping
  // directly to a slide (menu, hash link, Home/End) shows all of its
  // fragments at once -- only sequential next()/prev() steps them.
  // MathJax emits every formula twice: the visible SVG and a hidden MathML
  // copy for screen readers. A \class{fragment}{...} in the TeX therefore
  // lands in both, and the hidden twin would otherwise cost a click of its own
  // that reveals nothing visible.
  function fragmentsOf(slide) {
    return Array.from(slide.querySelectorAll('.fragment'))
      .filter((f) => !f.closest('mjx-assistive-mml'));
  }

  // Fragments sharing a data-step value are revealed by the same click, even
  // when they sit far apart in the document (e.g. a bullet in the left column
  // and the figure in the right one). The group takes the position of its
  // first member in the reveal order; ungrouped fragments are their own step.
  function stepsOf(slide) {
    const groups = [];
    const byStep = new Map();
    fragmentsOf(slide).forEach((f) => {
      const step = f.dataset.step;
      if (step && byStep.has(step)) { byStep.get(step).push(f); return; }
      const group = [f];
      if (step) byStep.set(step, group);
      groups.push(group);
    });
    return reorder(groups);
  }

  // A fragment may carry an `order-N` class to be revealed out of document
  // order. The groups carrying one keep the slots they occupy in the sequence
  // and are dealt back into them by N, so they trade places among themselves
  // and leave every other step where it was. This exists for fragments inside
  // a formula: their document order is whatever the equation is typeset in,
  // and the class is the only handle \class{...} in the TeX gives us.
  function orderOf(group) {
    const cls = Array.from(group[0].classList).find((c) => /^order-\d+$/.test(c));
    return cls ? parseInt(cls.slice(6), 10) : null;
  }
  function reorder(groups) {
    const slots = [];
    const ordered = [];
    groups.forEach((g, i) => {
      const n = orderOf(g);
      if (n !== null) { slots.push(i); ordered.push([n, g]); }
    });
    ordered.sort((a, b) => a[0] - b[0]).forEach(([, g], i) => { groups[slots[i]] = g; });
    return groups;
  }
  // set as soon as the presenter steps, so the MathJax hook at the bottom of
  // this file does not undo a reveal that is already under way
  let hasStepped = false;
  function isShown(group) { return group[0].classList.contains('is-visible'); }
  function showAllFragments(slide) { fragmentsOf(slide).forEach((f) => f.classList.add('is-visible')); }
  function hideAllFragments(slide) { fragmentsOf(slide).forEach((f) => f.classList.remove('is-visible')); }

  function stopMedia(slide) {
    slide.querySelectorAll('video').forEach((v) => v.pause());
  }

  function render() {
    slides.forEach((s, i) => {
      const isActive = i === current;
      if (s.classList.contains('is-active') && !isActive) stopMedia(s);
      s.classList.toggle('is-active', isActive);
    });
    menuItems.forEach((btn, i) => btn.classList.toggle('is-current', i === current));
    const num = numberOf[current];
    if (counterEl) counterEl.textContent = num ? `${num} / ${countedTotal}` : '';
    if (progressEl) progressEl.style.width = `${(num / countedTotal) * 100}%`;
    history.replaceState(null, '', `#${current + 1}`);
  }

  function goTo(index) {
    current = Math.min(Math.max(index, 0), total - 1);
    showAllFragments(slides[current]);
    render();
  }

  function next() {
    hasStepped = true;
    const hidden = stepsOf(slides[current]).filter((g) => !isShown(g));
    if (hidden.length) { hidden[0].forEach((f) => f.classList.add('is-visible')); return; }
    if (current >= total - 1) return;
    current += 1;
    hideAllFragments(slides[current]);
    render();
  }

  function prev() {
    hasStepped = true;
    const visible = stepsOf(slides[current]).filter(isShown);
    if (visible.length) { visible[visible.length - 1].forEach((f) => f.classList.remove('is-visible')); return; }
    if (current <= 0) return;
    current -= 1;
    showAllFragments(slides[current]);
    render();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  // ---- slide size: since the whole theme is built on rem/em units, scaling
  // the root font-size scales text, spacing and icons together. Handy on
  // e.g. a 4K external display where the deck otherwise reads small.
  // The slider only commits a new value on release (`change`), not while
  // dragging (`input`) -- the number field still updates live so the thumb
  // has visible feedback while dragging.
  const ZOOM_KEY = 'html-talk-zoom';
  // 100% in the zoom control means the deck's base size, not the browser's
  // 16px default -- keep this in sync with `html { font-size }` in style.css.
  const BASE_FONT_PCT = 125;
  const zoomValue = document.querySelector('.menu-zoom-value');
  const zoomRange = document.querySelector('.menu-zoom-range');
  const zoomMin = zoomValue ? parseInt(zoomValue.min, 10) : 50;
  const zoomMax = zoomValue ? parseInt(zoomValue.max, 10) : 250;

  // An <iframe> embed is a separate document, so the root font-size set here
  // never reaches it -- the effective size is broadcast to every embed via
  // postMessage instead, and a plot embed rescales its fonts and margins from
  // it. (The webgui scenes draw to a WebGL canvas and simply ignore it.)
  let currentZoomPct = 100;

  function effectiveZoomPct() { return Math.round(currentZoomPct * BASE_FONT_PCT / 100); }

  function broadcastZoom() {
    document.querySelectorAll('iframe').forEach((f) => {
      try {
        f.contentWindow.postMessage({ type: 'html-talk-zoom', pct: effectiveZoomPct() }, '*');
      } catch (e) { /* cross-origin embed, nothing we can do */ }
    });
  }

  // An embed may load after the zoom was last changed (its slide had not been
  // visited yet), so each one pings us when it is ready and gets the current
  // value back directly, rather than depending on load order.
  window.addEventListener('message', (e) => {
    const msg = e.data;
    if (!msg) return;
    if (msg.type === 'html-talk-ready' && e.source) {
      e.source.postMessage({ type: 'html-talk-zoom', pct: effectiveZoomPct() }, '*');
      return;
    }
    // Once the pointer has gone into an embed, the focus is inside that iframe
    // and this window stops seeing keys and clicks entirely -- the deck looks
    // frozen, and only the menu still works. So every embed hands back the keys
    // and the background clicks it has no use for (see forwardDeckNav in
    // js/plot-embed.js), and they are answered here as if they had arrived
    // directly. The menu is checked because it is a parent-window overlay: an
    // embed underneath it must not step the deck while it is open.
    if (isMenuOpen()) return;
    if (msg.type === 'html-talk-key') handleKey(msg.key);
    else if (msg.type === 'html-talk-click') { if (msg.x < 0.2) prev(); else next(); }
  });

  function applyZoom(pct) {
    currentZoomPct = pct;
    document.documentElement.style.fontSize = (pct * BASE_FONT_PCT / 100) + '%';
    if (zoomValue) zoomValue.value = pct;
    if (zoomRange) zoomRange.value = pct;
    localStorage.setItem(ZOOM_KEY, pct);
    broadcastZoom();
  }

  if (zoomValue) {
    const saved = parseInt(localStorage.getItem(ZOOM_KEY), 10);
    applyZoom(Number.isInteger(saved) ? saved : 100);

    if (zoomRange) {
      zoomRange.addEventListener('input', () => { zoomValue.value = zoomRange.value; });
      zoomRange.addEventListener('change', () => applyZoom(parseInt(zoomRange.value, 10)));
    }

    zoomValue.addEventListener('input', () => {
      const n = parseInt(zoomValue.value, 10);
      if (Number.isInteger(n)) applyZoom(n); // live-apply while typing, unclamped
    });
    zoomValue.addEventListener('blur', () => {
      const n = parseInt(zoomValue.value, 10);
      applyZoom(Math.min(zoomMax, Math.max(zoomMin, Number.isInteger(n) ? n : 100)));
    });
    zoomValue.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') zoomValue.blur();
    });
  }

  // ---- slide menu: subtle toggle + mac-sidebar-style panel ------------

  const menuToggle = document.querySelector('.menu-toggle');
  const menuPanel = document.querySelector('.menu-panel');
  const menuBackdrop = document.querySelector('.menu-backdrop');
  const menuFullscreenBtn = document.querySelector('.menu-fullscreen');
  const menuList = document.querySelector('.menu-list');

  function slideTitle(slide, i) {
    const el = slide.querySelector('.slide-title, h1, h2');
    return (el && el.textContent.trim()) || `Slide ${i + 1}`;
  }

  function isMenuOpen() { return menuPanel.classList.contains('is-open'); }
  function openMenu() {
    menuPanel.classList.add('is-open');
    menuBackdrop.classList.add('is-open');
    menuToggle.classList.add('is-active');
  }
  function closeMenu() {
    menuPanel.classList.remove('is-open');
    menuBackdrop.classList.remove('is-open');
    menuToggle.classList.remove('is-active');
  }
  function toggleMenu() { isMenuOpen() ? closeMenu() : openMenu(); }

  if (menuList) {
    menuItems = slides.map((slide, i) => {
      const btn = document.createElement('button');
      btn.className = 'menu-item';
      if (slide.classList.contains('slide--section')) btn.classList.add('menu-item--section');
      btn.innerHTML =
        `<span class="menu-item-num">${numberOf[i] || ''}</span>` +
        `<span class="menu-item-title"></span>`;
      btn.querySelector('.menu-item-title').textContent = slideTitle(slide, i);
      btn.addEventListener('click', () => { goTo(i); closeMenu(); });
      menuList.appendChild(btn);
      return btn;
    });
  }

  if (menuToggle) menuToggle.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
  if (menuBackdrop) menuBackdrop.addEventListener('click', closeMenu);
  if (menuFullscreenBtn) menuFullscreenBtn.addEventListener('click', () => { toggleFullscreen(); closeMenu(); });

  /** The deck's response to a navigation key, wherever the key came from:
   *  this window, or an embed handing one back (see the message listener). */
  function handleKey(key) {
    switch (key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
        next();
        return true;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
      case 'Backspace':
        prev();
        return true;
      case 'Home':
        goTo(0);
        return true;
      case 'End':
        goTo(total - 1);
        return true;
      case 'f':
      case 'F':
        toggleFullscreen();
        return true;
      default:
        return false;
    }
  }

  document.addEventListener('keydown', (e) => {
    if (isMenuOpen()) {
      if (e.key === 'Escape') closeMenu();
      return; // don't let arrow/space navigation fire while browsing the menu
    }
    // same for a focused form control (e.g. the view switcher): its own
    // arrow/space handling must not also step the deck
    if (e.target.closest('select, input, textarea')) return;
    if (handleKey(e.key) && e.key !== 'f' && e.key !== 'F') e.preventDefault();
  });

  // Click-to-advance like a PDF viewer: click the right ~80% of the slide
  // to go forward, the left ~20% to go back. Ignore clicks on links/buttons
  // and on media elements (native video controls aren't real <button>
  // elements from the page's point of view, so they're excluded by tag).
  document.querySelector('.deck').addEventListener('click', (e) => {
    if (e.target.closest('a, button, input, select, video, audio, iframe')) return;
    const x = e.clientX / window.innerWidth;
    if (x < 0.2) prev(); else next();
  });

  // A <select class="view-switcher-select"> swaps the src of the iframe in
  // the same slide body, so one slide can flip between several pre-rendered
  // embeds (e.g. the webgui scenes exported from code/test.ipynb) without
  // needing a separate slide each.
  document.querySelectorAll('.view-switcher-select').forEach((select) => {
    const iframe = select.closest('.slide-body')?.querySelector('iframe');
    if (!iframe) return;
    select.addEventListener('change', () => { iframe.src = select.value; });
  });

  window.addEventListener('hashchange', () => {
    current = slideIndexFromHash();
    showAllFragments(slides[current]);
    render();
  });

  showAllFragments(slides[current]);
  render();

  // Fragments that live inside a formula (\class{fragment}{...} in the TeX)
  // only enter the DOM when MathJax has typeset the page, which happens after
  // this script runs -- the showAllFragments() above cannot have seen them.
  // The MathJax config in index.html fires this event when it is done; re-apply
  // the state then, unless the presenter has already started stepping, so that
  // opening such a slide by hash or from the menu does not leave the fragments
  // inside its formulas hidden for good.
  window.addEventListener('mathjax-ready', () => {
    if (!hasStepped) showAllFragments(slides[current]);
  });
})();
