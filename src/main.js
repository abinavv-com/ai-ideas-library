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
const ideasListEl    = document.getElementById('ideas-list');
const readingPaneEl  = document.getElementById('reading-pane');
const searchInput    = document.getElementById('search-input');
const searchBadge    = document.getElementById('search-count');
const totalCountEl   = document.getElementById('total-count');
const sectionCountEl = document.getElementById('section-count');

// ── localStorage helpers ──────────────────────────────────
function getEditedMd(file)        { return localStorage.getItem('ideas_edited:' + file); }
function setEditedMd(file, md)    { localStorage.setItem('ideas_edited:' + file, md); }
function deleteEditedMd(file)     { localStorage.removeItem('ideas_edited:' + file); }

function getCustomIdeas() {
  try { return JSON.parse(localStorage.getItem('ideas_custom') || '[]'); }
  catch { return []; }
}
function setCustomIdeas(arr)      { localStorage.setItem('ideas_custom', JSON.stringify(arr)); }
function getCustomMd(file)        { return localStorage.getItem('ideas_custom:' + file); }
function setCustomMd(file, md)    { localStorage.setItem('ideas_custom:' + file, md); }
function deleteCustomIdea(file) {
  localStorage.removeItem('ideas_custom:' + file);
  setCustomIdeas(getCustomIdeas().filter(i => i.file !== file));
}

// ── Boot ──────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('/ideas_index.json');
    allIdeas = await res.json();

    // Merge custom ideas from localStorage
    getCustomIdeas().forEach(idea => {
      if (!allIdeas.find(i => i.file === idea.file)) {
        allIdeas.push({ ...idea, isCustom: true });
      }
    });

    updateStats();
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

    document.getElementById('new-idea-btn').addEventListener('click', showNewIdeaForm);
  } catch {
    ideasListEl.innerHTML =
      '<div class="no-results">Could not load ideas_index.json.<br>Run npm run predev first.</div>';
  }
}

function updateStats() {
  const sections = new Set(allIdeas.map(i => i.section));
  totalCountEl.textContent  = allIdeas.length;
  sectionCountEl.textContent = sections.size;
}

// ── Filtering ─────────────────────────────────────────────
function filtered() {
  return allIdeas.filter(idea => {
    const matchSearch =
      !searchQuery ||
      idea.title.toLowerCase().includes(searchQuery) ||
      idea.section.toLowerCase().includes(searchQuery) ||
      (idea.impact || '').toLowerCase().includes(searchQuery);

    const matchComplexity =
      activeComplexity === 'all' || idea.complexity.startsWith(activeComplexity);

    return matchSearch && matchComplexity;
  });
}

// ── Sidebar ───────────────────────────────────────────────
function ideaNum(filename) {
  if (filename.startsWith('custom-')) return '✦';
  const m = filename.match(/^(\d+)/);
  return m ? m[1] : '?';
}

function cleanTitle(raw) {
  return raw.replace(/^\d+\s*[·•]\s*/, '').trim();
}

