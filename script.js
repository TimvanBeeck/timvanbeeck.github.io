/* ════════════════════════════════════════════════════
   Shared state
   ════════════════════════════════════════════════════ */

const bibData = {};        // citekey → full bibtex entry string
let collaboratorMap = {};  // "Full Name" → url

/* ════════════════════════════════════════════════════
   BibTeX parser
   Handles standard @type{key, field={value}, ...} entries.
   ════════════════════════════════════════════════════ */

function parseBib(text) {
  const entries = {};
  let i = 0;
  while (i < text.length) {
    const atIdx = text.indexOf('@', i);
    if (atIdx === -1) break;

    const braceIdx = text.indexOf('{', atIdx);
    if (braceIdx === -1) break;

    const commaIdx = text.indexOf(',', braceIdx);
    if (commaIdx === -1) { i = atIdx + 1; continue; }

    const key = text.slice(braceIdx + 1, commaIdx).trim();

    // Walk forward counting braces to find the matching close
    let depth = 0, j = braceIdx;
    while (j < text.length) {
      if (text[j] === '{') depth++;
      else if (text[j] === '}') { depth--; if (depth === 0) break; }
      j++;
    }

    if (depth === 0 && key) {
      entries[key] = text.slice(atIdx, j + 1);
      i = j + 1;
    } else {
      i = atIdx + 1;
    }
  }
  return entries;
}

/* ════════════════════════════════════════════════════
   Rendering helpers
   ════════════════════════════════════════════════════ */

function renderAuthor(a) {
  if (a.self) return `<strong>${a.name}</strong>`;
  const url = a.url ?? collaboratorMap[a.name];
  if (url) return `<a href="${url}" target="_blank" rel="noopener">${a.name}</a>`;
  return a.name;
}

const BADGE_LABEL = { journal: 'Journal', arxiv: 'ArXiv', code: 'Code' };

function renderPubLinks(pub) {
  const links = Object.entries(pub.links || {})
    .filter(([, url]) => url)
    .map(([type, url]) => {
      const label = BADGE_LABEL[type] ?? type;
      return `<a href="${url}" target="_blank" rel="noopener" class="pub-badge">${label}</a>`;
    }).join('');
  const citeBtn = pub.citekey
    ? `<button class="pub-badge cite-btn" data-cite-id="${pub.citekey}">Cite</button>`
    : '';
  return links + citeBtn;
}

function renderPublication(pub) {
  const authors = pub.authors.map(renderAuthor).join(', ');
  const venue   = pub.venue ? `<p class="pub-venue">${pub.venue}</p>` : '';
  return `
    <article class="pub-card" data-cite-key="${pub.id}">
      <p class="pub-title">${pub.title}</p>
      <p class="pub-authors">${authors}</p>
      ${venue}
      <div class="pub-links">${renderPubLinks(pub)}</div>
    </article>`;
}

function renderTimelineItem(entry, isExperience) {
  const label = isExperience ? entry.role : entry.degree;
  return `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-body">
        <div class="timeline-row">
          <span class="timeline-degree">${label}</span>
          <span class="timeline-date">${entry.date}</span>
        </div>
        <p class="timeline-inst">${entry.institution}</p>
        ${entry.detail ? `<p class="timeline-detail">${entry.detail}</p>` : ''}
      </div>
    </div>`;
}

function renderTeachingItem(entry) {
  return `
    <div class="teaching-card">
      <span class="teaching-year">${entry.year}</span>
      <span class="teaching-course">${entry.course}</span>
      ${entry.institution ? `<span class="teaching-inst">${entry.institution}</span>` : ''}
    </div>`;
}

function renderTalkItem(event) {
  const roleTag = event.role
    ? `<span class="talk-role-badge">${event.role}</span>`
    : '';
  const slidesBtn = event.slides
    ? `<a href="assets/slides/${event.slides}" target="_blank" rel="noopener" class="talk-slides-btn">Slides</a>`
    : '';
  const name = event.url
    ? `<a href="${event.url}" target="_blank" rel="noopener" class="talk-name talk-name-link">${event.name}</a>`
    : `<span class="talk-name">${event.name}</span>`;
  return `
    <li class="talk-item">
      <span class="talk-date">${event.date}</span>
      <div class="talk-info">
        <div class="talk-header">
          ${name}${roleTag}
        </div>
        <span class="talk-loc">${event.location}</span>
      </div>${slidesBtn}
    </li>`;
}

