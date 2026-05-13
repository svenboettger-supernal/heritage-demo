// Heritage demo · App entry, router, state, view renderers.
import { CLIENTS, STAGES, CUSTOMER_TYPES, MORNING_DIGEST, clientById, stageById } from './data/clients.js';
import { TASKS, MEETINGS, PREP_PROTOCOL, MONDAY_RUNDOWN, STATUSES, PRIORITIES, tasksForClient, taskById, meetingById } from './data/work.js';
import { TICKETS, KB_ARTICLES, SAVED_VIEWS, PERSONAS, PERFORMANCE, ticketsForClient, ticketById } from './data/support.js';
import { BOTS, getHistory, appendMessage, resetHistory, matchIntent, suggestedReplies } from './chat.js';

const FOREMAN_AGENT_ID = 'agent_7201krgqhnnbebmrv5vtntkwhzkp';
let activeCallConversation = null;
let elevenLabsClientPromise = null;
function loadElevenLabsClient() {
  if (!elevenLabsClientPromise) {
    elevenLabsClientPromise = import('https://esm.sh/@elevenlabs/client@1.7.0');
  }
  return elevenLabsClientPromise;
}

/* ── Password gate (copied pattern from heritage-proposals) ── */

const GATE_KEY = 'supernal_heritage_unlocked';
const PASSWORD = 'ainative';

function setupGate() {
  const form = document.getElementById('proposal-gate-form');
  const input = document.getElementById('proposal-gate-input');
  const error = document.getElementById('proposal-gate-error');
  if (!form || !input) return;
  if (document.documentElement.classList.contains('locked')) {
    try { input.focus(); } catch (e) {}
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if ((input.value || '').toLowerCase().trim() === PASSWORD) {
      try { localStorage.setItem(GATE_KEY, '1'); } catch (e) {}
      document.documentElement.classList.remove('locked');
      document.documentElement.classList.add('unlocked');
      boot();
    } else {
      if (error) error.hidden = false;
      input.value = '';
      try { input.focus(); } catch (e) {}
    }
  });
  input.addEventListener('input', () => { if (error) error.hidden = true; });
}

/* ── App registry ──────────────────────────────────────────── */

const APPS = {
  hank: {
    id: 'hank',
    name: 'Hank',
    sub: 'CRM',
    initial: 'H',
    desc: 'One client record. Stages, health, happy paths.',
    default: 'clients',
    sidebar: [
      { id: 'clients', label: 'Pipeline', icon: 'list', route: 'clients' },
      { id: 'digest', label: 'Morning digest', icon: 'sun', route: 'digest' },
      { id: 'stages', label: 'Stages & happy paths', icon: 'flag', route: 'stages' },
    ],
  },
  foreman: {
    id: 'foreman',
    name: 'Foreman',
    sub: 'Project Manager',
    initial: 'F',
    desc: 'Shared task layer. Meetings, cadence, digests.',
    default: 'rundown',
    sidebar: [
      { id: 'rundown', label: 'Monday rundown', icon: 'rundown', route: 'rundown' },
      { id: 'tasks', label: 'Tasks', icon: 'check', route: 'tasks' },
      { id: 'meetings', label: 'Meetings', icon: 'calendar', route: 'meetings' },
      { id: 'prep', label: 'Prep protocol', icon: 'stairs', route: 'prep' },
    ],
  },
  sam: {
    id: 'sam',
    name: 'Sam',
    sub: 'Help Desk',
    initial: 'S',
    desc: 'In-app support, citations, escalations.',
    default: 'tickets',
    sidebar: [
      { id: 'tickets', label: 'Tickets', icon: 'inbox', route: 'tickets' },
      { id: 'kb', label: 'Knowledge base', icon: 'book', route: 'kb' },
      { id: 'report', label: 'Performance', icon: 'chart', route: 'report' },
    ],
  },
};

/* ── State + URL ──────────────────────────────────────────── */

const state = {
  app: 'hank',
  route: 'clients',
  params: {},
  query: {},
};

function parseHash() {
  const raw = window.location.hash.slice(1) || '/hank/clients';
  const [pathPart, queryPart] = raw.split('?');
  const segs = pathPart.split('/').filter(Boolean);
  const app = segs[0] && APPS[segs[0]] ? segs[0] : 'hank';
  const rest = segs.slice(1);
  const route = rest.join('/') || APPS[app].default;
  const params = {};
  const query = {};
  if (queryPart) {
    for (const pair of queryPart.split('&')) {
      const [k, v] = pair.split('=');
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }
  state.app = app;
  state.route = route;
  state.params = params;
  state.query = query;
}

function buildHash(opts = {}) {
  const app = opts.app || state.app;
  const route = opts.route !== undefined ? opts.route : state.route;
  const query = { ...state.query, ...(opts.query || {}) };
  if (opts.clearQuery) Object.keys(query).forEach((k) => delete query[k]);
  if (opts.removeQuery) opts.removeQuery.forEach((k) => delete query[k]);
  // strip falsy
  Object.keys(query).forEach((k) => { if (query[k] === undefined || query[k] === null || query[k] === '') delete query[k]; });
  let s = '#/' + app + (route ? '/' + route : '');
  const qs = Object.entries(query).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
  if (qs) s += '?' + qs;
  return s;
}

function navigate(opts) {
  window.location.hash = buildHash(opts);
}

function followClient(clientId) {
  const next = buildHash({ query: { client: clientId } });
  window.location.hash = next;
}

function unfollow() {
  const next = buildHash({ removeQuery: ['client'] });
  window.location.hash = next;
}

/* ── HTML helpers ────────────────────────────────────────── */

function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function avatarFor(name, size = '') {
  const v = hash(name) % 7;
  return `<span class="avatar avatar--viz-${v} ${size ? 'avatar--' + size : ''}">${esc(initials(name))}</span>`;
}

function healthDot(h) {
  return `<span class="health-dot health-dot--${h}" aria-label="${h}"></span>`;
}

function healthPill(c) {
  return `<span class="health-pill health-pill--${c.health}">${healthDot(c.health)} ${c.health === 'green' ? 'On Track' : c.health === 'amber' ? 'At Risk' : 'Critical'}</span>`;
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) { return d; }
}

function shortDate(d) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) { return d; }
}

function fmtMoney(n) {
  if (!n) return '—';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'K';
  return '$' + n;
}

function priorityBadge(p) {
  const cls = p === 'Urgent' ? 'error' : p === 'High' ? 'warning' : p === 'Normal' ? 'info' : 'outline';
  return `<span class="badge badge--${cls}">${esc(p)}</span>`;
}

function statusBadge(s) {
  const cls = s === 'Done' ? 'success' : s === 'In Progress' ? 'info' : s === 'Blocked' ? 'error' : 'outline';
  return `<span class="badge badge--${cls}">${esc(s)}</span>`;
}

function personaBadge(personaId) {
  const p = PERSONAS[personaId];
  if (!p) return '';
  return `<span class="badge badge--${p.viz.replace('viz-', 'viz-')}">${esc(p.label)}</span>`;
}

function clientLink(clientId, opts = {}) {
  const c = clientById(clientId);
  if (!c) return esc(clientId || '—');
  const followQuery = opts.follow ? `?client=${clientId}` : '';
  return `<a href="#/hank/clients/${clientId}${followQuery}" data-action="open-client" data-client="${clientId}">${esc(c.name)}</a>`;
}

function clientChip(c) {
  return `<span class="row" style="gap:8px">${avatarFor(c.name, 'sm')} ${esc(c.name)}</span>`;
}

function svg(name) {
  const ICONS = {
    list: '<path d="M3 4h10M3 8h10M3 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    sun: '<circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    flag: '<path d="M3 14V2M3 3h9l-2 3 2 3H3" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    rundown: '<rect x="2" y="3" width="12" height="3" rx="1" fill="currentColor" opacity="0.5"/><rect x="2" y="7" width="9" height="3" rx="1" fill="currentColor" opacity="0.75"/><rect x="2" y="11" width="6" height="3" rx="1" fill="currentColor"/>',
    check: '<path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    calendar: '<rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M2 6h12M5 1.5v2M11 1.5v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    stairs: '<path d="M2 13h3v-3h3V7h3V4h3" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    inbox: '<path d="M2 9l1.5-6h9L14 9v4a1 1 0 01-1 1H3a1 1 0 01-1-1V9zM2 9h3l1 2h4l1-2h3" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    book: '<path d="M3 2.5a1 1 0 011-1h8a1 1 0 011 1V13l-2-1-3 1-3-1-2 1V2.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    chart: '<path d="M3 12V6M7 12V3M11 12V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    plus: '<path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    arrow: '<path d="M5 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    back: '<path d="M11 3L6 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    pen: '<path d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  };
  return `<svg class="icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* ── Shell render (top bar trigger + sidebar) ─────────────── */

function renderShell() {
  // App-switcher trigger
  const app = APPS[state.app];
  document.getElementById('app-switcher-icon').textContent = app.initial;
  document.getElementById('app-switcher-icon').className = `app-icon app-icon--${app.id}`;
  document.getElementById('app-switcher-name').textContent = app.name;
  document.getElementById('app-switcher-sub').textContent = app.sub;

  // App-switcher menu
  const menu = document.getElementById('app-switcher-menu');
  menu.innerHTML = Object.values(APPS).map((a) => `
    <button class="app-switcher-item" data-action="switch-app" data-app="${a.id}" data-current="${a.id === state.app}">
      <span class="app-icon app-icon--${a.id}">${a.initial}</span>
      <span class="app-switcher-item-meta">
        <strong>${esc(a.name)} · ${esc(a.sub)}</strong>
        <span>${esc(a.desc)}</span>
      </span>
    </button>
  `).join('');

  // Sidebar
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="sidebar-section-label">${esc(app.name)}</div>
    ${app.sidebar.map((item) => `
      <a class="sidebar-item" href="#/${app.id}/${item.route}${state.query.client ? '?client=' + state.query.client : ''}" data-active="${state.route.split('/')[0] === item.route}">
        ${svg(item.icon)}
        <span>${esc(item.label)}</span>
      </a>
    `).join('')}
    <div class="sidebar-foot">
      Heritage AI Employee Operating System · Demo build · Data is fictional.
    </div>
  `;

  // Following chip
  const chipSlot = document.getElementById('following-chip-slot');
  if (state.query.client) {
    const c = clientById(state.query.client);
    if (c) {
      chipSlot.innerHTML = `<span class="following-chip">Following: ${esc(c.name)} <button type="button" data-action="unfollow" aria-label="Stop following">✕</button></span>`;
    } else chipSlot.innerHTML = '';
  } else {
    chipSlot.innerHTML = '';
  }
}

/* ── Hank · Pipeline ─────────────────────────────────────── */

const HEALTH_LABEL = { green: 'On Track', amber: 'At Risk', red: 'Critical' };