function renderSidebar(ideas) {
  searchBadge.textContent = ideas.length;
  ideasListEl.innerHTML = '';

  if (!ideas.length) {
    ideasListEl.innerHTML = '<div class="no-results">No blueprints match<br>your current filters.</div>';
    return;
  }

  const groups = new Map();
  ideas.forEach(idea => {
    if (!groups.has(idea.section)) groups.set(idea.section, []);
    groups.get(idea.section).push(idea);
  });

  groups.forEach((sectionIdeas, section) => {
    const style = sectionStyle(section);
    const groupEl = document.createElement('div');
    groupEl.className = 'section-group';

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
      if (idea.isCustom) card.classList.add('custom-idea');

      card.style.cssText = `
        --section-color: ${style.color};
        animation-delay: ${Math.min(idx * 22, 220)}ms
      `;
      card.dataset.file = idea.file;

      const num = ideaNum(idea.file);
      const isEdited = !idea.isCustom && !!getEditedMd(idea.file);
      const badge = idea.isCustom
        ? '<span class="card-badge badge-custom">NEW</span>'
        : isEdited
          ? '<span class="card-badge badge-edited">✎</span>'
          : '';

      card.innerHTML = `
        <div class="card-id">${num}</div>
        <div class="card-body">
          <div class="card-title">${cleanTitle(idea.title)}${badge}</div>
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
    let md = getEditedMd(idea.file);
    if (!md && idea.isCustom) md = getCustomMd(idea.file);
    if (!md) {
      const res = await fetch(`/ideas/${idea.file}`);
      if (!res.ok) throw new Error('fetch failed');
      md = await res.text();
    }
    renderDoc(idea, style, md);
  } catch {
    readingPaneEl.innerHTML =
      '<div class="no-results" style="padding:60px 40px">Failed to load blueprint.</div>';
  }
}

function renderDoc(idea, style, md) {
  const rawHtml   = marked.parse(md);
  const cleanHtml = DOMPurify.sanitize(rawHtml);

  const doc = document.createElement('div');
  doc.className = 'idea-document';

  const num = ideaNum(idea.file);
  const numDisplay = /^\d+$/.test(num) ? num.padStart(3, '0') : num;
  const isEdited = !idea.isCustom && !!getEditedMd(idea.file);

  const serialExtra = idea.isCustom
    ? ' · <span class="serial-badge badge-custom-serial">CUSTOM</span>'
    : isEdited
      ? ' · <span class="serial-badge badge-edited-serial">EDITED</span>'
      : '';

  doc.innerHTML = `
    <div class="doc-header">
      <div class="doc-serial">BLUEPRINT · ${numDisplay}${serialExtra}</div>
      <h1 class="doc-title">${cleanTitle(idea.title)}</h1>
      <div class="doc-meta">
        <span class="doc-chip section-chip"
          style="--chip-bg:${style.bg}; --chip-color:${style.color}; --chip-border:${style.border}">
          ${idea.section}
        </span>
        <span class="doc-chip meta-chip">${idea.complexity}</span>
        <span class="doc-chip meta-chip">${idea.impact}</span>
      </div>
      <div class="doc-actions">
        <button class="action-btn btn-edit">✎ Edit</button>
        <button class="action-btn btn-download">↓ Export .md</button>
        ${isEdited ? '<button class="action-btn btn-revert">↺ Revert</button>' : ''}
        ${idea.isCustom ? '<button class="action-btn btn-delete">✕ Delete</button>' : ''}
      </div>
    </div>
    <div class="md-body">${cleanHtml}</div>
  `;

  const firstBQ = doc.querySelector('.md-body blockquote');
  if (firstBQ) firstBQ.classList.add('meta-blockquote');

  convertWikiLinks(doc.querySelector('.md-body'));

  readingPaneEl.innerHTML = '';
  readingPaneEl.appendChild(doc);
  readingPaneEl.closest('.content-pane').scrollTop = 0;

  doc.querySelectorAll('.wiki-link').forEach(link => {
    link.addEventListener('click', () => navigateToWikiLink(link.dataset.target));
  });

  doc.querySelector('.btn-edit').addEventListener('click', () => showEditMode(idea, style, md));
  doc.querySelector('.btn-download').addEventListener('click', () => downloadMd(idea.file, md));

  doc.querySelector('.btn-revert')?.addEventListener('click', () => {
    if (!confirm('Revert to the original? Your edits will be lost.')) return;
    deleteEditedMd(idea.file);
    renderSidebar(filtered());
    loadIdea(idea, style);
  });

  doc.querySelector('.btn-delete')?.addEventListener('click', () => {
    if (!confirm(`Delete "${cleanTitle(idea.title)}"? This cannot be undone.`)) return;
    deleteCustomIdea(idea.file);
    allIdeas = allIdeas.filter(i => i.file !== idea.file);
    activeFile = null;
    updateStats();
    renderSidebar(filtered());
    showEmptyState();
  });
}

// ── Edit mode ─────────────────────────────────────────────
function showEditMode(idea, style, currentMd) {
  const doc = document.createElement('div');
  doc.className = 'idea-document editor-mode';

  const num = ideaNum(idea.file);
  const numDisplay = /^\d+$/.test(num) ? num.padStart(3, '0') : num;

  doc.innerHTML = `
    <div class="doc-header">
      <div class="doc-serial">BLUEPRINT · ${numDisplay} · <span class="serial-badge badge-editing-serial">EDITING</span></div>
      <h1 class="doc-title">${cleanTitle(idea.title)}</h1>
      <div class="doc-actions">
        <button class="action-btn btn-save-edit btn-primary">✓ Save</button>
        <button class="action-btn btn-preview-toggle">⊡ Preview</button>
        <button class="action-btn btn-cancel-edit">✕ Cancel</button>
      </div>
    </div>
    <div class="editor-container">
      <div class="editor-panel">
        <div class="editor-toolbar">
          <span class="editor-hint">Markdown · saved to browser storage, not the file</span>
        </div>
        <textarea class="md-editor" spellcheck="false"></textarea>
      </div>
      <div class="preview-panel" style="display:none">
        <div class="md-body preview-inner"></div>
      </div>
    </div>
  `;

  const textarea    = doc.querySelector('.md-editor');
  textarea.value    = currentMd;

  readingPaneEl.innerHTML = '';
  readingPaneEl.appendChild(doc);
  readingPaneEl.closest('.content-pane').scrollTop = 0;
  textarea.focus();

  let showingPreview = false;
  const previewBtn   = doc.querySelector('.btn-preview-toggle');
  const editorPanel  = doc.querySelector('.editor-panel');
  const previewPanel = doc.querySelector('.preview-panel');
  const previewInner = doc.querySelector('.preview-inner');

  previewBtn.addEventListener('click', () => {
    showingPreview = !showingPreview;
    if (showingPreview) {
      previewInner.innerHTML = DOMPurify.sanitize(marked.parse(textarea.value));
      editorPanel.style.display  = 'none';
      previewPanel.style.display = 'block';
      previewBtn.textContent = '✎ Edit';
    } else {
      editorPanel.style.display  = 'flex';
      previewPanel.style.display = 'none';
      previewBtn.textContent = '⊡ Preview';
      textarea.focus();
    }
  });

  doc.querySelector('.btn-save-edit').addEventListener('click', () => {
    const newMd = textarea.value;
    if (idea.isCustom) setCustomMd(idea.file, newMd);
    else setEditedMd(idea.file, newMd);
    renderSidebar(filtered());
    loadIdea(idea, style);
  });

  doc.querySelector('.btn-cancel-edit').addEventListener('click', () => loadIdea(idea, style));
}

// ── New idea form ─────────────────────────────────────────
function showNewIdeaForm() {
  activeFile = null;
  document.querySelectorAll('.idea-card').forEach(c => c.classList.remove('active'));

  const sections    = Object.keys(SECTION_STYLES);
  const complexities = ['🟢 Week 1–4', '🟡 Month 1–3', '🔴 Year 1–2'];
  const impacts     = ['⚡ Efficiency', '💰 Cost Savings', '🛡️ Safety', '🏆 Competitive', '📊 Analytics', '🔧 Maintenance', '🤝 Collaboration'];

  const form = document.createElement('div');
  form.className = 'idea-document new-idea-form';

  form.innerHTML = `
    <div class="doc-header">
      <div class="doc-serial">NEW BLUEPRINT</div>
      <h1 class="doc-title">Create New Idea</h1>
    </div>
    <div class="new-idea-fields">
      <div class="field-row">
        <label class="field-label">Title <span class="field-required">*</span></label>
        <input type="text" id="ni-title" class="field-input" placeholder="e.g. Smart Inventory Tracker" autocomplete="off" />
      </div>
      <div class="field-row field-grid">
        <div>
          <label class="field-label">Section</label>
          <select id="ni-section" class="field-select">
            ${sections.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="field-label">Complexity</label>
          <select id="ni-complexity" class="field-select">
            ${complexities.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="field-label">Impact</label>
          <select id="ni-impact" class="field-select">
            ${impacts.map(i => `<option value="${i}">${i}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field-row">
        <label class="field-label">Content <span class="field-hint">(Markdown — leave blank for a starter template)</span></label>
        <div class="editor-toolbar"><span class="editor-hint">Markdown</span></div>
        <textarea id="ni-content" class="md-editor ni-textarea" spellcheck="false" placeholder="# Your Idea Title&#10;&#10;## What It Does&#10;..."></textarea>
      </div>
      <div class="new-idea-actions">
        <button class="action-btn btn-primary" id="ni-save">+ Create Blueprint</button>
        <button class="action-btn" id="ni-cancel">✕ Cancel</button>
      </div>
    </div>
  `;

  readingPaneEl.innerHTML = '';
  readingPaneEl.appendChild(form);
  readingPaneEl.closest('.content-pane').scrollTop = 0;
  document.getElementById('ni-title').focus();

  document.getElementById('ni-cancel').addEventListener('click', showEmptyState);

  document.getElementById('ni-save').addEventListener('click', () => {
    const titleInput = document.getElementById('ni-title');
    const title      = titleInput.value.trim();
    const section    = document.getElementById('ni-section').value;
    const complexity = document.getElementById('ni-complexity').value;
    const impact     = document.getElementById('ni-impact').value;
    let   content    = document.getElementById('ni-content').value.trim();

    if (!title) {
      titleInput.focus();
      titleInput.classList.add('field-error');
      titleInput.addEventListener('input', () => titleInput.classList.remove('field-error'), { once: true });
      return;
    }

    if (!content) {
      content = `# ${title}\n\n> **Section**: ${section} | **Complexity**: ${complexity} | **Impact**: ${impact}\n> **Helps**: [Team/Role] | **Index**: []\n\n---\n\n## What It Does\n\n[Describe the problem and solution here.]\n\n---\n\n## Implementation Blueprint\n\n### Architecture\n\n[Add data flow or architecture diagram here.]\n\n### Tech Stack\n\n| Component | Tool | Purpose |\n|---|---|---|\n| [Layer] | [Technology] | [Why] |\n\n---\n\n## Notes\n\n[Any additional considerations.]\n`;
    }

    const filename   = `custom-${Date.now()}.md`;
    const indexEntry = { file: filename, title, section, complexity, impact, isCustom: true };

    const customs = getCustomIdeas();
    customs.push(indexEntry);
    setCustomIdeas(customs);
    setCustomMd(filename, content);

    allIdeas.push(indexEntry);
    updateStats();
    renderSidebar(filtered());

    activeFile = filename;
    loadIdea(indexEntry, sectionStyle(section));

    setTimeout(() => {
      const card = document.querySelector(`.idea-card[data-file="${filename}"]`);
      if (card) {
        card.classList.add('active');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  });
}

// ── Empty state ───────────────────────────────────────────
function showEmptyState() {
  readingPaneEl.innerHTML = `
    <div class="empty-state">
      <div class="empty-grid"></div>
      <div class="empty-content">
        <div class="empty-icon">
          <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="12" y="43" width="72" height="10" rx="5" fill="currentColor" opacity="0.15"/>
            <rect x="12" y="43" width="72" height="10" rx="5" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="22" cy="48" r="5" fill="currentColor"/>
            <circle cx="74" cy="48" r="5" fill="currentColor"/>
            <rect x="43" y="12" width="10" height="72" rx="5" fill="currentColor" opacity="0.15"/>
            <rect x="43" y="12" width="10" height="72" rx="5" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="48" cy="22" r="5" fill="currentColor"/>
            <circle cx="48" cy="74" r="5" fill="currentColor"/>
            <circle cx="48" cy="48" r="7" fill="currentColor" opacity="0.3"/>
            <circle cx="48" cy="48" r="4" fill="currentColor"/>
          </svg>
        </div>
        <h2 class="empty-title">SELECT A BLUEPRINT</h2>
        <p class="empty-body">
          Browse AI ideas built for Welspun's Pipe Division — each with a full architecture, tech stack, build steps, and cost breakdown.
        </p>
        <div class="empty-chips">
          <span class="empty-chip">${allIdeas.length} blueprints</span>
          <span class="empty-chip">8 sections</span>
          <span class="empty-chip">Welspun 2025</span>
        </div>
      </div>
    </div>
  `;
}

// ── Download ──────────────────────────────────────────────
function downloadMd(file, md) {
  const blob = new Blob([md], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = file;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Wiki-links ────────────────────────────────────────────
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

function navigateToWikiLink(target) {
  if (!target) return;
  const needle = target.toLowerCase().replace(/^\d+\s*-\s*/, '');
  const found  = allIdeas.find(i => {
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
