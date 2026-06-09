// Heritage demo · App entry, router, state, view renderers.
import { CLIENTS, STAGES, CUSTOMER_TYPES, MORNING_DIGEST, DEMO_TODAY, clientById, stageById, lastTouchLabel, touchOverdue } from './data/clients.js';
import { TASKS, MEETINGS, MONDAY_RUNDOWN, STATUSES, PRIORITIES, DAILY_CAPACITY, SCHEDULE_CHANGES, tasksForClient, taskById, meetingById, scheduleChangeById, deriveProjects, projectById } from './data/work.js';
import { TICKETS, KB_ARTICLES, SAVED_VIEWS, PERSONAS, PERFORMANCE, ticketsForClient, ticketById } from './data/support.js';
import { BOTS, getHistory, appendMessage, resetHistory, matchIntent, suggestedReplies } from './chat.js';

const FOREMAN_AGENT_ID = 'agent_7201krgqhnnbebmrv5vtntkwhzkp';
let activeCallConversation = null;

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
    avatar: 'assets/hank.png',
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
    avatar: 'assets/rex-foreman.jpg',
    desc: 'Project Manager. Meetings, cadence, digests.',
    default: 'rundown',
    sidebar: [
      { id: 'rundown', label: 'Monday rundown', icon: 'rundown', route: 'rundown' },
      { id: 'tasks', label: 'Tasks', icon: 'check', route: 'tasks' },
      { id: 'meetings', label: 'Meetings & prep', icon: 'calendar', route: 'meetings' },
      { id: 'changes', label: 'Schedule changes', icon: 'sync', route: 'changes' },
    ],
  },
  sam: {
    id: 'sam',
    name: 'Celeste',
    sub: 'Help Desk',
    initial: 'C',
    avatar: 'assets/celeste.png',
    desc: 'In-app support, citations, escalations.',
    default: 'tickets',
    sidebar: [
      { id: 'tickets', label: 'Tickets', icon: 'inbox', route: 'tickets' },
      { id: 'kb', label: 'Knowledge base', icon: 'book', route: 'kb' },
      { id: 'report', label: 'Performance', icon: 'chart', route: 'report' },
    ],
  },
};

function applyAppIcon(el, app) {
  if (!el || !app) return;
  el.className = `app-icon app-icon--${app.id}`;
  if (app.avatar) {
    el.classList.add('app-icon--image');
    el.style.backgroundImage = `url('${app.avatar}')`;
    el.textContent = '';
  } else {
    el.classList.remove('app-icon--image');
    el.style.backgroundImage = '';
    el.textContent = app.initial;
  }
}

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

function fmtHours(n) {
  if (n === null || n === undefined) return '—';
  return `${n}h`;
}