/* ════════════════════════════════════════════════════
   Fetch helpers
   Note: requires an HTTP server — run `python -m http.server`
   ════════════════════════════════════════════════════ */

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

async function fetchText(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.text();
}

function showError(el, msg) {
  el.innerHTML = `<p class="loading-msg" style="color:#c0392b">${msg}</p>`;
}

/* ════════════════════════════════════════════════════
   Load collaborators (name → url map)
   ════════════════════════════════════════════════════ */

async function loadCollaborators() {
  try {
    const list = await fetchJSON('assets/collaborators.json');
    collaboratorMap = Object.fromEntries(list.map(c => [c.name, c.url]));
  } catch (e) {
    console.warn('Could not load collaborators.json:', e.message);
  }
}

/* ════════════════════════════════════════════════════
   Load BibTeX file → populate bibData
   ════════════════════════════════════════════════════ */

async function loadBib() {
  try {
    const text = await fetchText('assets/references/publications.bib');
    Object.assign(bibData, parseBib(text));
  } catch (e) {
    console.warn('Could not load publications.bib:', e.message);
  }
}

/* ════════════════════════════════════════════════════
   Page: index.html — publications + events
   ════════════════════════════════════════════════════ */

async function loadPublications() {
  const peerEl = document.getElementById('pub-peer-review');
  const preEl  = document.getElementById('pub-preprints');
  if (!peerEl || !preEl) return;

  try {
    const pubs = await fetchJSON('content/publications.json');
    const peer   = pubs.filter(p => p.type === 'peer-review');
    const pre    = pubs.filter(p => p.type === 'preprint');
    const theses = pubs.filter(p => p.type === 'thesis');

    const thesesEl = document.getElementById('pub-theses');

    peerEl.innerHTML = peer.map(renderPublication).join('') || '<p class="loading-msg">No entries yet.</p>';
    preEl.innerHTML  = pre.map(renderPublication).join('')  || '<p class="loading-msg">No entries yet.</p>';
    if (thesesEl) thesesEl.innerHTML = theses.map(renderPublication).join('') || '<p class="loading-msg">No entries yet.</p>';

    const peerCount   = document.getElementById('count-peer-review');
    const preCount    = document.getElementById('count-preprints');
    const thesesCount = document.getElementById('count-theses');
    if (peerCount)   peerCount.textContent   = peer.length;
    if (preCount)    preCount.textContent    = pre.length;
    if (thesesCount) thesesCount.textContent = theses.length;

    wireCiteButtons(peerEl);
    wireCiteButtons(preEl);
    if (thesesEl) wireCiteButtons(thesesEl);
  } catch (e) {
    const msg = 'Could not load publications. Run <code>python -m http.server</code> and open <code>http://localhost:8000</code>.';
    showError(peerEl, msg);
    preEl.innerHTML = '';
  }
}

async function loadEvents() {
  const upcomingEl = document.getElementById('events-upcoming');
  const pastEl     = document.getElementById('events-past');
  if (!upcomingEl || !pastEl) return;

  try {
    const data = await fetchJSON('content/events.json');
    const upcoming = data.upcoming || [];
    const past = data.past || [];

    upcomingEl.innerHTML = upcoming.map(renderTalkItem).join('')
      || '<li class="talk-item"><span class="talk-loc">No upcoming events.</span></li>';

    const upcomingCount = document.getElementById('count-upcoming');
    const pastCount     = document.getElementById('count-past');
    if (upcomingCount) upcomingCount.textContent = upcoming.length;
    if (pastCount)     pastCount.textContent     = past.length;

    const shown = past.slice(0, 3);
    pastEl.innerHTML = shown.map(renderTalkItem).join('')
      || '<li class="talk-item"><span class="talk-loc">No past events.</span></li>';

    pastEl.insertAdjacentHTML('afterend', '<a href="events.html" class="see-all-link">See all past events →</a>');
  } catch (e) {
    showError(upcomingEl, 'Could not load events. See note above.');
    pastEl.innerHTML = '';
  }
}