function renderHankPipeline() {
  const filterStage = state.query.stage || 'all';
  const filterHealth = state.query.health || 'all';
  const filterType = state.query.type || 'all';
  const clients = CLIENTS.filter((c) => {
    if (filterStage !== 'all' && c.stage !== filterStage) return false;
    if (filterHealth !== 'all' && c.health !== filterHealth) return false;
    if (filterType !== 'all' && c.customerType !== filterType) return false;
    return true;
  });

  const stageCount = (id) => CLIENTS.filter((c) => c.stage === id).length;
  const healthCount = (h) => CLIENTS.filter((c) => c.health === h).length;

  return `
    <div class="page-head">
      <span class="page-kicker">Hank · CRM</span>
      <div class="page-head-row">
        <h1>Pipeline</h1>
        <div class="page-actions">
          <button class="btn btn--secondary btn--sm">${svg('plus')} New record</button>
          <button class="btn btn--primary btn--sm" data-action="open-draft-modal" data-draft="bulk">${svg('pen')} Draft outbound batch</button>
        </div>
      </div>
      <p class="page-sub">${clients.length} of ${CLIENTS.length} records · Single source of truth per prospect and client.</p>
    </div>

    <div class="filter-bar">
      <span class="caption">Stage</span>
      <button class="filter-chip" data-action="filter" data-filter="stage" data-value="all" data-active="${filterStage === 'all'}">All <span class="filter-chip-count">${CLIENTS.length}</span></button>
      ${STAGES.filter((s) => s.id !== 'churned').map((s) => `<button class="filter-chip" data-action="filter" data-filter="stage" data-value="${s.id}" data-active="${filterStage === s.id}">${esc(s.label)} <span class="filter-chip-count">${stageCount(s.id)}</span></button>`).join('')}
      <span style="width:12px"></span>
      <span class="caption">Health</span>
      <button class="filter-chip" data-action="filter" data-filter="health" data-value="all" data-active="${filterHealth === 'all'}">All</button>
      <button class="filter-chip" data-action="filter" data-filter="health" data-value="green" data-active="${filterHealth === 'green'}">${healthDot('green')} On Track <span class="filter-chip-count">${healthCount('green')}</span></button>
      <button class="filter-chip" data-action="filter" data-filter="health" data-value="amber" data-active="${filterHealth === 'amber'}">${healthDot('amber')} At Risk <span class="filter-chip-count">${healthCount('amber')}</span></button>
      <button class="filter-chip" data-action="filter" data-filter="health" data-value="red" data-active="${filterHealth === 'red'}">${healthDot('red')} Critical <span class="filter-chip-count">${healthCount('red')}</span></button>
      <span style="width:12px"></span>
      <span class="caption">Type</span>
      <button class="filter-chip" data-action="filter" data-filter="type" data-value="all" data-active="${filterType === 'all'}">All</button>
      ${Object.entries(CUSTOMER_TYPES).map(([id, t]) => `<button class="filter-chip" data-action="filter" data-filter="type" data-value="${id}" data-active="${filterType === id}">${esc(t.label)}</button>`).join('')}
    </div>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Stage</th>
            <th>Health</th>
            <th>Owner</th>
            <th>Last touch</th>
            <th class="col-right">Open opps</th>
          </tr>
        </thead>
        <tbody>
          ${clients.map((c) => `
            <tr data-action="open-client" data-client="${c.id}">
              <td>
                <div class="row" style="gap:10px">
                  ${avatarFor(c.name, 'sm')}
                  <div>
                    <div style="font-weight:500">${esc(c.name)}</div>
                    <div class="tiny muted">${esc(c.kicker)}</div>
                  </div>
                </div>
              </td>
              <td>${esc(stageById(c.stage)?.label || c.stage)}</td>
              <td>${healthPill(c)}</td>
              <td>${esc(c.owner)}</td>
              <td class="muted tiny">${esc(c.lastTouch)}</td>
              <td class="col-right">${c.opportunities.length}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ── Hank · Client record ────────────────────────────────── */

function renderHankClient() {
  const id = state.route.split('/')[1];
  const c = clientById(id);
  if (!c) return renderNotFound('Client');

  const tab = state.query.tab || 'overview';
  const stage = stageById(c.stage);
  const idx = STAGES.findIndex((s) => s.id === c.stage);

  const tabsBar = `
    <div class="tabs">
      ${['overview', 'stakeholders', 'activity', 'documents', 'tasks', 'opportunities'].map((t) => `
        <a class="tab" href="#/hank/clients/${c.id}?tab=${t}${state.query.client ? '&client=' + state.query.client : ''}" data-active="${tab === t}">${esc(t[0].toUpperCase() + t.slice(1))}${tabCount(t, c)}</a>
      `).join('')}
    </div>
  `;

  let body;
  if (tab === 'overview') body = hankOverview(c, stage, idx);
  else if (tab === 'stakeholders') body = hankStakeholders(c);
  else if (tab === 'activity') body = hankActivity(c);
  else if (tab === 'documents') body = hankDocuments(c);
  else if (tab === 'tasks') body = hankClientTasks(c);
  else if (tab === 'opportunities') body = hankOpportunities(c);

  return `
    <div class="page-head">
      <a href="#/hank/clients${state.query.client ? '?client=' + state.query.client : ''}" class="btn btn--ghost btn--sm" style="align-self:flex-start;margin-bottom:8px">${svg('back')} All clients</a>
      <div class="page-head-row">
        <div class="row" style="gap:14px">
          ${avatarFor(c.name, 'lg')}
          <div>
            <span class="page-kicker">Client record · Hank</span>
            <h1>${esc(c.name)}</h1>
            <div class="row" style="gap:8px;margin-top:6px">
              ${healthPill(c)}
              <span class="badge badge--${CUSTOMER_TYPES[c.customerType].viz}">${esc(CUSTOMER_TYPES[c.customerType].label)}</span>
              <span class="tiny muted">${esc(c.kicker)}</span>
            </div>
          </div>
        </div>
        <div class="page-actions">
          <button class="btn btn--secondary btn--sm">Edit record</button>
          <button class="btn btn--primary btn--sm" data-action="open-draft-modal" data-draft="${c.id}">${svg('pen')} Draft outbound</button>
        </div>
      </div>
    </div>

    <div class="record-layout">
      <div>
        ${tabsBar}
        ${body}
      </div>
      <aside class="rail">
        <div class="insight">
          <div class="insight-head">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3l2 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Hank's read
          </div>
          <div class="insight-body">${esc(c.insight)}</div>
        </div>
        <div class="card">
          <div class="card-title">Next step</div>
          <p style="margin-top:8px">${esc(c.nextStep)}</p>
        </div>
        <div class="card">
          <div class="card-title">At a glance</div>
          <div class="stack" style="margin-top:10px">
            <div class="row-between"><span class="muted tiny">Days in stage</span><strong>${c.daysInStage}</strong></div>
            <div class="row-between"><span class="muted tiny">Owner</span><strong>${esc(c.owner)}</strong></div>
            ${c.netWorthBand ? `<div class="row-between"><span class="muted tiny">Net worth band</span><strong>${esc(c.netWorthBand)}</strong></div>` : ''}
            <div class="row-between"><span class="muted tiny">Customer type</span><strong>${esc(CUSTOMER_TYPES[c.customerType].label)}</strong></div>
            <div class="row-between"><span class="muted tiny">Last touch</span><strong>${esc(c.lastTouch)}</strong></div>
          </div>
        </div>
      </aside>
    </div>
  `;
}

function tabCount(tab, c) {
  const map = {
    stakeholders: c.stakeholders.length,
    activity: c.activity.length,
    documents: c.documents.length,
    tasks: tasksForClient(c.id).length,
    opportunities: c.opportunities.length,
  };
  if (map[tab] === undefined) return '';
  return `<span class="tab-counter">${map[tab]}</span>`;
}

function hankOverview(c, stage, idx) {
  return `
    <div class="card">
      <div class="card-title">Stage progress</div>
      <div class="stage-track">
        ${STAGES.filter((s) => s.id !== 'churned').map((s, i) => `
          <div class="stage-step" data-state="${i < idx ? 'done' : i === idx ? 'current' : 'upcoming'}">
            <span class="stage-step-bullet">${i < idx ? '✓' : i + 1}</span>
            <span class="stage-step-label">${esc(s.label)}</span>
          </div>
        `).join('')}
      </div>
      <p class="muted tiny" style="margin-bottom:16px">${esc(stage?.description || '')}</p>

      <div class="card-title" style="margin-top:8px">Happy-path checklist · ${esc(stage?.label)}</div>
      <div class="checklist" style="margin-top:10px">
        ${stage.happyPath.map((step, i) => {
          const stateAttr = i < 2 ? 'done' : i === 2 ? 'doing' : 'todo';
          return `
            <div class="checklist-item" data-state="${stateAttr}">
              <span class="checklist-tick">${stateAttr === 'done' ? '✓' : ''}</span>
              <span class="checklist-label">${esc(step)}</span>
              <span class="checklist-meta">${stateAttr === 'done' ? 'Closed' : stateAttr === 'doing' ? 'In Foreman · ' + esc(c.owner) : 'Auto-instantiates'}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function hankStakeholders(c) {
  return `
    <div class="card">
      <div class="row-between" style="margin-bottom:6px">
        <div class="card-title">Stakeholders</div>
        <button class="btn btn--ghost btn--sm">${svg('plus')} Add stakeholder</button>
      </div>
      ${c.stakeholders.map((s) => `
        <div class="stakeholder-row">
          ${avatarFor(s.name, 'sm')}
          <div>
            <div class="stakeholder-name">${esc(s.name)}</div>
            <div class="stakeholder-meta">${esc([s.firm, s.email, s.phone].filter(Boolean).join(' · '))}</div>
          </div>
          <span class="role-tag">${esc(s.role)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function hankActivity(c) {
  const sorted = [...c.activity].sort((a, b) => (a.date < b.date ? 1 : -1));
  return `
    <div class="card">
      <div class="row-between" style="margin-bottom:14px">
        <div class="card-title">Activity</div>
        <div class="row" style="gap:8px">
          <button class="filter-chip" data-active="true">All</button>
          <button class="filter-chip">Emails</button>
          <button class="filter-chip">Calls</button>
          <button class="filter-chip">Meetings</button>
        </div>
      </div>
      <div class="timeline">
        ${sorted.map((a) => `
          <div class="timeline-item" data-type="${esc(a.type)}">
            <div class="timeline-date">${shortDate(a.date)}</div>
            <div class="timeline-body">
              <strong>${esc(a.type[0].toUpperCase() + a.type.slice(1))}</strong> · ${esc(a.summary)}
              <div class="who tiny">${esc(a.who)}${a.source ? ' · <a href="#/foreman/meetings/' + a.source + '">View meeting</a>' : ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function hankDocuments(c) {
  const docByType = (t) => t === 'Word' ? 'word' : t === 'Excel' ? 'excel' : 'pdf';
  return `
    <div class="card">
      <div class="row-between" style="margin-bottom:10px">
        <div class="card-title">Documents · ${c.documents.length} · SharePoint</div>
        <span class="badge badge--outline">Read-only</span>
      </div>
      ${c.documents.length === 0 ? '<div class="empty"><h3>No documents yet</h3><p class="muted">Documents surface here as SharePoint indexes them.</p></div>' : c.documents.map((d) => `
        <div class="doc-row">
          <span class="doc-icon doc-icon--${docByType(d.type)}">${esc(d.type.slice(0, 3).toUpperCase())}</span>
          <div>
            <div>${esc(d.name)}</div>
            <div class="doc-meta">${esc(d.source)} · ${esc(d.type)}</div>
          </div>
          <div class="doc-meta">Modified ${shortDate(d.lastModified)}</div>
          <button class="btn btn--ghost btn--sm">Open</button>
        </div>
      `).join('')}
    </div>
  `;
}

function hankClientTasks(c) {
  const tasks = tasksForClient(c.id);
  if (tasks.length === 0) return `<div class="card empty"><h3>No tasks for ${esc(c.name)}</h3><p class="muted">Tasks created in Foreman attached to this client surface here.</p></div>`;
  return `
    <div class="card">
      <div class="row-between" style="margin-bottom:10px">
        <div class="card-title">Tasks · pulled from Foreman</div>
        <a class="btn btn--ghost btn--sm" href="#/foreman/tasks?client=${c.id}">Open in Foreman ${svg('arrow')}</a>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Task</th><th>Owner</th><th>Due</th><th>Status</th><th>Priority</th></tr></thead>
          <tbody>
            ${tasks.map((t) => `
              <tr data-action="open-task" data-task="${t.id}">
                <td><div style="font-weight:500">${esc(t.title)}</div><div class="tiny muted col-mono">${esc(t.id)}</div></td>
                <td>${esc(t.owner)}</td>
                <td class="muted">${shortDate(t.due)}</td>
                <td>${statusBadge(t.status)}</td>
                <td>${priorityBadge(t.priority)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function hankOpportunities(c) {
  if (c.opportunities.length === 0) return `<div class="card empty"><h3>No open opportunities</h3><p class="muted">Hank surfaces opportunities during stage transitions and Partner Reviews.</p></div>`;
  return `
    <div class="card">
      <div class="card-title" style="margin-bottom:10px">Opportunities</div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Name</th><th>Type</th><th class="col-right">Expected revenue</th><th>Status</th><th>Owner</th><th>Due</th></tr></thead>
          <tbody>
            ${c.opportunities.map((o) => `
              <tr>
                <td><div style="font-weight:500">${esc(o.name)}</div></td>
                <td><span class="badge">${esc(o.type)}</span></td>
                <td class="col-right col-mono">${fmtMoney(o.expectedRevenue)}</td>
                <td>${o.status === 'Stalled' ? '<span class="badge badge--warning">Stalled</span>' : '<span class="badge badge--info">' + esc(o.status) + '</span>'}</td>
                <td>${esc(o.owner)}</td>
                <td class="muted">${shortDate(o.dueDate)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ── Hank · Morning digest ───────────────────────────────── */

function renderHankDigest() {
  const d = MORNING_DIGEST;
  return `
    <div class="page-head">
      <span class="page-kicker">Hank · CRM</span>
      <div class="page-head-row">
        <h1>Morning client digest</h1>
        <span class="muted tiny">${fmtDate(d.date)}</span>
      </div>
      <p class="page-sub">Who moved stages, who is at risk, what to look at today.</p>
    </div>

    <div class="card-grid card-grid--3">
      <div class="card">
        <div class="card-title">Stage movers</div>
        <div class="stack" style="margin-top:12px">
          ${d.movers.map((m) => {
            const c = clientById(m.clientId);
            return `
              <a href="#/hank/clients/${m.clientId}?client=${m.clientId}" data-action="open-client" data-client="${m.clientId}" style="text-decoration:none;color:inherit">
                <div class="row" style="gap:10px">
                  ${avatarFor(c.name, 'sm')}
                  <div>
                    <div style="font-weight:500">${esc(c.name)}</div>
                    <div class="tiny muted">${esc(stageById(m.from).label)} → ${esc(stageById(m.to).label)} · ${esc(m.when)}</div>
                  </div>
                </div>
              </a>
            `;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-title">At risk</div>
        <div class="stack" style="margin-top:12px">
          ${d.atRisk.map((cid) => {
            const c = clientById(cid);
            return `
              <a href="#/hank/clients/${cid}?client=${cid}" data-action="open-client" data-client="${cid}" style="text-decoration:none;color:inherit">
                <div class="row-between" style="gap:8px">
                  <div class="row" style="gap:8px">
                    ${healthDot(c.health)}
                    <span style="font-weight:500">${esc(c.name)}</span>
                  </div>
                  <span class="tiny muted">${esc(HEALTH_LABEL[c.health])}</span>
                </div>
                <div class="tiny muted" style="margin-top:2px">${esc(c.healthReason)}</div>
              </a>
            `;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-title">Today's focus</div>
        <div class="stack" style="margin-top:12px">
          ${d.todaysFocus.map((f) => {
            const c = clientById(f.clientId);
            return `
              <a href="#/hank/clients/${f.clientId}?client=${f.clientId}" data-action="open-client" data-client="${f.clientId}" style="text-decoration:none;color:inherit">
                <div style="font-weight:500">${esc(c.name)}</div>
                <div class="tiny muted">${esc(f.note)}</div>
              </a>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

/* ── Hank · Stages & happy paths ─────────────────────────── */

function renderHankStages() {
  return `
    <div class="page-head">
      <span class="page-kicker">Hank · CRM</span>
      <h1>Stages & happy paths</h1>
      <p class="page-sub">Each client carries a stage. Hank advances the happy-path checklist for that stage. Tasks auto-instantiate into Foreman on stage entry.</p>
    </div>

    <div class="card-grid card-grid--2">
      ${STAGES.filter((s) => s.id !== 'churned').map((s, i) => `
        <div class="card">
          <div class="row" style="gap:12px;align-items:flex-start">
            <div class="stage-step-bullet" style="background:${i === 3 ? 'var(--action)' : 'var(--surface-2)'};color:${i === 3 ? 'var(--action-fg)' : 'var(--fg-muted)'};flex:none">${i + 1}</div>
            <div style="flex:1">
              <h3>${esc(s.label)}</h3>
              <p class="muted tiny" style="margin-top:4px">${esc(s.description)}</p>
              <div class="checklist" style="margin-top:12px">
                ${s.happyPath.map((step) => `
                  <div class="checklist-item" data-state="todo">
                    <span class="checklist-tick"></span>
                    <span class="checklist-label">${esc(step)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ── Foreman · Monday rundown ────────────────────────────── */

function renderForemanRundown() {
  const r = MONDAY_RUNDOWN;
  return `
    <div class="page-head">
      <span class="page-kicker">Foreman · Project Manager</span>
      <div class="page-head-row">
        <h1>Monday rundown</h1>
        <span class="muted tiny">${fmtDate(r.date)}</span>
      </div>
      <p class="page-sub">Live, color-coded view of every engagement. Green, amber, red, every line with a reason.</p>
    </div>

    <div class="card mb-md">
      <div class="card-title" style="margin-bottom:8px">Top risks today</div>
      <div class="stack" style="margin-top:6px">
        ${r.topRisks.map((tr) => `
          <div class="row" style="gap:12px;align-items:flex-start">
            <span class="health-dot health-dot--red" style="margin-top:6px"></span>
            <div style="flex:1">
              <div><strong>${esc(tr.risk)}</strong></div>
              <div class="tiny muted">${esc(tr.action)} · ${clientLink(tr.clientId, { follow: true })}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="section-title">Engagements</div>
    ${r.rows.map((row) => {
      const c = clientById(row.clientId);
      return `
        <a class="rundown-row" href="#/hank/clients/${row.clientId}?client=${row.clientId}" data-action="open-client" data-client="${row.clientId}">
          <span class="health-dot health-dot--${row.status}"></span>
          <div class="row" style="gap:10px">${avatarFor(c.name, 'sm')}<strong>${esc(c.name)}</strong></div>
          <div class="rundown-reason">${esc(row.reason)}</div>
          <span class="badge badge--outline">${esc(c.owner)}</span>
        </a>
      `;
    }).join('')}
  `;
}

/* ── Foreman · Tasks (List / Board / Calendar) ───────────── */

function renderForemanTasks() {
  const view = state.query.view || 'list';
  const owner = state.query.owner || 'all';
  const status = state.query.status || 'all';
  const priority = state.query.priority || 'all';
  const followingClient = state.query.client;
  let tasks = TASKS.slice();
  if (followingClient) tasks = tasks.filter((t) => t.clientId === followingClient);
  if (owner !== 'all') tasks = tasks.filter((t) => t.owner === owner);
  if (status !== 'all') tasks = tasks.filter((t) => t.status === status);
  if (priority !== 'all') tasks = tasks.filter((t) => t.priority === priority);

  const owners = Array.from(new Set(TASKS.map((t) => t.owner))).sort();

  return `
    <div class="page-head">
      <span class="page-kicker">Foreman · Project Manager</span>
      <div class="page-head-row">
        <h1>Tasks</h1>
        <div class="page-actions">
          <div class="segmented">
            ${['list', 'board', 'calendar'].map((v) => `<button class="segmented-item" data-active="${view === v}" data-action="set-view" data-view="${v}">${esc(v[0].toUpperCase() + v.slice(1))}</button>`).join('')}
          </div>
          <button class="btn btn--primary btn--sm">${svg('plus')} New task</button>
        </div>
      </div>
      <p class="page-sub">${tasks.length} task${tasks.length === 1 ? '' : 's'} · Heritage no-dates standard enforced. ${followingClient ? `Filtered by <a href="#" data-action="unfollow">${esc(clientById(followingClient)?.name || '')}</a>.` : 'Across every engagement.'}</p>
    </div>

    <div class="filter-bar">
      <span class="caption">Status</span>
      <button class="filter-chip" data-action="filter" data-filter="status" data-value="all" data-active="${status === 'all'}">All</button>
      ${STATUSES.map((s) => `<button class="filter-chip" data-action="filter" data-filter="status" data-value="${s}" data-active="${status === s}">${esc(s)}</button>`).join('')}
      <span style="width:12px"></span>
      <span class="caption">Priority</span>
      <button class="filter-chip" data-action="filter" data-filter="priority" data-value="all" data-active="${priority === 'all'}">All</button>
      ${PRIORITIES.map((p) => `<button class="filter-chip" data-action="filter" data-filter="priority" data-value="${p}" data-active="${priority === p}">${esc(p)}</button>`).join('')}
      <span style="width:12px"></span>
      <span class="caption">Owner</span>
      <button class="filter-chip" data-action="filter" data-filter="owner" data-value="all" data-active="${owner === 'all'}">All</button>
      ${owners.map((o) => `<button class="filter-chip" data-action="filter" data-filter="owner" data-value="${o}" data-active="${owner === o}">${esc(o)}</button>`).join('')}
    </div>

    ${view === 'list' ? renderForemanTasksList(tasks) : view === 'board' ? renderForemanTasksBoard(tasks) : renderForemanTasksCalendar(tasks)}
  `;
}

function renderForemanTasksList(tasks) {
  if (tasks.length === 0) return `<div class="card empty"><h3>No matching tasks</h3><p class="muted">Adjust filters to see more.</p></div>`;
  return `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th style="width:40px"></th>
            <th>Task</th>
            <th>Engagement</th>
            <th>Owner</th>
            <th>Due</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Labels</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map((t) => `
            <tr data-action="open-task" data-task="${t.id}">
              <td><input type="checkbox" data-action="select-task" data-task="${t.id}" onclick="event.stopPropagation()"></td>
              <td><div style="font-weight:500">${esc(t.title)}</div><div class="tiny muted col-mono">${esc(t.id)}</div></td>
              <td class="muted tiny">${esc(t.engagement)}</td>
              <td>${esc(t.owner)}</td>
              <td class="${overdueClass(t)} muted">${shortDate(t.due)}</td>
              <td>${statusBadge(t.status)}</td>
              <td>${priorityBadge(t.priority)}</td>
              <td>${t.labels.slice(0, 2).map((l) => `<span class="badge">${esc(l)}</span>`).join(' ')}${t.labels.length > 2 ? ' <span class="tiny muted">+' + (t.labels.length - 2) + '</span>' : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function overdueClass(t) {
  if (t.status === 'Done') return '';
  if (!t.due) return '';
  return new Date(t.due) < new Date('2026-05-12') ? '' : '';
}

function renderForemanTasksBoard(tasks) {
  return `
    <div class="kanban">
      ${STATUSES.map((s) => `
        <div class="kanban-col">
          <div class="kanban-col-head">
            <span>${esc(s)}</span>
            <span class="tab-counter">${tasks.filter((t) => t.status === s).length}</span>
          </div>
          ${tasks.filter((t) => t.status === s).map((t) => `
            <div class="kanban-card" data-action="open-task" data-task="${t.id}">
              <div class="kanban-card-title">${esc(t.title)}</div>
              <div class="kanban-card-meta">
                ${priorityBadge(t.priority)}
                <span class="muted">${esc(t.id)}</span>
              </div>
              <div class="kanban-card-meta">
                ${avatarFor(t.owner, 'sm')}
                <span>${esc(t.owner)}</span>
                <span class="muted" style="margin-left:auto">${shortDate(t.due)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

function renderForemanTasksCalendar(tasks) {
  const today = new Date('2026-05-12');
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday-first
  const cells = [];
  for (let i = 0; i < 35; i++) {
    const d = new Date(year, month, 1 - offset + i);
    cells.push(d);
  }
  const taskByDate = {};
  for (const t of tasks) {
    if (!t.due) continue;
    const k = t.due;
    (taskByDate[k] = taskByDate[k] || []).push(t);
  }
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return `
    <div class="calendar">
      ${weekdays.map((w) => `<div class="calendar-head">${w}</div>`).join('')}
      ${cells.map((d) => {
        const iso = d.toISOString().slice(0, 10);
        const other = d.getMonth() !== month;
        const isToday = iso === '2026-05-12';
        const tt = taskByDate[iso] || [];
        return `
          <div class="calendar-cell" data-other="${other}" data-today="${isToday}">
            <div class="calendar-day">${d.getDate()}</div>
            ${tt.slice(0, 3).map((t) => `<div class="calendar-task" data-priority="${esc(t.priority)}" data-action="open-task" data-task="${t.id}" title="${esc(t.title)}">${esc(t.title)}</div>`).join('')}
            ${tt.length > 3 ? `<div class="tiny muted">+${tt.length - 3} more</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* ── Foreman · Task detail ───────────────────────────────── */

function renderForemanTaskDetail() {
  const id = state.route.split('/')[1];
  const t = taskById(id);
  if (!t) return renderNotFound('Task');
  const client = t.clientId ? clientById(t.clientId) : null;

  return `
    <div class="page-head">
      <a href="#/foreman/tasks${state.query.client ? '?client=' + state.query.client : ''}" class="btn btn--ghost btn--sm" style="align-self:flex-start;margin-bottom:8px">${svg('back')} All tasks</a>
      <div class="page-head-row">
        <div>
          <span class="page-kicker">Task · ${esc(t.id)}</span>
          <h1>${esc(t.title)}</h1>
          <div class="row" style="gap:8px;margin-top:8px">
            ${statusBadge(t.status)}
            ${priorityBadge(t.priority)}
            ${client ? `<span class="badge">${esc(client.name)}</span>` : ''}
            ${t.labels.map((l) => `<span class="badge badge--outline">${esc(l)}</span>`).join('')}
          </div>
        </div>
        <div class="page-actions">
          <button class="btn btn--secondary btn--sm">Mark in progress</button>
          <button class="btn btn--primary btn--sm">Mark done</button>
        </div>
      </div>
    </div>

    <div class="record-layout">
      <div class="stack--lg">
        <div class="card">
          <div class="card-title">Description</div>
          <p style="margin-top:8px">${esc(t.description)}</p>
        </div>

        ${t.subtasks.length ? `
          <div class="card">
            <div class="card-title">Sub-tasks · ${t.subtasks.filter((s) => s.done).length} of ${t.subtasks.length} done</div>
            ${t.subtasks.map((s) => `
              <div class="subtask-row">
                <span class="checklist-tick" style="${s.done ? 'background:var(--action);border-color:var(--action);color:white' : ''}">${s.done ? '✓' : ''}</span>
                <span style="${s.done ? 'color:var(--fg-muted);text-decoration:line-through' : ''}">${esc(s.title)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${t.dependencies.length ? `
          <div class="card">
            <div class="card-title">Dependencies</div>
            <div class="flex-wrap" style="margin-top:8px">
              ${t.dependencies.map((d) => `<a class="dep-pill" href="#/foreman/tasks/${d}${state.query.client ? '?client=' + state.query.client : ''}">${esc(d)}</a>`).join('')}
            </div>
          </div>
        ` : ''}

        ${t.attachments.length ? `
          <div class="card">
            <div class="card-title">Attachments</div>
            ${t.attachments.map((a) => `
              <div class="doc-row">
                <span class="doc-icon doc-icon--word">DOC</span>
                <div>${esc(a)}</div>
                <span class="doc-meta">via meeting capture</span>
                <button class="btn btn--ghost btn--sm">Open</button>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="card">
          <div class="card-title">Comments</div>
          <div style="margin-top:16px">
            ${t.comments.length === 0 ? '<p class="muted tiny">No comments yet.</p>' : t.comments.map((c) => `
              <div class="comment">
                ${avatarFor(c.author)}
                <div>
                  <div class="comment-head"><span class="comment-author">${esc(c.author)}</span><span class="comment-date">${shortDate(c.date)}</span></div>
                  <div class="comment-body">${esc(c.body)}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <textarea placeholder="Add a comment — use @ to mention" rows="3"></textarea>
          <div style="margin-top:8px;display:flex;justify-content:flex-end;gap:8px">
            <button class="btn btn--ghost btn--sm">Cancel</button>
            <button class="btn btn--primary btn--sm">Comment</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Activity</div>
          <div class="audit" style="margin-top:12px">
            ${t.activity.map((a) => `
              <div class="audit-row">
                <div class="audit-date">${shortDate(a.date)}</div>
                <div>${esc(a.event)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <aside class="rail">
        <div class="card">
          <div class="card-title">Details</div>
          <dl class="draft-meta" style="margin-top:12px;margin-bottom:0">
            <dt>Owner</dt><dd>${esc(t.owner)}</dd>
            <dt>Due</dt><dd>${shortDate(t.due)}</dd>
            <dt>Status</dt><dd>${statusBadge(t.status)}</dd>
            <dt>Priority</dt><dd>${priorityBadge(t.priority)}</dd>
            <dt>Engagement</dt><dd>${esc(t.engagement)}</dd>
            ${client ? `<dt>Client</dt><dd>${clientLink(client.id, { follow: true })}</dd>` : ''}
          </dl>
        </div>

        <div class="card">
          <div class="card-title">Watchers</div>
          <div class="avatar-row" style="margin-top:10px">
            ${avatarFor(t.owner)}
            ${avatarFor('Tom Sr.')}
            ${avatarFor('Jessica')}
          </div>
          <button class="btn btn--ghost btn--sm mt-md">${svg('plus')} Add watcher</button>
        </div>
      </aside>
    </div>
  `;
}

/* ── Foreman · Meetings list + detail ────────────────────── */

function renderForemanMeetings() {
  const tab = state.query.tab || 'past';
  const today = new Date('2026-05-12');
  const past = MEETINGS.filter((m) => new Date(m.date) < today).sort((a, b) => (a.date < b.date ? 1 : -1));
  const upcoming = MEETINGS.filter((m) => new Date(m.date) >= today).sort((a, b) => (a.date < b.date ? -1 : 1));
  const list = tab === 'past' ? past : upcoming;

  return `
    <div class="page-head">
      <span class="page-kicker">Foreman · Project Manager</span>
      <div class="page-head-row">
        <h1>Meetings</h1>
        <div class="page-actions">
          <button class="btn btn--secondary btn--sm">Connect calendar</button>
          <button class="btn btn--primary btn--sm">${svg('plus')} Schedule meeting</button>
        </div>
      </div>
      <p class="page-sub">Foreman sits in on every meeting, drafts the summary, and lands action items in the shared task layer.</p>
    </div>

    <div class="tabs">
      <a class="tab" data-active="${tab === 'past'}" href="#/foreman/meetings?tab=past${state.query.client ? '&client=' + state.query.client : ''}">Past <span class="tab-counter">${past.length}</span></a>
      <a class="tab" data-active="${tab === 'upcoming'}" href="#/foreman/meetings?tab=upcoming${state.query.client ? '&client=' + state.query.client : ''}">Upcoming <span class="tab-counter">${upcoming.length}</span></a>
    </div>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr><th>Meeting</th><th>Client</th><th>Type</th><th>Date</th><th>Attendees</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${list.map((m) => {
            const c = clientById(m.clientId);
            return `
              <tr data-action="open-meeting" data-meeting="${m.id}">
                <td><div style="font-weight:500">${esc(m.title)}</div><div class="tiny muted col-mono">${esc(m.id)}</div></td>
                <td>${c ? esc(c.name) : '—'}</td>
                <td><span class="badge badge--outline">${esc(m.type)}</span></td>
                <td><div>${shortDate(m.date)}</div><div class="tiny muted">${esc(m.time || '')}${m.durationMin ? ' · ' + m.durationMin + 'min' : ''}</div></td>
                <td><div class="avatar-stack">${m.attendees.slice(0, 4).map((a) => avatarFor(a, 'sm')).join('')}</div></td>
                <td>${meetingStatusBadge(m.status)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function meetingStatusBadge(s) {
  if (s === 'Letter Sent') return `<span class="badge badge--success">Letter Sent</span>`;
  if (s === 'Letter Drafted') return `<span class="badge badge--info">Letter Drafted</span>`;
  if (s === 'Recording') return `<span class="badge badge--warning">Recording</span>`;
  return `<span class="badge badge--outline">${esc(s)}</span>`;
}

function renderForemanMeetingDetail() {
  const id = state.route.split('/')[1];
  const m = meetingById(id);
  if (!m) return renderNotFound('Meeting');
  const c = m.clientId ? clientById(m.clientId) : null;

  return `
    <div class="page-head">
      <a href="#/foreman/meetings${state.query.client ? '?client=' + state.query.client : ''}" class="btn btn--ghost btn--sm" style="align-self:flex-start;margin-bottom:8px">${svg('back')} All meetings</a>
      <div class="page-head-row">
        <div>
          <span class="page-kicker">Meeting · ${esc(m.id)}</span>
          <h1>${esc(m.title)}</h1>
          <div class="row" style="gap:8px;margin-top:8px">
            <span class="badge badge--outline">${esc(m.type)}</span>
            ${meetingStatusBadge(m.status)}
            <span class="tiny muted">${shortDate(m.date)} · ${esc(m.time || '')}${m.durationMin ? ' · ' + m.durationMin + ' min' : ''}</span>
          </div>
        </div>
        <div class="page-actions">
          ${m.summaryLetter && !m.summaryLetter.sent ? '<button class="btn btn--primary btn--sm">Approve & send letter</button>' : ''}
          ${!m.summaryLetter ? '<button class="btn btn--secondary btn--sm">Generate summary</button>' : ''}
        </div>
      </div>
    </div>

    <div class="record-layout">
      <div class="stack--lg">
        ${m.summaryLetter ? `
          <div class="card">
            <div class="row-between">
              <div class="card-title">Post-meeting summary letter</div>
              <div class="tiny muted">${m.summaryLetter.sent ? 'Sent ' + shortDate(m.summaryLetter.sent) : 'Drafted ' + shortDate(m.summaryLetter.drafted)} · Approver: ${esc(m.summaryLetter.approver)}</div>
            </div>
            <p style="margin-top:16px;line-height:1.6">${esc(m.summaryLetter.preview)}</p>
            <div class="row mt-md" style="gap:8px">
              <button class="btn btn--secondary btn--sm">${svg('pen')} Edit draft</button>
              <button class="btn btn--ghost btn--sm">View full letter</button>
            </div>
          </div>
        ` : '<div class="card empty"><h3>Letter pending</h3><p class="muted">Foreman drafts the summary letter once the meeting is recorded.</p></div>'}

        ${m.transcriptExcerpt ? `
          <div class="card">
            <div class="card-title">Transcript excerpt</div>
            <pre style="margin-top:12px;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.6;color:var(--fg);white-space:pre-wrap;background:var(--surface-1);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border-subtle)">${esc(m.transcriptExcerpt)}</pre>
            <button class="btn btn--ghost btn--sm mt-md">View full transcript</button>
          </div>
        ` : ''}

        <div class="card">
          <div class="row-between">
            <div class="card-title">Action items · ${m.actionItems.length} extracted</div>
            <span class="badge badge--outline">Owner + due-date enforced</span>
          </div>
          ${m.actionItems.length === 0 ? '<p class="muted tiny" style="margin-top:12px">No action items extracted yet.</p>' : `
            <div class="table-wrap" style="margin-top:14px">
              <table class="table">
                <thead><tr><th>Task</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead>
                <tbody>
                  ${m.actionItems.map((ai) => {
                    const t = taskById(ai.taskId);
                    if (!t) return '';
                    return `
                      <tr data-action="open-task" data-task="${t.id}">
                        <td><div style="font-weight:500">${esc(t.title)}</div><div class="tiny muted col-mono">${esc(t.id)}</div></td>
                        <td>${esc(t.owner)}</td>
                        <td>${shortDate(t.due)}</td>
                        <td>${statusBadge(t.status)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>

      <aside class="rail">
        <div class="card">
          <div class="card-title">Attendees</div>
          <div class="stack" style="margin-top:10px">
            ${m.attendees.map((a) => `<div class="row" style="gap:10px">${avatarFor(a, 'sm')}<span>${esc(a)}</span></div>`).join('')}
          </div>
        </div>
        ${c ? `
          <div class="card">
            <div class="card-title">Client</div>
            <div class="row" style="gap:10px;margin-top:10px">
              ${avatarFor(c.name)}
              <div>
                <div style="font-weight:500">${esc(c.name)}</div>
                <div class="tiny muted">${esc(stageById(c.stage).label)} · ${esc(c.owner)}</div>
              </div>
            </div>
            <a class="btn btn--ghost btn--sm mt-md" href="#/hank/clients/${c.id}?client=${c.id}">Open in Hank ${svg('arrow')}</a>
          </div>
        ` : ''}
      </aside>
    </div>
  `;
}

/* ── Foreman · Prep protocol ─────────────────────────────── */

function renderForemanPrep() {
  return `
    <div class="page-head">
      <span class="page-kicker">Foreman · Project Manager</span>
      <h1>Prep protocol</h1>
      <p class="page-sub">Pre-Internal · IR1 · IR2 · Partner Review — per engagement. Foreman flags slippage before the next meeting.</p>
    </div>

    <div class="card mb-md" style="padding:14px 16px">
      <div class="row" style="gap:14px">
        <span class="health-pill health-pill--green">${healthDot('green')} 5 On Track</span>
        <span class="health-pill health-pill--amber">${healthDot('amber')} 2 At Risk</span>
        <span class="health-pill health-pill--red">${healthDot('red')} 1 Slipped</span>
      </div>
    </div>

    ${PREP_PROTOCOL.map((p) => {
      const c = clientById(p.clientId);
      return `
        <div class="cadence-strip">
          <div class="cadence-engagement">
            <a href="#/hank/clients/${p.clientId}?client=${p.clientId}" data-action="open-client" data-client="${p.clientId}" style="color:inherit;text-decoration:none">
              <strong>${esc(c.name)}</strong>
            </a>
            <span>${esc(p.engagement)}</span>
          </div>
          ${p.milestones.map((m) => `
            <div class="cadence-cell" data-status="${esc(m.status)}">
              <span class="cadence-cell-name">${esc(m.name)}</span>
              <span class="cadence-cell-date">${esc(m.date || '—')}</span>
              <span class="cadence-cell-status">${esc(m.status)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }).join('')}
  `;
}

/* ── Sam · Tickets ───────────────────────────────────────── */

function renderSamTickets() {
  const savedView = state.query.view || 'all-open';
  const followingClient = state.query.client;
  let view = SAVED_VIEWS.find((v) => v.id === savedView) || SAVED_VIEWS[0];
  let tickets = TICKETS.filter(view.filter);
  if (followingClient) tickets = tickets.filter((t) => t.clientId === followingClient);

  return `
    <div class="page-head">
      <span class="page-kicker">Sam · Help Desk · CS Manager</span>
      <div class="page-head-row">
        <h1>Ticket inbox</h1>
        <div class="page-actions">
          <button class="btn btn--secondary btn--sm">Filters</button>
          <button class="btn btn--secondary btn--sm">Save current view</button>
        </div>
      </div>
      <p class="page-sub">${tickets.length} ticket${tickets.length === 1 ? '' : 's'} in current view${followingClient ? ` · filtered by <a href="#" data-action="unfollow">${esc(clientById(followingClient)?.name || '')}</a>` : ''}.</p>
    </div>

    <div class="saved-views">
      ${SAVED_VIEWS.map((v) => `<a class="saved-view" href="#/sam/tickets?view=${v.id}${followingClient ? '&client=' + followingClient : ''}" data-active="${v.id === savedView}">${esc(v.label)}</a>`).join('')}
    </div>

    <div class="bulkbar" id="bulkbar">
      <span class="bulkbar-count" id="bulkbar-count">0 selected</span>
      <span class="bulkbar-spacer"></span>
      <button class="btn btn--secondary btn--sm">Reassign</button>
      <button class="btn btn--secondary btn--sm">Tag</button>
      <button class="btn btn--secondary btn--sm">Merge</button>
      <button class="btn btn--secondary btn--sm">Close</button>
    </div>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th style="width:40px"></th>
            <th>ID</th>
            <th>Subject</th>
            <th>Persona</th>
            <th>Status</th>
            <th>Assignee</th>
            <th>Priority</th>
            <th>Age</th>
            <th>SLA</th>
          </tr>
        </thead>
        <tbody>
          ${tickets.map((t) => `
            <tr data-action="open-ticket" data-ticket="${t.id}">
              <td><input type="checkbox" data-action="select-ticket" data-ticket="${t.id}" onclick="event.stopPropagation()"></td>
              <td class="col-mono">${esc(t.id)}</td>
              <td><div style="font-weight:500">${esc(t.subject)}</div><div class="tiny muted">${esc(t.user || '')}</div></td>
              <td>${personaBadge(t.persona)}</td>
              <td>${ticketStatusBadge(t.status)}</td>
              <td>${esc(t.assignee)}</td>
              <td>${priorityBadge(t.priority)}</td>
              <td class="muted">${esc(t.age)}</td>
              <td class="${t.slaTimer.includes('breach') ? '' : 'muted'} tiny">${esc(t.slaTimer)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function ticketStatusBadge(s) {
  if (s === 'AI resolved') return `<span class="badge badge--success">AI resolved</span>`;
  if (s === 'Escalated') return `<span class="badge badge--warning">Escalated</span>`;
  if (s === 'Human takeover') return `<span class="badge badge--error">Human takeover</span>`;
  if (s === 'Open') return `<span class="badge badge--info">Open</span>`;
  return `<span class="badge">${esc(s)}</span>`;
}

function renderSamTicketDetail() {
  const id = state.route.split('/')[1];
  const t = ticketById(id);
  if (!t) return renderNotFound('Ticket');
  const c = t.clientId ? clientById(t.clientId) : null;

  return `
    <div class="page-head">
      <a href="#/sam/tickets${state.query.client ? '?client=' + state.query.client : ''}" class="btn btn--ghost btn--sm" style="align-self:flex-start;margin-bottom:8px">${svg('back')} All tickets</a>
      <div class="page-head-row">
        <div>
          <span class="page-kicker">Ticket · ${esc(t.id)}</span>
          <h1>${esc(t.subject)}</h1>
          <div class="row" style="gap:8px;margin-top:8px">
            ${ticketStatusBadge(t.status)}
            ${priorityBadge(t.priority)}
            ${personaBadge(t.persona)}
          </div>
        </div>
        <div class="page-actions">
          <button class="btn btn--secondary btn--sm">Reassign</button>
          <button class="btn btn--primary btn--sm">Take over chat</button>
        </div>
      </div>
    </div>

    <div class="meta-strip">
      <div><div class="meta-cell-label">Status</div><div class="meta-cell-value">${esc(t.status)}</div></div>
      <div><div class="meta-cell-label">Assignee</div><div class="meta-cell-value">${esc(t.assignee)}</div></div>
      <div><div class="meta-cell-label">Sentiment</div><div class="meta-cell-value">${esc(t.sentiment[0].toUpperCase() + t.sentiment.slice(1))}</div></div>
      <div><div class="meta-cell-label">SLA</div><div class="meta-cell-value">${esc(t.slaTimer)}</div></div>
      <div><div class="meta-cell-label">Age</div><div class="meta-cell-value">${esc(t.age)}</div></div>
    </div>

    <div class="ticket-page">
      <div class="card">
        <div class="card-title">Conversation</div>
        <div class="thread" style="margin-top:16px">
          ${t.conversation.map((c) => `
            <div class="message" data-author="${esc(c.author)}">
              <div class="message-head">
                <span class="message-author">${esc(c.author === 'user' ? t.user : c.author === 'sam' ? 'Sam (AI)' : (c.who || 'Heritage'))}</span>
                <span>${esc(c.when || '')}</span>
              </div>
              <div class="message-body">${esc(c.body)}</div>
              ${c.citations ? `<div class="message-citations">${c.citations.map((cit) => `<button class="cmd-citation" type="button">${esc(cit)}</button>`).join('')}</div>` : ''}
            </div>
          `).join('')}
        </div>
        <div class="divider"></div>
        <textarea placeholder="Type a reply to take over from Sam…" rows="3"></textarea>
        <div style="margin-top:8px;display:flex;justify-content:flex-end;gap:8px">
          <button class="btn btn--secondary btn--sm">Save as note</button>
          <button class="btn btn--primary btn--sm">Send reply</button>
        </div>
      </div>

      <aside class="rail">
        <div class="card">
          <div class="card-title">User</div>
          <div class="row" style="gap:10px;margin-top:10px">
            ${avatarFor(t.user || 'User')}
            <div>
              <div style="font-weight:500">${esc(t.user || '—')}</div>
              <div class="tiny muted">${esc(PERSONAS[t.persona]?.label || '')}</div>
            </div>
          </div>
        </div>
        ${c ? `
          <div class="card">
            <div class="card-title">Client context</div>
            <div class="row" style="gap:10px;margin-top:10px">
              ${avatarFor(c.name, 'sm')}
              <div>
                <div style="font-weight:500">${esc(c.name)}</div>
                <div class="tiny muted">${esc(stageById(c.stage).label)} · ${esc(c.owner)}</div>
              </div>
            </div>
            <div class="divider"></div>
            <div class="tiny muted">Book status</div>
            <div class="mb-sm">In production · v3 latest</div>
            <div class="tiny muted">Documents on file</div>
            <div>${c.documents.length} ${c.documents.length === 1 ? 'document' : 'documents'}</div>
            <a class="btn btn--ghost btn--sm mt-md" href="#/hank/clients/${c.id}?client=${c.id}">Open in Hank ${svg('arrow')}</a>
          </div>
        ` : ''}
        <div class="card">
          <div class="card-title">Escalation</div>
          <div class="stack" style="margin-top:10px">
            <div class="row-between"><span class="muted tiny">Triggers seen</span><strong>${t.status === 'Escalated' || t.status === 'Human takeover' ? '1' : '0'}</strong></div>
            <div class="row-between"><span class="muted tiny">Citations on AI msgs</span><strong>${t.conversation.filter((c) => c.author === 'sam' && c.citations).length}</strong></div>
            <div class="row-between"><span class="muted tiny">Human in loop</span><strong>${t.conversation.some((c) => c.author === 'human') ? 'Yes' : 'No'}</strong></div>
          </div>
        </div>
      </aside>
    </div>
  `;
}

/* ── Sam · Knowledge base ────────────────────────────────── */

function renderSamKB() {
  return `
    <div class="page-head">
      <span class="page-kicker">Sam · Help Desk</span>
      <div class="page-head-row">
        <h1>Knowledge base</h1>
        <div class="page-actions">
          <button class="btn btn--secondary btn--sm">Editorial owners</button>
          <button class="btn btn--primary btn--sm">${svg('plus')} New article</button>
        </div>
      </div>
      <p class="page-sub">Module-level help docs, glossary, process docs. Single editorial owner per topic; conflicts flagged automatically.</p>
    </div>

    <div class="card mb-md" style="padding:14px 18px">
      <div class="row" style="gap:18px">
        <div><span class="muted tiny">Articles</span> <strong>${KB_ARTICLES.length}</strong></div>
        <div><span class="muted tiny">Conflicts</span> <strong>${KB_ARTICLES.filter((a) => a.hasConflict).length}</strong></div>
        <div><span class="muted tiny">Beyond freshness SLA</span> <strong>0</strong></div>
      </div>
    </div>

    ${KB_ARTICLES.map((a) => `
      <div class="kb-row">
        <div>
          <div class="kb-row-title">${esc(a.title)}</div>
          <div class="kb-row-meta">${esc(a.topic)} · v${esc(a.version)}</div>
          ${a.hasConflict ? `<div class="tiny" style="color:var(--warning-fg);margin-top:4px">⚠ ${esc(a.conflictNote)}</div>` : ''}
        </div>
        <div class="kb-row-meta">${esc(a.editorialOwner)}</div>
        <div class="kb-row-meta">${shortDate(a.lastReviewed)}</div>
        <div><span class="badge badge--outline">SLA ${esc(a.freshnessSLA)}</span></div>
        <div>${a.hasConflict ? '<span class="badge badge--warning">Conflict</span>' : '<span class="badge badge--success">Fresh</span>'}</div>
      </div>
    `).join('')}
  `;
}

/* ── Sam · Performance ───────────────────────────────────── */

function renderSamReport() {
  const p = PERFORMANCE;
  const totalEsc = p.escalationsByReason.reduce((a, b) => a + b.count, 0);
  const totalVol = p.volumeByPersona.reduce((a, b) => a + b.count, 0);
  return `
    <div class="page-head">
      <span class="page-kicker">Sam · Help Desk</span>
      <div class="page-head-row">
        <h1>Performance · ${esc(p.monthLabel)}</h1>
        <button class="btn btn--secondary btn--sm">Download report</button>
      </div>
      <p class="page-sub">Containment, escalations by reason, CSAT, and volume by persona. Refreshed monthly.</p>
    </div>

    <div class="card-grid card-grid--3 mb-lg">
      <div class="card">
        <div class="card-title">Containment rate</div>
        <div class="stat" style="margin-top:8px">
          <div class="stat-value">${Math.round(p.containmentRate * 100)}%</div>
          <div class="stat-trend" data-direction="up">${esc(p.containmentRateTrend)}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">CSAT</div>
        <div class="stat" style="margin-top:8px">
          <div class="stat-value">${p.csat}<span style="font-size:18px;color:var(--fg-muted)"> / 5</span></div>
          <div class="stat-trend">${esc(p.csatTrend)}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Volume this month</div>
        <div class="stat" style="margin-top:8px">
          <div class="stat-value">${totalVol}</div>
          <div class="stat-trend">conversations handled</div>
        </div>
      </div>
    </div>

    <div class="card-grid card-grid--2">
      <div class="card">
        <div class="card-title">Escalations by reason</div>
        <div class="bar-list" style="margin-top:14px">
          ${p.escalationsByReason.map((r) => `
            <div class="bar-row">
              <span>${esc(r.reason)}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${(r.count / totalEsc) * 100}%;background:var(--${r.color})"></div></div>
              <span class="bar-value">${r.count}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Volume by persona</div>
        <div class="bar-list" style="margin-top:14px">
          ${p.volumeByPersona.map((r) => `
            <div class="bar-row">
              <span>${esc(r.persona)}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${(r.count / totalVol) * 100}%;background:var(--${r.color})"></div></div>
              <span class="bar-value">${r.count}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/* ── Not found ───────────────────────────────────────────── */

function renderNotFound(kind) {
  return `<div class="empty"><h3>${esc(kind)} not found</h3><p class="muted">The record may have been removed. Try navigating back.</p></div>`;
}

/* ── Route table ─────────────────────────────────────────── */

function dispatchRoute() {
  const segs = state.route.split('/');
  const key = state.app + ':' + segs[0];
  const hasId = segs.length > 1;
  if (state.app === 'hank') {
    if (segs[0] === 'clients' && !hasId) return renderHankPipeline();
    if (segs[0] === 'clients' && hasId) return renderHankClient();
    if (segs[0] === 'digest') return renderHankDigest();
    if (segs[0] === 'stages') return renderHankStages();
  }
  if (state.app === 'foreman') {
    if (segs[0] === 'rundown') return renderForemanRundown();
    if (segs[0] === 'tasks' && !hasId) return renderForemanTasks();
    if (segs[0] === 'tasks' && hasId) return renderForemanTaskDetail();
    if (segs[0] === 'meetings' && !hasId) return renderForemanMeetings();
    if (segs[0] === 'meetings' && hasId) return renderForemanMeetingDetail();
    if (segs[0] === 'prep') return renderForemanPrep();
  }
  if (state.app === 'sam') {
    if (segs[0] === 'tickets' && !hasId) return renderSamTickets();
    if (segs[0] === 'tickets' && hasId) return renderSamTicketDetail();
    if (segs[0] === 'kb') return renderSamKB();
    if (segs[0] === 'report') return renderSamReport();
  }
  return renderNotFound('Page');
}

/* ── Render ──────────────────────────────────────────────── */

function render() {
  parseHash();
  renderShell();
  const main = document.getElementById('main');
  main.innerHTML = dispatchRoute();
  // Track ticket selection bulk bar
  bindSelections();
  // Refresh chat shell so FAB/panel reflect current app + context-aware suggestions
  renderChatShell();
  window.scrollTo(0, 0);
}

function bindSelections() {
  const bulkbar = document.getElementById('bulkbar');
  const count = document.getElementById('bulkbar-count');
  if (!bulkbar) return;
  const checkboxes = document.querySelectorAll('input[data-action="select-ticket"], input[data-action="select-task"]');
  function update() {
    const n = Array.from(checkboxes).filter((c) => c.checked).length;
    bulkbar.dataset.active = n > 0 ? 'true' : 'false';
    if (count) count.textContent = `${n} selected`;
  }
  checkboxes.forEach((c) => c.addEventListener('change', update));
}

/* ── Command palette ─────────────────────────────────────── */

const CMD_PROMPTS = [
  {
    id: 'koenigsberg-status',
    prompt: 'Where are we on Koenigsberg?',
    answer: `Koenigsberg is on track. IR2 letter sent May 10. Partner Review locked for May 22. The Berlin holding company filing is the priority item — Daniel Roth sent revised v2 of the counsel letter on May 9; Jessica is merging it into the Heritage version. Margit requested to be CC'd on accountant correspondence going forward (handled in T-2043).`,
    citations: [
      { label: 'Meeting · IR2 May 10', href: '#/foreman/meetings/mtg-koenigsberg-ir2?client=koenigsberg' },
      { label: 'Task T-2042 · Berlin holding letter', href: '#/foreman/tasks/T-2042?client=koenigsberg' },
      { label: 'Client record · Koenigsberg', href: '#/hank/clients/koenigsberg?client=koenigsberg' },
    ],
  },
  {
    id: 'slipped-week',
    prompt: 'What slipped this week?',
    answer: `Three items slipped:
• Brooks-Halley Q1 letter (T-2045) — held since pace concerns surfaced. Recovery call May 14.
• Brooks-Halley cousin trust draft (T-2046) — Pim & Whittaker v3 overdue since April 15.
• Whitcombe IR1 — never locked. Lawrence Day silent on consent forms.`,
    citations: [
      { label: 'Task T-2045 · Q1 letter', href: '#/foreman/tasks/T-2045' },
      { label: 'Task T-2046 · Pim revisions', href: '#/foreman/tasks/T-2046' },
      { label: 'Task T-2047 · Lock Whitcombe IR1', href: '#/foreman/tasks/T-2047' },
    ],
  },
  {
    id: 'ir2-cadence',
    prompt: 'Prep status for IR2 across active clients',
    answer: `Snapshot:
• Koenigsberg — IR2 Done (May 10, letter sent).
• Saint Croix — IR2 Done.
• Aldermount — IR2 On Track (June 10).
• Helmsley — Upcoming (after IR1 May 24).
• Brooks-Halley — IR2 At Risk (no letter from May 8 attempt).
• Devonshire — At Risk (waiting on Westshore advisor return May 20).
• Whitcombe — Upcoming (blocked on IR1).`,
    citations: [
      { label: 'Prep protocol overview', href: '#/foreman/prep' },
    ],
  },
  {
    id: 'old-partner-firm',
    prompt: 'Open partner-firm tickets aged > 24h',
    answer: `Two tickets:
• H-3042 — Westshore producer "asset sheet upload failed" — Escalated, 5h, 1h 12m to SLA breach. Assigned Henry.
• H-3051 — Northcrest "PDF formatting issue" — Escalated, 3h, 2h 14m to SLA breach. Assigned Henry.
Both routed to platform engineering rotation.`,
    citations: [
      { label: 'Ticket H-3042', href: '#/sam/tickets/H-3042' },
      { label: 'Ticket H-3051', href: '#/sam/tickets/H-3051' },
    ],
  },
  {
    id: 'whitcombe-follow-up',
    prompt: 'Draft a follow-up to Whitcombe principal',
    answer: `Hank drafted a follow-up in Heritage voice. The draft prioritises locking the IR1 date this week, sets a clear next step, and asks Edward to confirm two candidate dates. No commitments are made on Heritage's behalf; the draft requests Jessica's approval before send.

Opening the draft now.`,
    citations: [
      { label: 'Client record · Whitcombe', href: '#/hank/clients/whitcombe?client=whitcombe' },
    ],
    onOpen: () => {
      navigate({ app: 'hank', route: 'clients/whitcombe', query: { client: 'whitcombe', tab: 'overview' } });
      setTimeout(() => openDraftModal('whitcombe'), 80);
    },
  },
];

function openCmd() {
  const root = document.getElementById('cmd-root');
  const cmd = document.getElementById('cmd');
  const list = document.getElementById('cmd-list');
  const input = document.getElementById('cmd-input');
  root.dataset.open = 'true';
  cmd.dataset.mode = 'list';
  input.value = '';
  list.innerHTML = `
    <div class="cmd-section">Suggested prompts</div>
    ${CMD_PROMPTS.map((p, i) => `
      <button class="cmd-item" data-action="cmd-prompt" data-prompt="${p.id}" data-active="${i === 0}">
        <span class="cmd-item-prompt">${esc(p.prompt)}</span>
        <span class="cmd-item-meta">${svg('arrow')}</span>
      </button>
    `).join('')}
  `;
  setTimeout(() => input.focus(), 30);
}

function closeCmd() {
  document.getElementById('cmd-root').dataset.open = 'false';
}

function showCmdAnswer(promptId) {
  const p = CMD_PROMPTS.find((x) => x.id === promptId);
  if (!p) return;
  const cmd = document.getElementById('cmd');
  const ans = document.getElementById('cmd-answer');
  cmd.dataset.mode = 'answer';
  ans.innerHTML = `
    <button class="cmd-back" data-action="cmd-back">${svg('back')} Back</button>
    <h3 style="font-family:'Lora',Georgia,serif;font-size:18px;font-weight:600">${esc(p.prompt)}</h3>
    <p style="margin-top:10px;line-height:1.6;white-space:pre-wrap">${esc(p.answer)}</p>
    <h4>Sources</h4>
    <div class="flex-wrap">
      ${p.citations.map((c) => `<a class="cmd-citation" href="${esc(c.href)}" data-action="cmd-citation">${esc(c.label)}</a>`).join('')}
    </div>
    ${p.onOpen ? `<div style="margin-top:16px"><button class="btn btn--primary btn--sm" data-action="cmd-action" data-prompt="${p.id}">Open the draft</button></div>` : ''}
  `;
}

/* ── Outbound draft modal ────────────────────────────────── */

function openDraftModal(clientId) {
  const c = clientById(clientId);
  if (!c) return;
  const root = document.getElementById('dialog-root');
  const dialog = document.getElementById('dialog');
  root.dataset.open = 'true';
  root.setAttribute('aria-hidden', 'false');
  dialog.innerHTML = `
    <button class="dialog-close" data-dialog-close aria-label="Close">×</button>
    <div class="page-kicker">Outbound draft · Hank</div>
    <div class="dialog-title">To: ${esc(c.stakeholders[0]?.name || c.name)}</div>
    <div class="dialog-sub">Drafted in Heritage voice. Heritage employees approve before sending.</div>

    <dl class="draft-meta">
      <dt>From</dt><dd>${esc(c.owner)} · Heritage Strategies</dd>
      <dt>To</dt><dd>${esc(c.stakeholders[0]?.name || c.name)} ${c.stakeholders[0]?.email ? `&lt;${esc(c.stakeholders[0].email)}&gt;` : ''}</dd>
      <dt>Subject</dt><dd>${esc(draftSubject(c))}</dd>
    </dl>

    <div class="draft-body">${esc(draftBody(c))}</div>

    <div class="section-title" style="margin-top:14px">Citations</div>
    <div class="draft-citations">
      <button class="cmd-citation" type="button">Client record · ${esc(c.name)}</button>
      ${c.activity.slice(0, 2).map((a) => `<button class="cmd-citation" type="button">${esc(a.type[0].toUpperCase() + a.type.slice(1))} · ${shortDate(a.date)}</button>`).join('')}
      <button class="cmd-citation" type="button">Heritage voice guide · v3</button>
    </div>

    <div class="dialog-foot">
      <button class="btn btn--ghost btn--sm" data-dialog-close>Discard</button>
      <button class="btn btn--secondary btn--sm" data-dialog-close>${svg('pen')} Edit</button>
      <button class="btn btn--primary btn--sm" data-action="send-for-approval">Send for approval</button>
    </div>
  `;
}

function draftSubject(c) {
  if (c.id === 'whitcombe') return 'Locking the next step';
  if (c.id === 'koenigsberg') return 'Partner Review · May 22';
  if (c.id === 'carrington') return 'Introducing Heritage Strategies';
  return `Following up · ${c.name}`;
}

function draftBody(c) {
  if (c.id === 'whitcombe') return `Edward,

Following our Pre-Internal three weeks ago, we are ready to move to IR1. To keep the engagement on the cadence we discussed, I am asking for one of the two dates below.

  · Wednesday, May 19, 3:30pm ET
  · Friday, May 21, 11:00am ET

If neither works, please send back the next two dates that do.

I am also sending Lawrence Day a separate note about the outstanding consents — we cannot lock the date without them. If there is a faster path on his side, I would like to hear it.

Best,
Jessica
Heritage Strategies`;
  if (c.id === 'koenigsberg') return `Klaus,

Confirming the Partner Review on May 22 at 10:00am ET. Daniel Roth is dialing in. Henry from Northcrest will join for the second half.

The Berlin holding company filing remains the single priority. Daniel sent v2 of the counsel letter — Heritage is merging it into our version and will share the final this week.

Margit is now CC'd on all accountant correspondence going forward.

Best,
Tom`;
  if (c.id === 'carrington') return `Diane,

Thank you for the introduction request. We help families and partner advisors run multi-generational planning at the level your note suggests.

I would like to set up a 30-minute introductory call this or next week. Please send two dates that work.

Best,
Jessica
Heritage Strategies`;
  return `Hello,

Following up on the most recent thread. Please confirm next step and a date.

Best,
Heritage Strategies`;
}

function closeDialog() {
  const root = document.getElementById('dialog-root');
  root.dataset.open = 'false';
  root.setAttribute('aria-hidden', 'true');
}

/* ── Chat widget ─────────────────────────────────────────── */

function renderChatShell() {
  const bot = BOTS[state.app];
  const fabIcon = document.getElementById('chat-fab-icon');
  fabIcon.textContent = bot.initial;
  fabIcon.className = 'chat-fab-icon ' + bot.accentClass;
  const headIcon = document.getElementById('chat-head-icon');
  headIcon.textContent = bot.initial;
  headIcon.className = 'app-icon ' + bot.accentClass;
  document.getElementById('chat-head-name').textContent = bot.name;
  document.getElementById('chat-head-sub').textContent = bot.sub;
  document.getElementById('chat-input').placeholder = `Ask ${bot.name}…`;
  document.getElementById('chat-panel').dataset.app = state.app;
  // Refresh body + quick replies for the new app
  renderChatBody();
  renderQuickReplies();
}

function chatContext() {
  return { followingClient: state.query.client || null };
}

function chatBubbleHtml(text) {
  // very light markdown for **bold**
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function renderChatBody() {
  const body = document.getElementById('chat-body');
  if (!body) return;
  const bot = BOTS[state.app];
  const history = getHistory(state.app);
  const messages = history.length === 0
    ? [{ role: 'bot', text: bot.welcome }]
    : history;
  body.innerHTML = messages.map((m) => renderMessage(m)).join('');
  body.scrollTop = body.scrollHeight;
}

function renderMessage(m) {
  if (m.role === 'user') {
    return `
      <div class="chat-msg chat-msg--user">
        <div class="chat-bubble">${chatBubbleHtml(m.text)}</div>
      </div>
    `;
  }
  if (m.role === 'typing') {
    return `
      <div class="chat-msg chat-msg--bot">
        <div class="chat-bubble chat-typing" aria-label="Assistant is typing">
          <span class="chat-typing-dot"></span><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span>
        </div>
      </div>
    `;
  }
  const citations = (m.citations || []).map((c) => {
    if (c.action) {
      return `<button class="chat-citation" type="button" data-action="chat-cite-action" data-cite-type="${esc(c.action.type)}" data-cite-id="${esc(c.action.clientId || c.action.id || '')}">${esc(c.label)}</button>`;
    }
    return `<a class="chat-citation" href="${esc(c.href)}" data-action="chat-cite">${esc(c.label)}</a>`;
  }).join('');
  return `
    <div class="chat-msg chat-msg--bot">
      <div class="chat-bubble">${chatBubbleHtml(m.text)}</div>
      ${citations ? `<div class="chat-citations">${citations}</div>` : ''}
    </div>
  `;
}

function renderQuickReplies() {
  const q = document.getElementById('chat-quick');
  if (!q) return;
  const replies = suggestedReplies(state.app, chatContext());
  q.innerHTML = replies.map((r) => `<button class="chat-quick-chip" type="button" data-action="chat-quick" data-text="${esc(r)}">${esc(r)}</button>`).join('');
}

function openChat() {
  document.getElementById('chat-panel').hidden = false;
  document.getElementById('chat-fab').dataset.active = 'true';
  setTimeout(() => document.getElementById('chat-input').focus(), 60);
  renderChatBody();
  renderQuickReplies();
}

function closeChat() {
  document.getElementById('chat-panel').hidden = true;
  document.getElementById('chat-fab').dataset.active = 'false';
}

function isChatOpen() {
  const p = document.getElementById('chat-panel');
  return p && !p.hidden;
}

function appendAndRender(msg) {
  appendMessage(state.app, msg);
  renderChatBody();
}

function handleChatSubmit(text) {
  const t = (text || '').trim();
  if (!t) return;
  // Seed welcome into history if first interaction
  const history = getHistory(state.app);
  if (history.length === 0) {
    appendMessage(state.app, { role: 'bot', text: BOTS[state.app].welcome });
  }
  appendAndRender({ role: 'user', text: t });

  // Show typing indicator
  const body = document.getElementById('chat-body');
  const typing = document.createElement('div');
  typing.className = 'chat-msg chat-msg--bot';
  typing.innerHTML = `<div class="chat-bubble chat-typing" aria-label="Assistant is typing"><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span></div>`;
  body.appendChild(typing);
  body.scrollTop = body.scrollHeight;

  const delay = 420 + Math.min(900, t.length * 14);
  setTimeout(() => {
    typing.remove();
    const result = matchIntent(state.app, t, chatContext());
    appendAndRender({ role: 'bot', text: result.reply, citations: result.citations || [] });
    // Update quick replies if intent suggests new ones
    if (result.quickReplies) {
      const q = document.getElementById('chat-quick');
      q.innerHTML = result.quickReplies.map((r) => `<button class="chat-quick-chip" type="button" data-action="chat-quick" data-text="${esc(r)}">${esc(r)}</button>`).join('');
    } else {
      renderQuickReplies();
    }
  }, delay);
}

function resetChat() {
  resetHistory(state.app);
  renderChatBody();
  renderQuickReplies();
}

/* ── Call (ElevenLabs Conversational AI) ─────────────────── */

function openCallOverlay() {
  const overlay = document.getElementById('call-overlay');
  overlay.hidden = false;
  document.body.dataset.callOpen = 'true';
  setCallStatus('Tap start to dial');
  document.getElementById('call-start').hidden = false;
  document.getElementById('call-end').hidden = true;
  setOrbState('idle');
}

function closeCallOverlay() {
  endCall();
  const overlay = document.getElementById('call-overlay');
  overlay.hidden = true;
  delete document.body.dataset.callOpen;
}

function setCallStatus(text) {
  const el = document.getElementById('call-status');
  if (el) el.textContent = text;
}

function setOrbState(state) {
  const orb = document.getElementById('call-orb');
  if (orb) orb.dataset.state = state;
}

async function startCall() {
  const startBtn = document.getElementById('call-start');
  const endBtn = document.getElementById('call-end');
  startBtn.disabled = true;
  setCallStatus('Connecting…');
  setOrbState('connecting');
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    const { Conversation } = await loadElevenLabsClient();
    activeCallConversation = await Conversation.startSession({
      agentId: FOREMAN_AGENT_ID,
      connectionType: 'webrtc',
      onConnect: () => {
        setCallStatus('Connected — speak to Foreman');
        setOrbState('listening');
        startBtn.hidden = true;
        endBtn.hidden = false;
        startBtn.disabled = false;
      },
      onDisconnect: () => {
        setCallStatus('Call ended');
        setOrbState('idle');
        startBtn.hidden = false;
        endBtn.hidden = true;
        startBtn.disabled = false;
        activeCallConversation = null;
      },
      onError: (err) => {
        console.error('Foreman call error', err);
        setCallStatus('Connection failed — try again');
        setOrbState('idle');
        startBtn.hidden = false;
        endBtn.hidden = true;
        startBtn.disabled = false;
      },
      onModeChange: (mode) => {
        const m = mode && mode.mode ? mode.mode : mode;
        if (m === 'speaking') { setCallStatus('Foreman is speaking'); setOrbState('speaking'); }
        else if (m === 'listening') { setCallStatus('Listening…'); setOrbState('listening'); }
      },
    });
  } catch (err) {
    console.error('Foreman call init error', err);
    setCallStatus(err && err.name === 'NotAllowedError' ? 'Microphone access denied' : 'Could not start call');
    setOrbState('idle');
    startBtn.disabled = false;
  }
}

async function endCall() {
  if (activeCallConversation) {
    try { await activeCallConversation.endSession(); } catch (e) { /* noop */ }
    activeCallConversation = null;
  }
}

/* ── Toast ───────────────────────────────────────────────── */

function toast(msg, kind) {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = `toast ${kind === 'success' ? 'toast--success' : ''}`;
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 200); }, 2600);
}

/* ── Event delegation ────────────────────────────────────── */

function bindEvents() {
  // App switcher open/close
  const sw = document.getElementById('app-switcher');
  document.getElementById('app-switcher-trigger').addEventListener('click', (e) => {
    e.stopPropagation();
    sw.dataset.open = sw.dataset.open === 'true' ? 'false' : 'true';
    document.getElementById('app-switcher-trigger').setAttribute('aria-expanded', sw.dataset.open);
  });

  document.addEventListener('click', (e) => {
    // close app-switcher on outside click
    if (!e.target.closest('#app-switcher')) sw.dataset.open = 'false';

    const a = e.target.closest('[data-action]');
    if (!a) return;
    const action = a.dataset.action;

    if (action === 'switch-app') {
      e.preventDefault();
      const newApp = a.dataset.app;
      const next = buildHash({ app: newApp, route: APPS[newApp].default });
      window.location.hash = next;
      sw.dataset.open = 'false';
      return;
    }
    if (action === 'unfollow') {
      e.preventDefault();
      unfollow();
      return;
    }
    if (action === 'open-client') {
      e.preventDefault();
      const cid = a.dataset.client;
      navigate({ app: 'hank', route: 'clients/' + cid, query: { client: cid, tab: 'overview' } });
      return;
    }
    if (action === 'open-task') {
      e.preventDefault();
      const tid = a.dataset.task;
      navigate({ app: 'foreman', route: 'tasks/' + tid });
      return;
    }
    if (action === 'open-meeting') {
      e.preventDefault();
      const mid = a.dataset.meeting;
      navigate({ app: 'foreman', route: 'meetings/' + mid });
      return;
    }
    if (action === 'open-ticket') {
      e.preventDefault();
      const tid = a.dataset.ticket;
      navigate({ app: 'sam', route: 'tickets/' + tid });
      return;
    }
    if (action === 'filter') {
      e.preventDefault();
      const f = a.dataset.filter;
      const v = a.dataset.value;
      navigate({ query: { [f]: v === 'all' ? '' : v } });
      return;
    }
    if (action === 'set-view') {
      e.preventDefault();
      navigate({ query: { view: a.dataset.view } });
      return;
    }
    if (action === 'open-draft-modal') {
      e.preventDefault();
      const cid = a.dataset.draft;
      const target = cid === 'bulk' ? 'whitcombe' : cid;
      openDraftModal(target);
      return;
    }
    if (action === 'send-for-approval') {
      e.preventDefault();
      closeDialog();
      toast('Sent for approval. Tom Sr. will see it in his queue.', 'success');
      return;
    }
    if (action === 'cmd-prompt') {
      e.preventDefault();
      showCmdAnswer(a.dataset.prompt);
      return;
    }
    if (action === 'cmd-back') {
      e.preventDefault();
      document.getElementById('cmd').dataset.mode = 'list';
      return;
    }
    if (action === 'cmd-citation') {
      // let default <a> behaviour happen; just close the palette
      closeCmd();
      return;
    }
    if (action === 'cmd-action') {
      e.preventDefault();
      const p = CMD_PROMPTS.find((x) => x.id === a.dataset.prompt);
      if (p && p.onOpen) {
        closeCmd();
        p.onOpen();
      }
      return;
    }
    if (action === 'chat-quick') {
      e.preventDefault();
      const text = a.dataset.text;
      const input = document.getElementById('chat-input');
      input.value = '';
      handleChatSubmit(text);
      return;
    }
    if (action === 'chat-cite') {
      // default <a> behaviour will navigate; we just close the chat optionally if it's a route change away
      return;
    }
    if (action === 'chat-cite-action') {
      e.preventDefault();
      const type = a.dataset.citeType;
      const id = a.dataset.citeId;
      if (type === 'open-draft' && id) {
        closeChat();
        navigate({ app: 'hank', route: 'clients/' + id, query: { client: id, tab: 'overview' } });
        setTimeout(() => openDraftModal(id), 100);
      }
      return;
    }
  });

  // Dialog close
  document.getElementById('dialog-root').addEventListener('click', (e) => {
    if (e.target.matches('[data-dialog-close]')) closeDialog();
  });

  // Command palette open + close
  document.getElementById('cmd-trigger').addEventListener('click', openCmd);
  document.getElementById('cmd-root').addEventListener('click', (e) => {
    if (e.target.matches('[data-cmd-close]')) closeCmd();
  });

  // Chat widget
  document.getElementById('chat-fab').addEventListener('click', openChat);
  document.getElementById('chat-close').addEventListener('click', closeChat);
  document.getElementById('chat-reset').addEventListener('click', resetChat);
  document.getElementById('chat-call').addEventListener('click', openCallOverlay);
  document.getElementById('call-start').addEventListener('click', startCall);
  document.getElementById('call-end').addEventListener('click', () => endCall().then(closeCallOverlay));
  document.getElementById('call-overlay').addEventListener('click', (e) => {
    if (e.target.matches('[data-call-close]')) closeCallOverlay();
  });
  document.getElementById('chat-input-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const v = input.value;
    input.value = '';
    handleChatSubmit(v);
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCmd();
      return;
    }
    if (e.key === 'Escape') {
      const cmdOpen = document.getElementById('cmd-root').dataset.open === 'true';
      const dlgOpen = document.getElementById('dialog-root').dataset.open === 'true';
      const callOpen = document.body.dataset.callOpen === 'true';
      if (callOpen) closeCallOverlay();
      else if (cmdOpen) closeCmd();
      else if (dlgOpen) closeDialog();
      else if (isChatOpen()) closeChat();
    }
  });

  // Hash change
  window.addEventListener('hashchange', render);
}

/* ── Boot ────────────────────────────────────────────────── */

function boot() {
  bindEvents();
  render();
}

setupGate();
if (document.documentElement.classList.contains('unlocked')) boot();