function weekdayShort(iso) {
  try { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' }); } catch (e) { return ''; }
}

// Total estimated hours a person has due on a given date, across ALL tasks
// (independent of active filters). Done tasks do not count against capacity.
function ownerDayLoad(owner, dateIso) {
  if (!owner || !dateIso) return 0;
  return TASKS
    .filter((t) => t.owner === owner && t.due === dateIso && t.status !== 'Done')
    .reduce((sum, t) => sum + (t.estHours || 0), 0);
}

function isOverbooked(t) {
  return Boolean(t.due) && t.status !== 'Done' && ownerDayLoad(t.owner, t.due) > DAILY_CAPACITY;
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
    mail: '<rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 4.5L8 9l5.5-4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    warning: '<path d="M8 2L1.5 13.5h13L8 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6.5v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.9" fill="currentColor"/>',
    sync: '<path d="M13.5 8a5.5 5.5 0 01-9.6 3.7M2.5 8a5.5 5.5 0 019.6-3.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12.5 1.5v3h-3M3.5 14.5v-3h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  return `<svg class="icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* ── Shell render (top bar trigger + sidebar) ─────────────── */

function renderShell() {
  // App-switcher trigger
  const app = APPS[state.app];
  applyAppIcon(document.getElementById('app-switcher-icon'), app);
  document.getElementById('app-switcher-name').textContent = app.name;
  document.getElementById('app-switcher-sub').textContent = app.sub;

  // App-switcher menu
  const menu = document.getElementById('app-switcher-menu');
  menu.innerHTML = Object.values(APPS).map((a) => `
    <button class="app-switcher-item" data-action="switch-app" data-app="${a.id}" data-current="${a.id === state.app}">
      <span class="app-icon app-icon--${a.id}${a.avatar ? ' app-icon--image' : ''}"${a.avatar ? ` style="background-image:url('${a.avatar}')"` : ''}>${a.avatar ? '' : a.initial}</span>
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

function pipelineFilteredClients() {
  const filterStage = state.query.stage || 'all';
  const filterHealth = state.query.health || 'all';
  const filterType = state.query.type || 'all';
  return CLIENTS.filter((c) => {
    if (filterStage !== 'all' && c.stage !== filterStage) return false;
    if (filterHealth !== 'all' && c.health !== filterHealth) return false;
    if (filterType !== 'all' && c.customerType !== filterType) return false;
    return true;
  });
}

function lastTouchCell(c) {
  const label = lastTouchLabel(c);
  if (touchOverdue(c)) {
    return `<div><span class="badge badge--error">${esc(label)}</span><div class="tiny" style="color:var(--error-fg);margin-top:3px">Follow-up overdue</div></div>`;
  }
  return `<span class="muted tiny">${esc(label)}</span>`;
}

function renderHankPipeline() {
  const filterStage = state.query.stage || 'all';
  const filterHealth = state.query.health || 'all';
  const filterType = state.query.type || 'all';
  const clients = pipelineFilteredClients();

  const stageCount = (id) => CLIENTS.filter((c) => c.stage === id).length;
  const healthCount = (h) => CLIENTS.filter((c) => c.health === h).length;

  return `
    <div class="page-head">
      <span class="page-kicker">Hank · CRM</span>
      <div class="page-head-row">
        <h1>Pipeline</h1>
        <div class="page-actions">
          <button class="btn btn--secondary btn--sm">${svg('plus')} New record</button>
          <button class="btn btn--secondary btn--sm" data-action="open-mass-email">${svg('mail')} Quarterly email</button>
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
              <td>${lastTouchCell(c)}</td>
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
            <div class="row-between"><span class="muted tiny">Last touch</span>${touchOverdue(c) ? `<span class="badge badge--error">${esc(lastTouchLabel(c))}</span>` : `<strong>${esc(lastTouchLabel(c))}</strong>`}</div>
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
                <td><div style="font-weight:500">${esc(o.name)}</div>${o.fromReply ? '<div class="tiny muted" style="margin-top:2px">Created by Hank from a quarterly email reply</div>' : ''}</td>
                <td><span class="badge">${esc(o.type)}</span>${o.fromReply ? ' <span class="badge badge--outline">From reply</span>' : ''}</td>
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
            <div class="stage-step-bullet" style="background:${i === 3 ? 'var(--state)' : 'var(--bg-muted)'};color:${i === 3 ? 'var(--action-fg)' : 'var(--fg-muted)'};flex:none">${i + 1}</div>
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

/* ── Foreman · Tasks (Projects / My Tasks / All Tasks) ───── */

// HER-08 · Demo signed-in persona. Jen is the operations lead in the seed
// data (the "Jess" role from the call) — My Tasks filters to her.
const SIGNED_IN_OWNER = 'Jen';

function renderForemanTasks() {
  if (state.query.project) return renderForemanProject();
  // Old deep links (?client=, ?view=capacity, ?owner=) land on the flat All Tasks tab.
  const hasFlatQuery = state.query.client || state.query.view || state.query.owner || state.query.status || state.query.priority;
  const tab = state.query.tab || (hasFlatQuery ? 'all' : 'projects');
  if (tab === 'projects') return renderForemanProjects();
  return renderForemanTasksFlat(tab);
}

function foremanTaskTabs(tab) {
  const clientQ = state.query.client ? '&client=' + state.query.client : '';
  const mine = TASKS.filter((t) => t.owner === SIGNED_IN_OWNER).length;
  return `
    <div class="tabs">
      <a class="tab" data-active="${tab === 'projects'}" href="#/foreman/tasks?tab=projects${clientQ}">Projects <span class="tab-counter">${deriveProjects().length}</span></a>
      <a class="tab" data-active="${tab === 'mine'}" href="#/foreman/tasks?tab=mine${clientQ}">My Tasks <span class="tab-counter">${mine}</span></a>
      <a class="tab" data-active="${tab === 'all'}" href="#/foreman/tasks?tab=all${clientQ}">All Tasks <span class="tab-counter">${TASKS.length}</span></a>
    </div>
  `;
}

// Status, risk, and timeline roll up from the project's tasks.
function projectStats(p) {
  const today = new Date('2026-05-12');
  const open = p.tasks.filter((t) => t.status !== 'Done');
  const overdue = open.filter((t) => t.due && new Date(t.due) < today);
  const blocked = open.filter((t) => t.status === 'Blocked');
  const overOwners = Array.from(new Set(open.filter((t) => isOverbooked(t)).map((t) => t.owner)));
  const dues = p.tasks.filter((t) => t.due).map((t) => t.due).sort();
  const status = open.length === 0 ? 'Done' : blocked.length ? 'Blocked' : open.some((t) => t.status === 'In Progress') ? 'In Progress' : 'To Do';
  const reasons = [];
  if (overdue.length) reasons.push(`${overdue.length} overdue`);
  if (overOwners.length) reasons.push(`${overOwners.join(', ')} over capacity`);
  return {
    open: open.length,
    done: p.tasks.length - open.length,
    status,
    risk: reasons.length ? 'Elevated' : 'Normal',
    riskReason: reasons.join(' · '),
    start: dues[0] || null,
    end: dues[dues.length - 1] || null,
  };
}

function riskBadge(s) {
  if (s.risk === 'Elevated') return `<span class="badge badge--error" title="${esc(s.riskReason)}">Elevated</span>`;
  return `<span class="badge badge--success">Normal</span>`;
}

function renderForemanProjects() {
  let projects = deriveProjects();
  const followingClient = state.query.client;
  if (followingClient) projects = projects.filter((p) => p.clientId === followingClient);
  const engagements = projects.filter((p) => p.type === 'engagement').length;
  const internal = projects.length - engagements;
  const elevated = projects.filter((p) => projectStats(p).risk === 'Elevated').length;

  return `
    <div class="page-head">
      <span class="page-kicker">Foreman · Project Manager</span>
      <div class="page-head-row">
        <h1>Tasks</h1>
        <div class="page-actions">
          <button class="btn btn--primary btn--sm" data-action="new-task">${svg('plus')} New task</button>
        </div>
      </div>
      <p class="page-sub">${engagements} client engagement${engagements === 1 ? '' : 's'} and ${internal} internal effort${internal === 1 ? '' : 's'} · ${elevated ? `${elevated} at elevated risk` : 'no elevated risk'}. Status, risk, and timeline roll up from each project's tasks.${followingClient ? ` Filtered by <a href="#" data-action="unfollow">${esc(clientById(followingClient)?.name || '')}</a>.` : ''}</p>
    </div>

    ${foremanTaskTabs('projects')}

    ${projects.length === 0 ? `<div class="card empty"><h3>No matching projects</h3><p class="muted">Stop following the client to see every project.</p></div>` : `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Type</th>
            <th>Tasks</th>
            <th>Status</th>
            <th>Risk</th>
            <th>Timeline</th>
          </tr>
        </thead>
        <tbody>
          ${projects.map((p) => {
            const s = projectStats(p);
            return `
              <tr data-action="open-project" data-project="${p.id}">
                <td><div style="font-weight:500">${esc(p.name)}</div>${s.riskReason ? `<div class="tiny muted">${esc(s.riskReason)}</div>` : ''}</td>
                <td><span class="badge badge--outline">${p.type === 'engagement' ? 'Engagement' : 'Internal'}</span></td>
                <td><span class="col-mono tiny">${p.tasks.length}</span> <span class="tiny muted">· ${s.open} open</span></td>
                <td>${statusBadge(s.status)}</td>
                <td>${riskBadge(s)}</td>
                <td class="muted tiny">${s.start ? `${shortDate(s.start)} to ${shortDate(s.end)}` : 'No dates'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>`}
  `;
}

function renderForemanProject() {
  const p = projectById(state.query.project);
  if (!p) return renderNotFound('Project');
  const s = projectStats(p);
  const view = state.query.view || 'list';
  const owner = state.query.owner || 'all';
  const status = state.query.status || 'all';
  const priority = state.query.priority || 'all';
  let tasks = p.tasks.slice();
  if (owner !== 'all') tasks = tasks.filter((t) => t.owner === owner);
  if (status !== 'all') tasks = tasks.filter((t) => t.status === status);
  if (priority !== 'all') tasks = tasks.filter((t) => t.priority === priority);
  const owners = Array.from(new Set(p.tasks.map((t) => t.owner))).sort();

  return `
    <div class="page-head">
      <a href="#/foreman/tasks?tab=projects" class="btn btn--ghost btn--sm" style="align-self:flex-start;margin-bottom:8px">${svg('back')} Projects</a>
      <span class="page-kicker">Project · ${p.type === 'engagement' ? 'Client engagement' : 'Internal effort'}</span>
      <div class="page-head-row">
        <h1>${esc(p.name)}</h1>
        <div class="page-actions">
          <div class="segmented">
            ${['list', 'board', 'calendar', 'capacity'].map((v) => `<button class="segmented-item" data-active="${view === v}" data-action="set-view" data-view="${v}">${esc(v[0].toUpperCase() + v.slice(1))}</button>`).join('')}
          </div>
          <button class="btn btn--primary btn--sm" data-action="new-task">${svg('plus')} New task</button>
        </div>
      </div>
      <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap">
        ${statusBadge(s.status)}
        ${riskBadge(s)}
        ${p.clientId ? `<span class="badge">${esc(clientById(p.clientId)?.name || '')}</span>` : ''}
        <span class="tiny muted">${p.tasks.length} task${p.tasks.length === 1 ? '' : 's'} · ${s.open} open · ${s.start ? `${shortDate(s.start)} to ${shortDate(s.end)}` : 'no dates'}${s.riskReason ? ' · ' + esc(s.riskReason) : ''}</span>
      </div>
    </div>

    ${taskFilterBar({ status, priority, owner, owners })}

    ${view === 'list' ? renderForemanTasksList(tasks) : view === 'board' ? renderForemanTasksBoard(tasks) : view === 'capacity' ? renderForemanTasksCapacity(tasks) : renderForemanTasksCalendar(tasks)}
  `;
}

function taskFilterBar({ status, priority, owner, owners }) {
  return `
    <div class="filter-bar">
      <span class="caption">Status</span>
      <button class="filter-chip" data-action="filter" data-filter="status" data-value="all" data-active="${status === 'all'}">All</button>
      ${STATUSES.map((s) => `<button class="filter-chip" data-action="filter" data-filter="status" data-value="${s}" data-active="${status === s}">${esc(s)}</button>`).join('')}
      <span style="width:12px"></span>
      <span class="caption">Priority</span>
      <button class="filter-chip" data-action="filter" data-filter="priority" data-value="all" data-active="${priority === 'all'}">All</button>
      ${PRIORITIES.map((p) => `<button class="filter-chip" data-action="filter" data-filter="priority" data-value="${p}" data-active="${priority === p}">${esc(p)}</button>`).join('')}
      ${owners ? `
      <span style="width:12px"></span>
      <span class="caption">Owner</span>
      <button class="filter-chip" data-action="filter" data-filter="owner" data-value="all" data-active="${owner === 'all'}">All</button>
      ${owners.map((o) => `<button class="filter-chip" data-action="filter" data-filter="owner" data-value="${o}" data-active="${owner === o}">${esc(o)}</button>`).join('')}` : ''}
    </div>
  `;
}

function renderForemanTasksFlat(tab) {
  const mine = tab === 'mine';
  const view = state.query.view || 'list';
  const owner = mine ? SIGNED_IN_OWNER : (state.query.owner || 'all');
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
            ${['list', 'board', 'calendar', 'capacity'].map((v) => `<button class="segmented-item" data-active="${view === v}" data-action="set-view" data-view="${v}">${esc(v[0].toUpperCase() + v.slice(1))}</button>`).join('')}
          </div>
          <button class="btn btn--primary btn--sm" data-action="new-task">${svg('plus')} New task</button>
        </div>
      </div>
      <p class="page-sub">${tasks.length} task${tasks.length === 1 ? '' : 's'} · ${mine ? `Signed in as ${SIGNED_IN_OWNER}, operations lead.` : 'Heritage no-dates standard enforced.'} ${followingClient ? `Filtered by <a href="#" data-action="unfollow">${esc(clientById(followingClient)?.name || '')}</a>.` : mine ? '' : 'Across every engagement.'}</p>
    </div>

    ${foremanTaskTabs(tab)}

    ${taskFilterBar({ status, priority, owner, owners: mine ? null : owners })}

    ${view === 'list' ? renderForemanTasksList(tasks) : view === 'board' ? renderForemanTasksBoard(tasks) : view === 'capacity' ? renderForemanTasksCapacity(tasks) : renderForemanTasksCalendar(tasks)}
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
            <th>Est.</th>
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
              <td><span class="col-mono tiny muted">${fmtHours(t.estHours)}</span>${isOverbooked(t) ? ` <span class="badge badge--error" title="${esc(t.owner)} has ${ownerDayLoad(t.owner, t.due)}h due ${shortDate(t.due)}, over the ${DAILY_CAPACITY}h day">${ownerDayLoad(t.owner, t.due)}h day</span>` : ''}</td>
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
                ${isOverbooked(t) ? `<span class="badge badge--error" title="${esc(t.owner)} has ${ownerDayLoad(t.owner, t.due)}h due ${shortDate(t.due)}, over the ${DAILY_CAPACITY}h day">Day over</span>` : ''}
                <span class="muted">${esc(t.id)}</span>
              </div>
              <div class="kanban-card-meta">
                ${avatarFor(t.owner, 'sm')}
                <span>${esc(t.owner)}</span>
                <span class="muted" style="margin-left:auto">${shortDate(t.due)} · ${fmtHours(t.estHours)}</span>
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
        const booked = tt.filter((t) => t.status !== 'Done').reduce((sum, t) => sum + (t.estHours || 0), 0);
        const overOwners = Array.from(new Set(tt.map((t) => t.owner))).filter((o) => ownerDayLoad(o, iso) > DAILY_CAPACITY);
        return `
          <div class="calendar-cell" data-other="${other}" data-today="${isToday}">
            <div class="calendar-day">${d.getDate()}</div>
            ${booked ? `<div class="calendar-hours" data-over="${overOwners.length > 0}" title="${esc(`${booked}h estimated across ${tt.length} task${tt.length === 1 ? '' : 's'}. Daily capacity is ${DAILY_CAPACITY}h per person.`)}">${booked}h${overOwners.length ? ` · ${esc(overOwners.join(', '))} over` : ' booked'}</div>` : ''}
            ${tt.slice(0, 3).map((t) => `<div class="calendar-task" data-priority="${esc(t.priority)}" data-action="open-task" data-task="${t.id}" title="${esc(t.title)} · ${fmtHours(t.estHours)}">${esc(t.title)}</div>`).join('')}
            ${tt.length > 3 ? `<div class="tiny muted">+${tt.length - 3} more</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderForemanTasksCapacity(tasks) {
  // Coming 10 days from the demo "today" (May 12 to May 21).
  const start = Date.UTC(2026, 4, 12);
  const days = [];
  for (let i = 0; i < 10; i++) days.push(new Date(start + i * 86400000).toISOString().slice(0, 10));

  const active = tasks.filter((t) => t.status !== 'Done' && t.due);
  const owners = Array.from(new Set(tasks.map((t) => t.owner))).sort();
  const load = {};
  for (const t of active) {
    load[t.owner] = load[t.owner] || {};
    load[t.owner][t.due] = (load[t.owner][t.due] || 0) + (t.estHours || 0);
  }

  if (owners.length === 0) return `<div class="card empty"><h3>No matching tasks</h3><p class="muted">Adjust filters to see more.</p></div>`;

  return `
    <div class="card mb-md">
      <div class="row" style="gap:12px;justify-content:space-between;flex-wrap:wrap">
        <div class="card-title">Capacity · ${shortDate(days[0])} to ${shortDate(days[days.length - 1])}</div>
        <span class="tiny muted">Daily capacity is ${DAILY_CAPACITY}h per person, summed from estimated hours on tasks due that day. A red bar means the day is over. Move due dates to rebalance.</span>
      </div>
    </div>
    <div class="capacity-grid">
      ${owners.map((o) => {
        const byDay = load[o] || {};
        const total = days.reduce((sum, d) => sum + (byDay[d] || 0), 0);
        const overDays = days.filter((d) => (byDay[d] || 0) > DAILY_CAPACITY);
        return `
          <div class="card">
            <div class="row" style="gap:10px">
              ${avatarFor(o, 'sm')}
              <strong>${esc(o)}</strong>
              ${overDays.length ? `<span class="badge badge--error">Over on ${overDays.map(shortDate).join(', ')}</span>` : `<span class="badge badge--success">Within capacity</span>`}
              <span class="tiny muted" style="margin-left:auto">${total}h booked</span>
            </div>
            <div class="bar-list" style="margin-top:14px">
              ${days.map((d) => {
                const h = byDay[d] || 0;
                const over = h > DAILY_CAPACITY;
                const pct = Math.min((h / DAILY_CAPACITY) * 100, 100);
                return `
                  <div class="bar-row">
                    <span class="${over ? 'capacity-day--over' : 'muted'}">${weekdayShort(d)} · ${shortDate(d)}</span>
                    <div class="bar-track">${h ? `<div class="bar-fill" style="width:${pct}%;background:var(--${over ? 'error' : 'viz-0'})"></div>` : ''}</div>
                    <span class="bar-value ${over ? 'capacity-day--over' : ''}">${h}h/${DAILY_CAPACITY}h</span>
                  </div>
                `;
              }).join('')}
            </div>
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
  // Keep the project, tab, or client context when navigating back / across dependencies (HER-08).
  const backParams = [];
  if (state.query.project) backParams.push('project=' + encodeURIComponent(state.query.project));
  else {
    if (state.query.tab) backParams.push('tab=' + encodeURIComponent(state.query.tab));
    if (state.query.client) backParams.push('client=' + encodeURIComponent(state.query.client));
  }
  const keepQ = backParams.length ? '?' + backParams.join('&') : '';

  return `
    <div class="page-head">
      <a href="#/foreman/tasks${keepQ}" class="btn btn--ghost btn--sm" style="align-self:flex-start;margin-bottom:8px">${svg('back')} ${state.query.project ? 'Back to project' : state.query.tab === 'mine' ? 'My tasks' : 'All tasks'}</a>
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
              ${t.dependencies.map((d) => `<a class="dep-pill" href="#/foreman/tasks/${d}${keepQ}">${esc(d)}</a>`).join('')}
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
            <dt>Estimated</dt><dd><span class="hours-edit"><input class="input" type="number" min="0.5" max="12" step="0.5" value="${t.estHours}" data-hours-task="${t.id}" aria-label="Estimated hours"> h</span></dd>
            <dt>Status</dt><dd>${statusBadge(t.status)}</dd>
            <dt>Priority</dt><dd>${priorityBadge(t.priority)}</dd>
            <dt>Engagement</dt><dd>${esc(t.engagement)}</dd>
            ${client ? `<dt>Client</dt><dd>${clientLink(client.id, { follow: true })}</dd>` : ''}
          </dl>
          ${isOverbooked(t) ? `<div class="capacity-flag"><strong>${esc(t.owner)} is over capacity on ${shortDate(t.due)}.</strong> ${ownerDayLoad(t.owner, t.due)}h booked against an ${DAILY_CAPACITY}h day. <a href="#/foreman/tasks?view=capacity">Open capacity view</a> to rebalance due dates.</div>` : ''}
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
  // HER-07: Meetings + prep protocol merged into one view. HER-11: chronological default, soonest first.
  const tab = state.query.tab || 'upcoming';
  const today = new Date('2026-05-12');
  const past = MEETINGS.filter((m) => new Date(m.date) < today).sort((a, b) => (a.date < b.date ? 1 : -1));
  const upcoming = MEETINGS.filter((m) => new Date(m.date) >= today).sort((a, b) => (a.date < b.date ? -1 : 1));
  const list = tab === 'past' ? past : upcoming;
  const clientQ = state.query.client ? '&client=' + state.query.client : '';
  const flagged = upcoming.filter((m) => prepGaps(m).length > 0).length;

  return `
    <div class="page-head">
      <span class="page-kicker">Foreman · Project Manager</span>
      <div class="page-head-row">
        <h1>Meetings & prep</h1>
        <div class="page-actions">
          <span class="tiny muted">Synced from Outlook 4 minutes ago. Read only, Outlook remains the source of truth.</span>
        </div>
      </div>
      <p class="page-sub">Every client meeting pulled from Outlook with its prep stages in Heritage order: team file review, then Tom's file review, then the client meeting. Foreman flags any stage that is not booked. Scheduling stays in Outlook; tasks are created here.</p>
    </div>

    <div class="tabs">
      <a class="tab" data-active="${tab !== 'past'}" href="#/foreman/meetings?tab=upcoming${clientQ}">Upcoming <span class="tab-counter">${upcoming.length}</span></a>
      <a class="tab" data-active="${tab === 'past'}" href="#/foreman/meetings?tab=past${clientQ}">Past <span class="tab-counter">${past.length}</span></a>
    </div>

    ${tab !== 'past' && flagged > 0 ? `
      <div class="card mb-md" style="padding:14px 16px">
        <div class="row" style="gap:14px">
          <span class="health-pill health-pill--amber">${healthDot('amber')} ${flagged} meeting${flagged === 1 ? '' : 's'} with an unbooked prep stage</span>
          <span class="health-pill health-pill--green">${healthDot('green')} ${upcoming.length - flagged} fully staged</span>
        </div>
      </div>
    ` : ''}

    ${list.map((m) => meetingPrepBlock(m, today)).join('')}
  `;
}

function prepGaps(m) {
  return (m.prep || []).filter((s) => s.status === 'Not booked' || !s.date);
}

function meetingPrepBlock(m, today) {
  const c = clientById(m.clientId);
  const isPast = new Date(m.date) < today;
  const gaps = isPast ? [] : prepGaps(m);
  const stages = [
    ...(m.prep || []),
    { name: 'Client meeting', date: m.date, time: m.time, status: isPast ? 'Done' : 'Scheduled' },
  ];
  const gapNames = gaps.map((g) => g.name).join(' and ');

  return `
    <div class="meeting-block${gaps.length ? ' meeting-block--flagged' : ''}" data-action="open-meeting" data-meeting="${m.id}">
      <div class="meeting-block-head">
        <div>
          <div style="font-weight:500">${esc(m.title)}</div>
          <div class="tiny muted">${c ? esc(c.name) + ' · ' : ''}<span class="col-mono">${esc(m.id)}</span></div>
        </div>
        <div class="row" style="gap:8px;justify-content:flex-end;flex-wrap:wrap">
          <span class="badge badge--outline">${esc(m.type)}</span>
          ${meetingStatusBadge(m.status)}
          <span class="tiny muted">${shortDate(m.date)}${m.time ? ' · ' + esc(m.time) : ''}${m.durationMin ? ' · ' + m.durationMin + 'min' : ''}</span>
          <div class="avatar-stack">${m.attendees.slice(0, 4).map((a) => avatarFor(a, 'sm')).join('')}</div>
        </div>
      </div>
      <div class="meeting-stages">
        ${stages.map((s) => `
          <div class="cadence-cell" data-status="${esc(s.status)}">
            <span class="cadence-cell-name">${esc(s.name)}</span>
            <span class="cadence-cell-date">${s.date ? shortDate(s.date) + (s.time ? ' · ' + esc(s.time) : '') : 'No date'}</span>
            <span class="cadence-cell-status">${esc(s.status)}</span>
          </div>
        `).join('')}
      </div>
      ${gaps.length ? `
        <div class="meeting-flag">
          ${svg('warning')}
          <span>${esc(gapNames)} ${gaps.length > 1 ? 'are' : 'is'} not booked but the client meeting is set for ${shortDate(m.date)}. Book the review now so the file does not reach Tom thirty minutes before the client.</span>
        </div>
      ` : ''}
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
            <pre style="margin-top:12px;font-family:var(--font-mono);font-size:12px;line-height:1.6;color:var(--fg);white-space:pre-wrap;background:var(--bg-muted);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border-subtle)">${esc(m.transcriptExcerpt)}</pre>
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

/* ── Foreman · Schedule changes (HER-10) ─────────────────── */

function changeTypeBadge(type) {
  if (type === 'Cancelled') return `<span class="badge badge--warning">Cancelled</span>`;
  if (type === 'New meeting') return `<span class="badge badge--success">New meeting</span>`;
  if (type === 'Shortened') return `<span class="badge badge--info">Shortened</span>`;
  return `<span class="badge badge--info">Moved</span>`;
}

function renderForemanChanges() {
  const total = SCHEDULE_CHANGES.length;
  const reviewed = SCHEDULE_CHANGES.filter((ch) => ch.review).length;
  const pending = total - reviewed;

  return `
    <div class="page-head">
      <span class="page-kicker">Foreman · Project Manager</span>
      <div class="page-head-row">
        <h1>Schedule changes</h1>
        <div class="page-actions">
          <span class="tiny muted">Synced from Outlook 4 minutes ago. Read only, Outlook remains the source of truth.</span>
        </div>
      </div>
      <p class="page-sub">Every calendar change the Outlook sync picks up lands here, roughly every fifteen minutes. Mark each one good or flag it for follow-up. Nothing writes back to Outlook.</p>
    </div>

    <div class="card mb-md" style="padding:14px 16px">
      <div class="row" style="gap:14px">
        <span class="health-pill ${pending ? 'health-pill--amber' : 'health-pill--green'}">${healthDot(pending ? 'amber' : 'green')} ${reviewed} of ${total} reviewed</span>
        <span class="tiny muted">${pending ? `${pending} change${pending === 1 ? '' : 's'} awaiting review` : 'All changes reviewed'}</span>
      </div>
    </div>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Change</th>
            <th>Client</th>
            <th>Detected</th>
            <th>Impact</th>
            <th style="text-align:right">Review</th>
          </tr>
        </thead>
        <tbody>
          ${SCHEDULE_CHANGES.map((ch) => {
            const c = ch.clientId ? clientById(ch.clientId) : null;
            const linked = ch.meetingId && meetingById(ch.meetingId);
            return `
              <tr${linked ? ` data-action="open-meeting" data-meeting="${ch.meetingId}"` : ''}>
                <td>
                  <div class="row" style="gap:8px">${changeTypeBadge(ch.type)}<span style="font-weight:500">${esc(ch.title)}</span></div>
                  <div class="tiny muted" style="margin-top:4px">${esc(ch.detail)} · ${esc(ch.changedBy)}</div>
                </td>
                <td class="muted tiny">${c ? esc(c.name) : 'Internal'}</td>
                <td class="tiny muted" style="white-space:nowrap">${esc(ch.detected)}</td>
                <td class="tiny muted">${esc(ch.impact)}</td>
                <td style="text-align:right;white-space:nowrap">
                  ${ch.review === 'good'
                    ? `<span class="badge badge--success">Marked good</span>`
                    : ch.review === 'follow-up'
                      ? `<span class="badge badge--warning">Follow-up</span>`
                      : `<button class="btn btn--secondary btn--sm" data-action="review-change" data-change="${ch.id}" data-verdict="good">Good</button>
                         <button class="btn btn--ghost btn--sm" data-action="review-change" data-change="${ch.id}" data-verdict="follow-up">Flag for follow-up</button>`}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <p class="tiny muted" style="margin-top:12px">Changes are detected from the read-only Outlook sync. Marking a change here never edits the Outlook event.</p>
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
                <span class="message-author">${esc(c.author === 'user' ? t.user : c.author === 'sam' ? 'Celeste (AI)' : (c.who || 'Heritage'))}</span>
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
    if (segs[0] === 'changes') return renderForemanChanges();
    if (segs[0] === 'prep') return renderForemanMeetings(); // merged into Meetings & prep (HER-07); old links keep working
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
    answer: `Koenigsberg is on track. IR2 Meeting Letter sent May 10. IR3 locked for May 22 with Craig + Yvonne + Keith Meltzer. The Jake Koenigsberg life insurance underwriting packet is the priority item — Jen is finalizing medical disclosures before submitting to the carrier (T-2042). Yvonne is now CC'd on accountant correspondence (handled in T-2043).`,
    citations: [
      { label: 'Meeting · IR2 May 10', href: '#/foreman/meetings/mtg-koenigsberg-ir2?client=koenigsberg' },
      { label: 'Task T-2042 · Jake life insurance packet', href: '#/foreman/tasks/T-2042?client=koenigsberg' },
      { label: 'Client record · Koenigsberg', href: '#/hank/clients/koenigsberg?client=koenigsberg' },
    ],
  },
  {
    id: 'slipped-week',
    prompt: 'What slipped this week?',
    answer: `Three items slipped:
• Haugland Q1 Renewal Letter (T-2045) — still drafting; blocked until Giamo unblock. Tom Sr. follow-up call May 14.
• Haugland Phase II Letter (T-2046) — pending Giamo follow-up since April.
• Mills Vic valuation (T-2048) — Goodman Marks two weeks past target.`,
    citations: [
      { label: 'Task T-2045 · Haugland Q1', href: '#/foreman/tasks/T-2045' },
      { label: 'Task T-2046 · Haugland Phase II', href: '#/foreman/tasks/T-2046' },
      { label: 'Task T-2048 · Mills Vic valuation', href: '#/foreman/tasks/T-2048' },
    ],
  },
  {
    id: 'ir2-cadence',
    prompt: 'Prep status for IR2 across active clients',
    answer: `Snapshot:
• Koenigsberg — IR2 Done (May 10, Meeting Letter sent).
• Chrinian — IR2 Done (Apr 14, KM webinar).
• Garten — IR2 On Track (June 10).
• Penson — Upcoming (IR1 May 24 first).
• Haugland — IR2 Slipped (pending Giamo).
• Dana — IR2 At Risk (Goodman Marks valuations pending).
• Mills — IR2 At Risk (Vic valuation pending).`,
    citations: [
      { label: 'Meetings & prep overview', href: '#/foreman/meetings' },
    ],
  },
  {
    id: 'old-partner-firm',
    prompt: 'Open referral-partner tickets aged > 24h',
    answer: `Two tickets:
• H-3042 — Diane "AI Platform Drop Box upload failed (Garten)" — Escalated, 5h, 1h 12m to SLA breach. Assigned Matt.
• H-3051 — MH planning team "Flow Diagram PDF render issue (Garten)" — Escalated, 3h, 2h 14m to SLA breach. Assigned Matt.
Both routed to AI Platform support rotation.`,
    citations: [
      { label: 'Ticket H-3042', href: '#/sam/tickets/H-3042' },
      { label: 'Ticket H-3051', href: '#/sam/tickets/H-3051' },
    ],
  },
  {
    id: 'mills-follow-up',
    prompt: 'Draft a follow-up to Mills principal',
    answer: `Hank drafted a follow-up in Heritage voice. The draft prioritizes confirming the Vic valuation timeline with Goodman Marks before the next Mills IR2, sets a clear next step, and asks John to confirm the IRA beneficiary update at NEPWM. No commitments made on Heritage's behalf; the draft requests Jen's approval before send.

Opening the draft now.`,
    citations: [
      { label: 'Client record · Mills Family', href: '#/hank/clients/whitcombe?client=whitcombe' },
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
    <h3 style="font-family:var(--font-display);font-size:18px;font-weight:500">${esc(p.prompt)}</h3>
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
  if (c.id === 'whitcombe') return 'Confirming Vic valuation timeline';
  if (c.id === 'koenigsberg') return 'IR3 · May 22 · Jake life insurance update';
  if (c.id === 'carrington') return 'Introducing Heritage Strategies';
  return `Following up · ${c.name}`;
}

function draftBody(c) {
  if (c.id === 'whitcombe') return `John,

Following our IR2 review three weeks ago, we are ready to confirm the Vic valuation timeline before scheduling the next Phase II step. To keep the cadence we set, I am asking for confirmation on two items below.

  · Goodman Marks valuation completion target: Friday, May 22
  · NEPWM IRA beneficiary update for Vic: confirmed by Jeff Filone

If either is at risk, please send the next concrete date that does work and I will adjust the schedule accordingly.

I am also chasing Jeff Filone directly on the NEPWM side — we cannot close the IRA piece without his confirmation.

Best,
Jen
Heritage Strategies`;
  if (c.id === 'koenigsberg') return `Craig,

Confirming IR3 on May 22 at 10:00am ET. Yvonne will join. Keith Meltzer is dialing in for the Nevada trust portion.

The Jake life insurance underwriting packet remains the single Q2 priority. Jen is finalizing the medical disclosures with Kearney & Raffanelli and will share the final packet before the meeting.

Yvonne is now CC'd on all accountant correspondence going forward.

Best,
Tom`;
  if (c.id === 'carrington') return `Peter,

Carl DelPrete and Phil Giunta both spoke highly of the work you have built at Western Beef. We help families and operating-business owners run multi-generational planning at the level your situation calls for.

I would like to set up a 30-minute introductory call this or next week. Please send two dates that work.

Best,
Tom
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

/* ── Quarterly mass email modal ──────────────────────────── */

function massEmailBody() {
  return `Hello,

A short quarterly update from Heritage Strategies.

1. Estate and gift planning: the federal exemption window remains the planning priority for 2026. We are reviewing every family's position ahead of year-end.
2. AI Platform: Asset Sheets and Flow Diagrams are now refreshed quarterly. If anything has changed (a property sale, a new entity, a liquidity event), reply to this email and we will fold it into your next review.
3. Scheduling: Q2 review meetings are being booked now. Reply with two dates that work and we will confirm.

If anything in your situation has changed, reply here. It comes straight to our desk.

Best,
Tom
Heritage Strategies`;
}

function openMassEmailModal() {
  const clients = pipelineFilteredClients();
  const root = document.getElementById('dialog-root');
  const dialog = document.getElementById('dialog');
  root.dataset.open = 'true';
  root.setAttribute('aria-hidden', 'false');
  dialog.innerHTML = `
    <button class="dialog-close" data-dialog-close aria-label="Close">×</button>
    <div class="page-kicker">Quarterly email · Hank</div>
    <div class="dialog-title">Q2 2026 client update</div>
    <div class="dialog-sub">Sends through the Heritage Outlook connection. Hank logs the send to every record, auto-logs replies as they arrive, and updates last touch.</div>

    <dl class="draft-meta">
      <dt>From</dt><dd>Tom Sr. · Heritage Strategies</dd>
      <dt>To</dt><dd>${clients.length} recipient${clients.length === 1 ? '' : 's'} · current pipeline filters applied</dd>
    </dl>
    <div class="flex-wrap" style="margin:10px 0 14px">
      ${clients.length === 0 ? '<span class="muted tiny">No clients match the current filters.</span>' : clients.map((c) => `<span class="badge badge--outline">${esc(c.name)}</span>`).join('')}
    </div>

    <form id="mass-email-form">
      <label class="label"><span>Subject</span><input class="input" name="subject" value="Heritage Strategies · Q2 2026 client update" required></label>
      <label class="label"><span>Body</span><textarea name="body" rows="9">${esc(massEmailBody())}</textarea></label>
      <div class="dialog-foot">
        <button class="btn btn--ghost btn--sm" type="button" data-dialog-close>Cancel</button>
        <button class="btn btn--primary btn--sm" type="submit" ${clients.length === 0 ? 'disabled' : ''}>${svg('mail')} Send via Outlook</button>
      </div>
    </form>
  `;
}

function handleMassEmailSubmit(form) {
  const fd = new FormData(form);
  const subject = String(fd.get('subject') || '').trim() || 'Quarterly client update';
  const clients = pipelineFilteredClients();
  if (clients.length === 0) return;
  for (const c of clients) {
    c.activity.unshift({ type: 'email', date: DEMO_TODAY, summary: `Quarterly email sent · ${subject}`, who: 'Hank via Outlook' });
    c.lastTouch = DEMO_TODAY;
  }
  closeDialog();
  toast(`Quarterly email sent to ${clients.length} client${clients.length === 1 ? '' : 's'} via Outlook. Logged to each record; last touch updated. Replies will auto-log as they arrive.`, 'success');
  render();
}

/* ── New task modal ──────────────────────────────────────── */

function nextTaskId() {
  const max = TASKS.reduce((m, t) => {
    const n = parseInt(String(t.id).replace('T-', ''), 10);
    return isFinite(n) && n > m ? n : m;
  }, 0);
  return 'T-' + (max + 1);
}

function openNewTaskModal() {
  const owners = Array.from(new Set(TASKS.map((t) => t.owner))).sort();
  const root = document.getElementById('dialog-root');
  const dialog = document.getElementById('dialog');
  root.dataset.open = 'true';
  root.setAttribute('aria-hidden', 'false');
  dialog.innerHTML = `
    <button class="dialog-close" data-dialog-close aria-label="Close">×</button>
    <div class="page-kicker">New task · Foreman</div>
    <div class="dialog-title">Create task</div>
    <div class="dialog-sub">Estimated hours feed the daily capacity check. Foreman flags anyone booked above ${DAILY_CAPACITY}h on a single day.</div>

    <form id="new-task-form">
      <label class="label"><span>Title</span><input class="input" name="title" required placeholder="e.g. Chase Goodman Marks on Vic valuation"></label>
      <div class="row" style="gap:12px;align-items:flex-start">
        <label class="label" style="flex:1"><span>Owner</span>
          <select class="select" name="owner">${owners.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select>
        </label>
        <label class="label" style="flex:1"><span>Due date</span><input class="input" type="date" name="due" value="2026-05-14" required></label>
      </div>
      <div class="row" style="gap:12px;align-items:flex-start">
        <label class="label" style="flex:1"><span>Priority</span>
          <select class="select" name="priority">${PRIORITIES.map((p) => `<option value="${esc(p)}"${p === 'Normal' ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select>
        </label>
        <label class="label" style="flex:1"><span>Estimated hours</span><input class="input" type="number" name="estHours" min="0.5" max="12" step="0.5" value="1" required></label>
      </div>
      <div class="dialog-foot">
        <button class="btn btn--ghost btn--sm" type="button" data-dialog-close>Cancel</button>
        <button class="btn btn--primary btn--sm" type="submit">Create task</button>
      </div>
    </form>
  `;
}

function handleNewTaskSubmit(form) {
  const fd = new FormData(form);
  const title = String(fd.get('title') || '').trim();
  const owner = String(fd.get('owner') || '');
  const due = String(fd.get('due') || '');
  const priority = String(fd.get('priority') || 'Normal');
  const estHours = parseFloat(fd.get('estHours')) || 1;
  if (!title || !owner || !due) return;
  const id = nextTaskId();
  TASKS.push({
    id,
    title,
    owner,
    due,
    estHours,
    status: 'To Do',
    priority,
    labels: [],
    clientId: null,
    engagement: 'Internal · operations',
    description: title,
    subtasks: [],
    dependencies: [],
    comments: [],
    activity: [{ date: '2026-05-12', event: 'Task created' }],
    attachments: [],
  });
  closeDialog();
  const load = ownerDayLoad(owner, due);
  if (load > DAILY_CAPACITY) {
    toast(`${id} created. ${owner} is now at ${load}h on ${shortDate(due)}, over the ${DAILY_CAPACITY}h day.`);
  } else {
    toast(`${id} created. ${owner} is at ${load}h of ${DAILY_CAPACITY}h on ${shortDate(due)}.`, 'success');
  }
  render();
}

/* ── Chat widget ─────────────────────────────────────────── */

function renderChatShell() {
  const bot = BOTS[state.app];
  const fabIcon = document.getElementById('chat-fab-icon');
  applyAppIcon(fabIcon, bot);
  fabIcon.classList.add('chat-fab-icon');
  const headIcon = document.getElementById('chat-head-icon');
  applyAppIcon(headIcon, bot);
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
  const bot = BOTS[state.app];
  const portrait = document.getElementById('call-portrait');
  if (portrait && bot && bot.avatar) {
    portrait.style.backgroundImage = `url('${bot.avatar}')`;
    portrait.setAttribute('aria-label', bot.name);
  }
  const title = document.getElementById('call-card-title');
  if (title && bot) title.textContent = bot.name;
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
  const wrap = document.querySelector('.call-portrait-wrap');
  if (wrap) wrap.dataset.state = state;
}

function pcmFloat32ToInt16Base64(float32) {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToInt16(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

function resampleFloat32(input, inRate, outRate) {
  if (inRate === outRate) return input;
  const ratio = inRate / outRate;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcIdx = i * ratio;
    const i0 = Math.floor(srcIdx);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const t = srcIdx - i0;
    out[i] = input[i0] * (1 - t) + input[i1] * t;
  }
  return out;
}

class ForemanCall {
  constructor(handlers) {
    this.h = handlers;
    this.ws = null;
    this.audioCtx = null;
    this.stream = null;
    this.processor = null;
    this.source = null;
    this.playCursor = 0;
    this.inputSampleRate = 16000;
    this.outputSampleRate = 16000;
    this.ended = false;
    this.activeSources = new Set();
  }

  stopPlayback() {
    for (const src of this.activeSources) {
      try { src.onended = null; src.stop(); } catch {}
      try { src.disconnect(); } catch {}
    }
    this.activeSources.clear();
    if (this.audioCtx) this.playCursor = this.audioCtx.currentTime;
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.playCursor = this.audioCtx.currentTime;
    this.ws = new WebSocket(
      `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${FOREMAN_AGENT_ID}`
    );
    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({ type: 'conversation_initiation_client_data' }));
      this.h.onConnect && this.h.onConnect();
      this.startCapture();
    };
    this.ws.onmessage = (e) => this.handleMessage(e);
    this.ws.onerror = (e) => { this.h.onError && this.h.onError(e); };
    this.ws.onclose = () => { if (!this.ended) this.h.onDisconnect && this.h.onDisconnect(); };
  }

  startCapture() {
    this.source = this.audioCtx.createMediaStreamSource(this.stream);
    const bufSize = 4096;
    this.processor = this.audioCtx.createScriptProcessor(bufSize, 1, 1);
    this.source.connect(this.processor);
    this.processor.connect(this.audioCtx.destination);
    this.processor.onaudioprocess = (ev) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const input = ev.inputBuffer.getChannelData(0);
      const resampled = resampleFloat32(input, this.audioCtx.sampleRate, this.inputSampleRate);
      const b64 = pcmFloat32ToInt16Base64(resampled);
      this.ws.send(JSON.stringify({ user_audio_chunk: b64 }));
    };
  }

  handleMessage(e) {
    let data;
    try { data = JSON.parse(e.data); } catch { return; }
    switch (data.type) {
      case 'conversation_initiation_metadata': {
        const meta = data.conversation_initiation_metadata_event || {};
        if (meta.user_input_audio_format) {
          const m = String(meta.user_input_audio_format).match(/(\d+)/);
          if (m) this.inputSampleRate = parseInt(m[1], 10);
        }
        if (meta.agent_output_audio_format) {
          const m = String(meta.agent_output_audio_format).match(/(\d+)/);
          if (m) this.outputSampleRate = parseInt(m[1], 10);
        }
        break;
      }
      case 'user_transcript':
        this.h.onUserTranscript && this.h.onUserTranscript(
          data.user_transcription_event?.user_transcript || ''
        );
        break;
      case 'agent_response':
        this.h.onAgentResponse && this.h.onAgentResponse(
          data.agent_response_event?.agent_response || ''
        );
        break;
      case 'audio': {
        const b64 = data.audio_event?.audio_base_64;
        if (b64) this.playAudio(b64);
        this.h.onSpeaking && this.h.onSpeaking();
        break;
      }
      case 'interruption':
        this.stopPlayback();
        this.h.onListening && this.h.onListening();
        break;
      case 'ping': {
        const evt = data.ping_event || {};
        setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'pong', event_id: evt.event_id }));
          }
        }, evt.ping_ms || 0);
        break;
      }
    }
  }

  playAudio(b64) {
    if (this.ended) return;
    const int16 = base64ToInt16(b64);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 0x8000;
    const buf = this.audioCtx.createBuffer(1, float32.length, this.outputSampleRate);
    buf.copyToChannel(float32, 0);
    const src = this.audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(this.audioCtx.destination);
    const now = this.audioCtx.currentTime;
    const startAt = Math.max(this.playCursor, now);
    src.start(startAt);
    this.playCursor = startAt + buf.duration;
    this.activeSources.add(src);
    src.onended = () => {
      this.activeSources.delete(src);
      try { src.disconnect(); } catch {}
      if (this.audioCtx && this.activeSources.size === 0
          && this.playCursor <= this.audioCtx.currentTime + 0.05) {
        this.h.onListening && this.h.onListening();
      }
    };
  }

  async end() {
    this.ended = true;
    this.stopPlayback();
    try { this.processor && (this.processor.onaudioprocess = null); } catch {}
    try { this.processor && this.processor.disconnect(); } catch {}
    try { this.source && this.source.disconnect(); } catch {}
    try { this.stream && this.stream.getTracks().forEach((t) => t.stop()); } catch {}
    try { this.audioCtx && await this.audioCtx.close(); } catch {}
    try { this.ws && this.ws.close(); } catch {}
  }
}

async function startCall() {
  if (activeCallConversation) {
    try { await activeCallConversation.end(); } catch {}
    activeCallConversation = null;
  }
  const startBtn = document.getElementById('call-start');
  const endBtn = document.getElementById('call-end');
  startBtn.disabled = true;
  setCallStatus('Connecting…');
  setOrbState('connecting');
  try {
    activeCallConversation = new ForemanCall({
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
        console.error('Foreman WS error', err);
        setCallStatus('Connection failed — try again');
        setOrbState('idle');
        startBtn.hidden = false;
        endBtn.hidden = true;
        startBtn.disabled = false;
      },
      onSpeaking: () => { setCallStatus('Foreman is speaking'); setOrbState('speaking'); },
      onListening: () => { setCallStatus('Listening…'); setOrbState('listening'); },
    });
    await activeCallConversation.start();
  } catch (err) {
    console.error('Foreman call init error', err);
    setCallStatus(err && err.name === 'NotAllowedError' ? 'Microphone access denied' : 'Could not start call');
    setOrbState('idle');
    startBtn.disabled = false;
  }
}

async function endCall() {
  if (activeCallConversation) {
    try { await activeCallConversation.end(); } catch (e) { /* noop */ }
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
    if (action === 'open-project') {
      e.preventDefault();
      navigate({ app: 'foreman', route: 'tasks', query: { project: a.dataset.project }, removeQuery: ['tab', 'view', 'status', 'priority', 'owner'] });
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
    if (action === 'new-task') {
      e.preventDefault();
      openNewTaskModal();
      return;
    }
    if (action === 'open-mass-email') {
      e.preventDefault();
      openMassEmailModal();
      return;
    }
    if (action === 'review-change') {
      e.preventDefault();
      const ch = scheduleChangeById(a.dataset.change);
      if (!ch || ch.review) return;
      ch.review = a.dataset.verdict === 'follow-up' ? 'follow-up' : 'good';
      const reviewed = SCHEDULE_CHANGES.filter((x) => x.review).length;
      if (ch.review === 'good') {
        toast(`Marked good. ${reviewed} of ${SCHEDULE_CHANGES.length} changes reviewed. Outlook is untouched.`, 'success');
      } else {
        toast(`Flagged for follow-up. ${reviewed} of ${SCHEDULE_CHANGES.length} changes reviewed. Outlook is untouched.`);
      }
      render();
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

  // Dialog forms (new task + quarterly mass email)
  document.addEventListener('submit', (e) => {
    const taskForm = e.target.closest('#new-task-form');
    if (taskForm) {
      e.preventDefault();
      handleNewTaskSubmit(taskForm);
      return;
    }
    const massForm = e.target.closest('#mass-email-form');
    if (massForm) {
      e.preventDefault();
      handleMassEmailSubmit(massForm);
    }
  });

  // Estimated-hours inline edit on task detail
  document.addEventListener('change', (e) => {
    const input = e.target.closest('input[data-hours-task]');
    if (!input) return;
    const t = taskById(input.dataset.hoursTask);
    if (!t) return;
    const v = parseFloat(input.value);
    if (!isFinite(v) || v <= 0) { input.value = t.estHours; return; }
    t.estHours = v;
    const load = ownerDayLoad(t.owner, t.due);
    if (t.due && t.status !== 'Done' && load > DAILY_CAPACITY) {
      toast(`Estimate set to ${v}h. ${t.owner} is now at ${load}h on ${shortDate(t.due)}, over the ${DAILY_CAPACITY}h day.`);
    } else {
      toast(`Estimate set to ${v}h for ${t.id}.`, 'success');
    }
    render();
  });

  // Command palette open + close
  document.getElementById('cmd-trigger').addEventListener('click', openCmd);
  document.getElementById('cmd-root').addEventListener('click', (e) => {
    if (e.target.matches('[data-cmd-close]')) closeCmd();
  });

  // Chat widget
  document.getElementById('chat-fab').addEventListener('click', openChat);
  document.getElementById('chat-close').addEventListener('click', closeChat);
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