async function loadAllEvents() {
  const upcomingEl = document.getElementById('events-all-upcoming');
  const pastEl     = document.getElementById('events-all-past');
  if (!pastEl) return;

  try {
    const data = await fetchJSON('content/events.json');

    const upcoming = data.upcoming || [];
    const past = data.past || [];

    if (upcomingEl) {
      upcomingEl.innerHTML = upcoming.map(renderTalkItem).join('')
        || '<li class="talk-item"><span class="talk-loc">No upcoming events.</span></li>';
    }
    pastEl.innerHTML = past.map(renderTalkItem).join('')
      || '<li class="talk-item"><span class="talk-loc">No past events.</span></li>';

    const upcomingCount = document.getElementById('count-all-upcoming');
    const pastCount     = document.getElementById('count-all-past');
    if (upcomingCount) upcomingCount.textContent = upcoming.length;
    if (pastCount)     pastCount.textContent     = past.length;
  } catch (e) {
    if (upcomingEl) showError(upcomingEl, 'Could not load events. Run <code>python -m http.server</code>.');
    if (pastEl) pastEl.innerHTML = '';
  }
}

/* ════════════════════════════════════════════════════
   Page: cv.html — education, experience, theses
   ════════════════════════════════════════════════════ */

async function loadCVData() {
  const eduEl      = document.getElementById('cv-education');
  const expEl      = document.getElementById('cv-experience');
  const teachingEl = document.getElementById('cv-teaching');
  if (!eduEl) return;

  try {
    const data = await fetchJSON('content/cv.json');

    if (eduEl)      eduEl.innerHTML      = (data.education  || []).map(e => renderTimelineItem(e, false)).join('');
    if (expEl)      expEl.innerHTML      = (data.experience || []).map(e => renderTimelineItem(e, true)).join('');
    if (teachingEl) teachingEl.innerHTML = (data.teaching   || []).map(renderTeachingItem).join('')
      || '<p class="loading-msg">No entries yet.</p>';
  } catch (e) {
    const msg = 'Could not load CV data. Run <code>python -m http.server</code> and open <code>http://localhost:8000</code>.';
    if (eduEl)      showError(eduEl, msg);
    if (expEl)      expEl.innerHTML = '';
    if (teachingEl) teachingEl.innerHTML = '';
  }
}

/* ════════════════════════════════════════════════════
   Mobile nav toggle
   ════════════════════════════════════════════════════ */

const toggle   = document.querySelector('.nav-toggle');
const navLinks = document.getElementById('nav-links');

toggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('click', e => {
  if (!navLinks.contains(e.target) && !toggle.contains(e.target)) {
    navLinks.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});

/* ════════════════════════════════════════════════════
   Active nav link (index.html only)
   ════════════════════════════════════════════════════ */

const sections   = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

if (sections.length && navAnchors.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navAnchors.forEach(a => a.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-60px 0px -60% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));
}

/* ════════════════════════════════════════════════════
   Navbar shadow on scroll
   ════════════════════════════════════════════════════ */

const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.style.boxShadow = window.scrollY > 8 ? '0 2px 16px rgba(0,0,0,0.08)' : '';
}, { passive: true });

/* ════════════════════════════════════════════════════
   Citation modal
   ════════════════════════════════════════════════════ */

const modal      = document.getElementById('cite-modal');
const bibContent = document.getElementById('cite-bib-content');
const closeBtn   = modal.querySelector('.modal-close');
const copyBtn    = document.getElementById('copy-bib-btn');

let lastFocused = null;  // element to restore focus to when the modal closes

function getFocusable() {
  return Array.from(
    modal.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')
  ).filter(el => !el.disabled && el.offsetParent !== null);
}

function openModal(citekey) {
  lastFocused = document.activeElement;
  bibContent.textContent = bibData[citekey] ?? `% Entry not found for key: ${citekey}\n% Make sure the citekey in publications.json matches the key in publications.bib`;
  modal.hidden = false;
  copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy to clipboard';
  copyBtn.classList.remove('copied');
  closeBtn.focus();
}

function closeModal() {
  modal.hidden = true;
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  lastFocused = null;
}

function wireCiteButtons(container) {
  container.querySelectorAll('.cite-btn').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.citeId));
  });
}

closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

// Trap Tab focus inside the modal while it is open
modal.addEventListener('keydown', e => {
  if (e.key !== 'Tab' || modal.hidden) return;
  const focusable = getFocusable();
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(bibContent.textContent).then(() => {
    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy to clipboard';
      copyBtn.classList.remove('copied');
    }, 2000);
  });
});

/* ════════════════════════════════════════════════════
   Bootstrap: load shared data, then render page content
   ════════════════════════════════════════════════════ */

Promise.all([loadCollaborators(), loadBib()]).then(() => {
  if (document.getElementById('pub-peer-review')) {
    loadPublications();
    loadEvents();
  }
  if (document.getElementById('cv-education')) {
    loadCVData();
  }
  if (document.getElementById('events-all-past')) {
    loadAllEvents();
  }
});
