import './style.css';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// ── Section → colour mapping ──────────────────────────────
const SECTION_STYLES = {
  'Quick Wins':               { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.22)'   },
  'Quality':                  { color: '#22d3ee', bg: 'rgba(34,211,238,0.08)',   border: 'rgba(34,211,238,0.22)'   },
  'Manufacturing & Process':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.22)'   },
  'Commercial & Procurement': { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)',  border: 'rgba(167,139,250,0.22)'  },
  'Maintenance':              { color: '#f87171', bg: 'rgba(248,113,113,0.08)',   border: 'rgba(248,113,113,0.22)'  },
  'Yard & Logistics':         { color: '#fb923c', bg: 'rgba(251,146,60,0.08)',   border: 'rgba(251,146,60,0.22)'   },
  'Finance':                  { color: '#34d399', bg: 'rgba(52,211,153,0.08)',   border: 'rgba(52,211,153,0.22)'   },
  'Strategic':                { color: '#f472b6', bg: 'rgba(244,114,182,0.08)',  border: 'rgba(244,114,182,0.22)'  },
};

function sectionStyle(section) {
  return SECTION_STYLES[section] || {
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.08)',
    border: 'rgba(148,163,184,0.22)',
  };
}

// ── State ─────────────────────────────────────────────────
let allIdeas        = [];
let activeFile      = null;
let activeComplexity = 'all';
let searchQuery     = '';

// ── DOM ───────────────────────────────────────────────────
const ideasListEl   = document.getElementById('ideas-list');
const readingPaneEl = document.getElementById('reading-pane');
const searchInput   = document.getElementById('search-input');
const searchBadge   = document.getElementById('search-count');
const totalCountEl  = document.getElementById('total-count');
const sectionCountEl = document.getElementById('section-count');

// ── Boot ──────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('/ideas_index.json');
    allIdeas = await res.json();

    const sections = new Set(allIdeas.map(i => i.section));
    totalCountEl.textContent  = allIdeas.length;
    sectionCountEl.textContent = sections.size;

    renderSidebar(allIdeas);

    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderSidebar(filtered());
    });

    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeComplexity = pill.dataset.complexity;
        renderSidebar(filtered());
      });
    });
  } catch {
    ideasListEl.innerHTML =
      '<div class="no-results">Could not load ideas_index.json.<br>Run npm run predev first.</div>';
  }
}

// ── Filtering ─────────────────────────────────────────────
function filtered() {
  return allIdeas.filter(idea => {
    const matchSearch =
      !searchQuery ||
      idea.title.toLowerCase().includes(searchQuery) ||
      idea.section.toLowerCase().includes(searchQuery) ||
      idea.impact.toLowerCase().includes(searchQuery);

    const matchComplexity =
      activeComplexity === 'all' || idea.complexity.startsWith(activeComplexity);

    return matchSearch && matchComplexity;
  });
}

// ── Sidebar ───────────────────────────────────────────────
function ideaNum(filename) {
  const m = filename.match(/^(\d+)/);
  return m ? m[1] : '?';
}

function cleanTitle(raw) {
  // Strip leading "001 · " prefix
  return raw.replace(/^\d+\s*[·•]\s*/, '').trim();
}

function renderSidebar(ideas) {
  searchBadge.textContent = ideas.length;
  ideasListEl.innerHTML = '';

  if (!ideas.length) {
    ideasListEl.innerHTML = '<div class="no-results">No blueprints match<br>your current filters.</div>';
    return;
  }

  // Group by section, preserving insertion order
  const groups = new Map();
  ideas.forEach(idea => {
    if (!groups.has(idea.section)) groups.set(idea.section, []);
    groups.get(idea.section).push(idea);
  });

  groups.forEach((sectionIdeas, section) => {
    const style = sectionStyle(section);
    const groupEl = document.createElement('div');
    groupEl.className = 'section-group';

    // Section header
    const headerEl = document.createElement('div');
    headerEl.className = 'section-header';
    headerEl.innerHTML = `
      <span class="section-dot" style="background:${style.color}"></span>
      <span class="section-name">${section}</span>
      <span class="section-count">${sectionIdeas.length}</span>
      <span class="section-chevron">▾</span>
    `;
    headerEl.addEventListener('click', () => groupEl.classList.toggle('collapsed'));

    const cardsEl = document.createElement('div');
    cardsEl.className = 'section-cards';

    sectionIdeas.forEach((idea, idx) => {
      const card = document.createElement('div');
      card.className = 'idea-card';
      if (idea.file === activeFile) card.classList.add('active');

      card.style.cssText = `
        --section-color: ${style.color};
        animation-delay: ${Math.min(idx * 22, 220)}ms
      `;
      card.dataset.file = idea.file;

      const num = ideaNum(idea.file);
      card.innerHTML = `
        <div class="card-id">${num}</div>
        <div class="card-body">
          <div class="card-title">${cleanTitle(idea.title)}</div>
          <div class="card-tags">
            <span class="ctag">${idea.complexity}</span>
            <span class="ctag">${idea.impact}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.idea-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        activeFile = idea.file;
        loadIdea(idea, style);
      });

      cardsEl.appendChild(card);
    });

    groupEl.appendChild(headerEl);
    groupEl.appendChild(cardsEl);
    ideasListEl.appendChild(groupEl);
  });
}

// ── Reading pane ──────────────────────────────────────────
async function loadIdea(idea, style) {
  // Skeleton while loading
  readingPaneEl.innerHTML = `
    <div class="skeleton-doc">
      <div class="skel skel-title"></div>
      <div class="skel skel-meta"></div>
      <div class="skel skel-l skel-xl"></div>
      <div class="skel skel-l skel-lg"></div>
      <div class="skel skel-l skel-md" style="margin-bottom:28px"></div>
      <div class="skel skel-l skel-xl"></div>
      <div class="skel skel-l skel-lg"></div>
      <div class="skel skel-l skel-sm"></div>
    </div>
  `;

  try {
    const res = await fetch(`/ideas/${idea.file}`);
    if (!res.ok) throw new Error('fetch failed');
    const md = await res.text();

    // Parse markdown
    const rawHtml  = marked.parse(md);
    const cleanHtml = DOMPurify.sanitize(rawHtml);

    // Build document wrapper
    const doc = document.createElement('div');
    doc.className = 'idea-document';

    const num = ideaNum(idea.file);
    doc.innerHTML = `
      <div class="doc-header">
        <div class="doc-serial">BLUEPRINT · ${num.padStart(3, '0')}</div>
        <h1 class="doc-title">${cleanTitle(idea.title)}</h1>
        <div class="doc-meta">
          <span class="doc-chip section-chip"
            style="--chip-bg:${style.bg}; --chip-color:${style.color}; --chip-border:${style.border}">
            ${idea.section}
          </span>
          <span class="doc-chip meta-chip">${idea.complexity}</span>
          <span class="doc-chip meta-chip">${idea.impact}</span>
        </div>
      </div>
      <div class="md-body">${cleanHtml}</div>
    `;

    // Hide the first blockquote — it's the metadata line we already show above
    const firstBQ = doc.querySelector('.md-body blockquote');
    if (firstBQ) firstBQ.classList.add('meta-blockquote');

    // Convert [[wikilinks]] in text nodes to interactive spans
    convertWikiLinks(doc.querySelector('.md-body'));

    readingPaneEl.innerHTML = '';
    readingPaneEl.appendChild(doc);

    // Scroll back to top
    readingPaneEl.closest('.content-pane').scrollTop = 0;

    // Bind wiki-link clicks
    doc.querySelectorAll('.wiki-link').forEach(link => {
      link.addEventListener('click', () => navigateToWikiLink(link.dataset.target));
    });
  } catch {
    readingPaneEl.innerHTML =
      '<div class="no-results" style="padding:60px 40px">Failed to load blueprint.</div>';
  }
}

// Walk text nodes and replace [[Title]] with clickable spans
function convertWikiLinks(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);

  nodes.forEach(textNode => {
    if (!textNode.textContent.includes('[[')) return;
    const parts = textNode.textContent.split(/(\[\[.+?\]\])/g);
    if (parts.length <= 1) return;

    const frag = document.createDocumentFragment();
    parts.forEach(part => {
      const match = part.match(/^\[\[(.+?)\]\]$/);
      if (match) {
        const span = document.createElement('span');
        span.className = 'wiki-link';
        span.dataset.target = match[1];
        span.textContent = part;
        frag.appendChild(span);
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    });
    textNode.parentNode.replaceChild(frag, textNode);
  });
}

// Navigate when a wiki-link is clicked
function navigateToWikiLink(target) {
  if (!target) return;

  // Try to match by file name or title substring
  const needle = target.toLowerCase().replace(/^\d+\s*-\s*/, '');
  const found = allIdeas.find(i => {
    const fileBase = i.file.replace('.md', '').toLowerCase().replace(/^\d+\s*-\s*/, '');
    const titleLow = i.title.toLowerCase().replace(/^\d+\s*[·•]\s*/, '');
    return fileBase.includes(needle) || titleLow.includes(needle);
  });
  if (!found) return;

  const card = document.querySelector(`.idea-card[data-file="${found.file}"]`);
  if (card) {
    document.querySelectorAll('.idea-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  activeFile = found.file;
  loadIdea(found, sectionStyle(found.section));
}

init();
