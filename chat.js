// Heritage demo · Scripted per-app chatbot.
// Intent matching + data-pull helpers + persistent per-app history.

import { CLIENTS, STAGES, MORNING_DIGEST, clientById, stageById } from './data/clients.js';
import { TASKS, MEETINGS, PREP_PROTOCOL, MONDAY_RUNDOWN, taskById, meetingById } from './data/work.js';
import { TICKETS, KB_ARTICLES, PERSONAS, PERFORMANCE, ticketById } from './data/support.js';

/* ── Bot metadata ────────────────────────────────────────── */

export const BOTS = {
  hank: {
    id: 'hank',
    name: 'Hank',
    sub: 'CRM',
    initial: 'H',
    accentClass: 'app-icon--hank',
    avatar: 'assets/hank.png',
    welcome:
      'Hi, I\'m Hank, your CRM. Try: "Where are we on Koenigsberg?" or "Who\'s at risk?"',
    starters: () => [
      'Where are we on Koenigsberg?',
      "Who's at risk?",
    ],
  },
  foreman: {
    id: 'foreman',
    name: 'Foreman',
    sub: 'Project Manager',
    initial: 'F',
    accentClass: 'app-icon--foreman',
    avatar: 'assets/rex-foreman.jpg',
    welcome:
      'Hi, I\'m Foreman, your project manager. Try: "Rundown on Koenigsberg" or "What\'s overdue this week?"',
    starters: () => [
      'Rundown on Koenigsberg',
      "What's overdue this week?",
    ],
  },
  sam: {
    id: 'sam',
    name: 'Celeste',
    sub: 'Client Concierge',
    initial: 'C',
    accentClass: 'app-icon--sam',
    avatar: 'assets/celeste.png',
    welcome:
      'Hi, I\'m Celeste, your client concierge. Try: "What\'s escalated?" or "Containment rate this month."',
    starters: () => [
      "What's escalated?",
      'Containment rate this month',
    ],
  },
};

/* ── History store (in-memory per session) ──────────────── */

const histories = { hank: [], foreman: [], sam: [] };

export function getHistory(app) { return histories[app] || (histories[app] = []); }

export function appendMessage(app, msg) {
  if (!histories[app]) histories[app] = [];
  histories[app].push(msg);
}

export function resetHistory(app) { histories[app] = []; }

/* ── Helpers ────────────────────────────────────────────── */

function lc(s) { return (s || '').toLowerCase(); }

function wordMatch(text, word) {
  const t = lc(text);
  const w = lc(word);
  if (!w) return 0;
  if (t.includes(w)) return w.length > 4 ? 2 : 1;
  return 0;
}

function scoreIntent(intent, text) {
  let score = 0;
  for (const kw of intent.keywords) {
    score += wordMatch(text, kw);
  }
  return score;
}

function findClientByName(text) {
  const t = lc(text);
  let best = null;
  let bestScore = 0;
  for (const c of CLIENTS) {
    const name = lc(c.name);
    // last name match
    const lastWord = name.split(/\s+/).pop();
    if (lastWord && t.includes(lastWord) && lastWord.length > 3) {
      const score = lastWord.length;
      if (score > bestScore) { best = c; bestScore = score; }
    }
    // full name match
    if (t.includes(name)) return c;
    // id match
    if (t.includes(c.id)) return c;
  }
  return best;
}

function findTaskByText(text) {
  const t = lc(text);
  const idMatch = t.match(/t-?\d{3,4}/);
  if (idMatch) {
    const id = idMatch[0].replace(/^t-?/, 'T-').replace('-', '-');
    const found = TASKS.find((x) => lc(x.id) === lc(id));
    if (found) return found;
  }
  return null;
}

function findTicketByText(text) {
  const t = lc(text);
  const idMatch = t.match(/h-?\d{3,4}/);
  if (idMatch) {
    const id = idMatch[0].toUpperCase().replace(/^H-?/, 'H-');
    const found = TICKETS.find((x) => lc(x.id) === lc(id));
    if (found) return found;
  }
  return null;
}

/* ── Snapshot builders ──────────────────────────────────── */

function clientSnapshot(c) {
  const stage = stageById(c.stage);
  const healthLabel = c.health === 'green' ? 'On Track' : c.health === 'amber' ? 'At Risk' : 'Critical';
  const reply = `**${c.name}** is in stage **${stage.label}** and health is **${healthLabel}**. ${c.healthReason}\n\n**Next step:** ${c.nextStep}\n\n**Owner:** ${c.owner} · **Days in stage:** ${c.daysInStage} · **Last touch:** ${c.lastTouch}`;
  const citations = [
    { label: `Client record · ${c.name}`, href: `#/hank/clients/${c.id}?client=${c.id}` },
  ];
  const recentMeeting = MEETINGS.find((m) => m.clientId === c.id);
  if (recentMeeting) citations.push({ label: `Meeting · ${recentMeeting.title}`, href: `#/foreman/meetings/${recentMeeting.id}?client=${c.id}` });
  if (c.activity[0]) citations.push({ label: `Activity · ${c.activity[0].type[0].toUpperCase() + c.activity[0].type.slice(1)} ${c.activity[0].date}`, href: `#/hank/clients/${c.id}?tab=activity&client=${c.id}` });
  return { reply, citations };
}

function taskSnapshot(t) {
  const c = t.clientId ? clientById(t.clientId) : null;
  const reply = `**${t.title}** (${t.id})\n\nStatus: **${t.status}** · Priority: **${t.priority}** · Owner: **${t.owner}** · Due: **${t.due || '—'}**\n\n${t.description}`;
  const citations = [
    { label: `Task · ${t.id}`, href: `#/foreman/tasks/${t.id}${c ? '?client=' + c.id : ''}` },
  ];
  if (c) citations.push({ label: `Client · ${c.name}`, href: `#/hank/clients/${c.id}?client=${c.id}` });
  return { reply, citations };
}

function ticketSnapshot(tk) {
  const c = tk.clientId ? clientById(tk.clientId) : null;
  const persona = PERSONAS[tk.persona]?.label || tk.persona;
  const reply = `**${tk.subject}** (${tk.id})\n\nStatus: **${tk.status}** · Priority: **${tk.priority}** · Assignee: **${tk.assignee}** · Persona: **${persona}**\n\nSentiment: ${tk.sentiment} · SLA: ${tk.slaTimer} · Age: ${tk.age}\n\nLast: "${tk.lastAIResponse}"`;
  const citations = [
    { label: `Ticket · ${tk.id}`, href: `#/sam/tickets/${tk.id}${c ? '?client=' + c.id : ''}` },
  ];
  if (c) citations.push({ label: `Client · ${c.name}`, href: `#/hank/clients/${c.id}?client=${c.id}` });
  return { reply, citations };
}

/* ── Aggregate builders ─────────────────────────────────── */

function atRiskSummary() {
  const risky = CLIENTS.filter((c) => c.health !== 'green');
  const lines = risky.map((c) => {
    const dot = c.health === 'red' ? '🔴' : '🟠';
    return `${dot} **${c.name}** — ${c.healthReason}`;
  });
  return {
    reply: `${risky.length} client${risky.length === 1 ? '' : 's'} off green:\n\n${lines.join('\n')}`,
    citations: risky.map((c) => ({ label: c.name, href: `#/hank/clients/${c.id}?client=${c.id}` })),
  };
}

function morningDigestSummary() {
  const d = MORNING_DIGEST;
  const movers = d.movers.map((m) => `${clientById(m.clientId).name} → ${stageById(m.to).label}`).join(', ');
  const atRisk = d.atRisk.map((id) => clientById(id).name).join(', ');
  const focus = d.todaysFocus.map((f) => `${clientById(f.clientId).name}: ${f.note}`).join('\n');
  return {
    reply: `**Today's digest**\n\n**Movers:** ${movers}\n**At risk:** ${atRisk}\n\n**Focus:**\n${focus}`,
    citations: [{ label: 'Morning digest', href: '#/hank/digest' }],
  };
}

function newLeadsSummary() {
  const leads = CLIENTS.filter((c) => c.stage === 'new-lead');
  if (leads.length === 0) return { reply: 'No new leads currently open.', citations: [] };
  return {
    reply: `${leads.length} new lead${leads.length === 1 ? '' : 's'}:\n\n` + leads.map((c) => `• **${c.name}** — ${c.healthReason}\n  Owner: ${c.owner} · ${c.lastTouch}`).join('\n'),
    citations: leads.map((c) => ({ label: c.name, href: `#/hank/clients/${c.id}?client=${c.id}` })),
  };
}

function opportunitiesSummary() {
  const opens = CLIENTS.flatMap((c) => c.opportunities.filter((o) => o.status !== 'Closed').map((o) => ({ ...o, clientName: c.name, clientId: c.id })));
  const total = opens.reduce((acc, o) => acc + (o.expectedRevenue || 0), 0);
  const lines = opens.map((o) => `• **${o.clientName}** — ${o.name} (${o.type}) · $${(o.expectedRevenue || 0).toLocaleString()} · ${o.status}`);
  return {
    reply: `**${opens.length} open opportunities** · estimated pipeline ≈ **$${Math.round(total / 1000)}K**\n\n${lines.join('\n')}`,
    citations: opens.slice(0, 4).map((o) => ({ label: `${o.clientName} opps`, href: `#/hank/clients/${o.clientId}?tab=opportunities&client=${o.clientId}` })),
  };
}

function stagesSummary() {
  return {
    reply: STAGES.filter((s) => s.id !== 'churned').map((s, i) => {
      const count = CLIENTS.filter((c) => c.stage === s.id).length;
      return `**${i + 1}. ${s.label}** (${count}) — ${s.description}`;
    }).join('\n\n'),
    citations: [{ label: 'Stages & happy paths', href: '#/hank/stages' }],
  };
}

function stakeholdersFor(c) {
  return {
    reply: `**${c.name}** stakeholders:\n\n${c.stakeholders.map((s) => `• **${s.name}** — ${s.role}${s.firm ? ' · ' + s.firm : ''}`).join('\n')}`,
    citations: [{ label: 'Stakeholders tab', href: `#/hank/clients/${c.id}?tab=stakeholders&client=${c.id}` }],
  };
}

function overdueTasks(today = new Date('2026-05-12')) {
  const overdue = TASKS.filter((t) => t.status !== 'Done' && t.due && new Date(t.due) < today);
  if (overdue.length === 0) return { reply: 'Nothing overdue. Everything else is in flight.', citations: [] };
  return {
    reply: `${overdue.length} task${overdue.length === 1 ? '' : 's'} overdue:\n\n` + overdue.map((t) => `• **${t.title}** (${t.id}) — owner ${t.owner} · due ${t.due} · ${t.status}`).join('\n'),
    citations: overdue.slice(0, 4).map((t) => ({ label: t.id, href: `#/foreman/tasks/${t.id}` })),
  };
}

function slippedThisWeek() {
  const today = new Date('2026-05-12');
  const sevenDaysAgo = new Date('2026-05-05');
  const slipped = TASKS.filter((t) => {
    if (t.status === 'Done') return false;
    if (!t.due) return false;
    const d = new Date(t.due);
    return d < today && d >= sevenDaysAgo;
  }).concat(TASKS.filter((t) => t.labels.includes('overdue')));
  const unique = Array.from(new Map(slipped.map((t) => [t.id, t])).values());
  return {
    reply: `${unique.length} item${unique.length === 1 ? '' : 's'} slipped:\n\n` + unique.map((t) => `• **${t.title}** (${t.id}) — ${t.status} · owner ${t.owner}`).join('\n'),
    citations: unique.slice(0, 4).map((t) => ({ label: t.id, href: `#/foreman/tasks/${t.id}` })),
  };
}

function tasksByOwner(owner) {
  const owned = TASKS.filter((t) => lc(t.owner) === lc(owner) && t.status !== 'Done');
  if (owned.length === 0) return { reply: `No open tasks for ${owner}.`, citations: [] };
  return {
    reply: `**${owner}** has ${owned.length} open task${owned.length === 1 ? '' : 's'}:\n\n` + owned.map((t) => `• **${t.title}** (${t.id}) · ${t.status} · due ${t.due}`).join('\n'),
    citations: owned.slice(0, 4).map((t) => ({ label: t.id, href: `#/foreman/tasks/${t.id}` })),
  };
}

function ownerWorkloadSummary() {
  const open = TASKS.filter((t) => t.status !== 'Done');
  const counts = {};
  open.forEach((t) => { counts[t.owner] = (counts[t.owner] || 0) + 1; });
  const ranked = Object.entries(counts).sort(([, a], [, b]) => b - a);
  return {
    reply: `Open task counts by owner:\n\n${ranked.map(([o, n]) => `• **${o}** — ${n}`).join('\n')}`,
    citations: [{ label: 'All tasks', href: '#/foreman/tasks' }],
  };
}

function upcomingMeetings() {
  const today = new Date('2026-05-12');
  const upcoming = MEETINGS.filter((m) => new Date(m.date) >= today).sort((a, b) => a.date < b.date ? -1 : 1);
  if (upcoming.length === 0) return { reply: 'Nothing scheduled.', citations: [] };
  return {
    reply: `${upcoming.length} upcoming meeting${upcoming.length === 1 ? '' : 's'}:\n\n` + upcoming.map((m) => `• **${m.title}** — ${m.date} ${m.time || ''} · status ${m.status}`).join('\n'),
    citations: upcoming.slice(0, 4).map((m) => ({ label: m.title, href: `#/foreman/meetings/${m.id}` })),
  };
}

function prepCadence() {
  const lines = PREP_PROTOCOL.map((p) => {
    const c = clientById(p.clientId);
    const flag = p.milestones.some((m) => m.status === 'Slipped') ? '🔴' : p.milestones.some((m) => m.status === 'At Risk') ? '🟠' : '🟢';
    const next = p.milestones.find((m) => m.status === 'On Track' || m.status === 'Upcoming' || m.status === 'At Risk' || m.status === 'Slipped');
    return `${flag} **${c.name}** — next: ${next ? next.name + ' (' + next.status + ')' : '—'}`;
  });
  return {
    reply: `Prep cadence across engagements:\n\n${lines.join('\n')}`,
    citations: [{ label: 'Prep protocol', href: '#/foreman/prep' }],
  };
}

function rundownSummary() {
  const r = MONDAY_RUNDOWN;
  const green = r.rows.filter((x) => x.status === 'green').length;
  const amber = r.rows.filter((x) => x.status === 'amber').length;
  const red = r.rows.filter((x) => x.status === 'red').length;
  return {
    reply: `**Monday rundown**: 🟢 ${green} on track · 🟠 ${amber} at risk · 🔴 ${red} critical.\n\n**Top risks:**\n${r.topRisks.map((tr) => `• **${tr.risk}** — ${tr.action}`).join('\n')}`,
    citations: [{ label: 'Monday rundown', href: '#/foreman/rundown' }, ...r.topRisks.map((tr) => ({ label: clientById(tr.clientId).name, href: `#/hank/clients/${tr.clientId}?client=${tr.clientId}` }))],
  };
}

function escalatedSummary() {
  const escalated = TICKETS.filter((t) => t.status === 'Escalated' || t.status === 'Human takeover');
  if (escalated.length === 0) return { reply: 'No tickets escalated right now.', citations: [] };
  return {
    reply: `${escalated.length} ticket${escalated.length === 1 ? '' : 's'} need a human:\n\n` + escalated.map((t) => `• **${t.id}** — ${t.subject}\n  Assignee: ${t.assignee} · ${t.slaTimer} · sentiment ${t.sentiment}`).join('\n'),
    citations: escalated.map((t) => ({ label: t.id, href: `#/sam/tickets/${t.id}` })),
  };
}

function agedTickets(hours = 24) {
  const aged = TICKETS.filter((t) => {
    const age = t.age || '';
    if (age.includes('d')) return true; // day-aged
    const h = parseInt(age, 10);
    return !isNaN(h) && h >= hours;
  });
  if (aged.length === 0) return { reply: `No tickets older than ${hours}h.`, citations: [] };
  return {
    reply: `${aged.length} ticket${aged.length === 1 ? '' : 's'} aged ≥ ${hours}h:\n\n` + aged.map((t) => `• **${t.id}** — ${t.subject} · ${t.age} · ${t.status}`).join('\n'),
    citations: aged.slice(0, 4).map((t) => ({ label: t.id, href: `#/sam/tickets/${t.id}` })),
  };
}

function containmentSummary() {
  const p = PERFORMANCE;
  return {
    reply: `**${p.monthLabel}**\n\n• **Containment** — ${Math.round(p.containmentRate * 100)}% (${p.containmentRateTrend})\n• **CSAT** — ${p.csat} / 5 (${p.csatTrend})\n• **Volume** — ${p.volumeByPersona.reduce((a, b) => a + b.count, 0)} conversations\n\n**Top escalation reasons:**\n${p.escalationsByReason.slice(0, 3).map((r) => `• ${r.reason} — ${r.count}`).join('\n')}`,
    citations: [{ label: 'Performance report', href: '#/sam/report' }],
  };
}

function kbConflictsSummary() {
  const conflicts = KB_ARTICLES.filter((a) => a.hasConflict);
  if (conflicts.length === 0) return { reply: 'No KB conflicts open.', citations: [] };
  return {
    reply: `${conflicts.length} KB article${conflicts.length === 1 ? '' : 's'} with conflicts:\n\n` + conflicts.map((a) => `• **${a.title}** (v${a.version}) — ${a.conflictNote}\n  Owner: ${a.editorialOwner}`).join('\n'),
    citations: [{ label: 'Knowledge base', href: '#/sam/kb' }],
  };
}

function ticketsByClient(c) {
  const tt = TICKETS.filter((t) => t.clientId === c.id);
  if (tt.length === 0) return { reply: `No tickets logged for **${c.name}**.`, citations: [] };
  return {
    reply: `**${c.name}** has ${tt.length} ticket${tt.length === 1 ? '' : 's'}:\n\n` + tt.map((t) => `• **${t.id}** — ${t.subject} · ${t.status}`).join('\n'),
    citations: tt.map((t) => ({ label: t.id, href: `#/sam/tickets/${t.id}?client=${c.id}` })),
  };
}

function sentimentSummary() {
  const counts = { positive: 0, neutral: 0, frustrated: 0 };
  TICKETS.forEach((t) => { counts[t.sentiment] = (counts[t.sentiment] || 0) + 1; });
  return {
    reply: `Sentiment across ${TICKETS.length} tickets:\n\n• 🙂 Positive — ${counts.positive}\n• 😐 Neutral — ${counts.neutral}\n• 😟 Frustrated — ${counts.frustrated}`,
    citations: [{ label: 'All tickets', href: '#/sam/tickets' }],
  };
}

/* ── Intent libraries ──────────────────────────────────── */

const HANK_INTENTS = [
  { keywords: ['at risk', 'risky', 'amber', 'red', 'health', 'concerns'], handler: () => atRiskSummary() },
  { keywords: ['digest', 'morning', "today's", 'today'], handler: () => morningDigestSummary() },
  { keywords: ['new lead', 'leads', 'inbound', 'fresh'], handler: () => newLeadsSummary() },
  { keywords: ['opportunity', 'opportunities', 'opps', 'pipeline value', 'revenue'], handler: () => opportunitiesSummary() },
  { keywords: ['stage', 'stages', 'happy path', 'happy-path', 'checklist'], handler: () => stagesSummary() },
  {
    keywords: ['draft', 'outbound', 'follow up', 'follow-up', 'followup', 'write', 'email'],
    handler: (ctx) => {
      const c = findClientByName(ctx.text) || (ctx.followingClient && clientById(ctx.followingClient)) || clientById('whitcombe');
      return {
        reply: `Drafting an outbound to **${c.name}** in Heritage voice. Citations are pulled from the record. Hank routes the draft to ${c.owner} for approval before send.`,
        citations: [{ label: `Open draft for ${c.name}`, href: '#', action: { type: 'open-draft', clientId: c.id } }],
      };
    },
  },
  {
    keywords: ['stakeholder', 'stakeholders', 'principal', 'spouse', 'attorney', 'accountant', 'advisor'],
    handler: (ctx) => {
      const c = findClientByName(ctx.text) || (ctx.followingClient && clientById(ctx.followingClient));
      if (!c) return null;
      return stakeholdersFor(c);
    },
  },
  {
    keywords: ['next step', 'next', 'what now', 'what to do'],
    handler: (ctx) => {
      const c = findClientByName(ctx.text) || (ctx.followingClient && clientById(ctx.followingClient));
      if (!c) return null;
      return {
        reply: `**${c.name}** — next step: ${c.nextStep}`,
        citations: [{ label: `Client record · ${c.name}`, href: `#/hank/clients/${c.id}?client=${c.id}` }],
      };
    },
  },
];

const FOREMAN_INTENTS = [
  { keywords: ['slip', 'slipped', 'overdue', 'late', 'missed', 'this week'], handler: () => slippedThisWeek() },
  { keywords: ['overdue', 'late', 'behind'], handler: () => overdueTasks() },
  { keywords: ['workload', 'capacity', 'who has', 'most tasks', 'busy', 'plate'], handler: () => ownerWorkloadSummary() },
  { keywords: ['meeting', 'meetings', 'upcoming', 'calendar', 'agenda', 'schedule'], handler: () => upcomingMeetings() },
  { keywords: ['prep', 'cadence', 'protocol', 'ir1', 'ir2', 'partner review', 'pre-internal'], handler: () => prepCadence() },
  { keywords: ['rundown', 'monday', 'risks', 'top risks'], handler: () => rundownSummary() },
  {
    keywords: ['my tasks', "i have", "what's on my", 'plate today', 'today'],
    handler: (ctx) => tasksByOwner('Tom Sr.'),
  },
];

const SAM_INTENTS = [
  { keywords: ['escalat', 'escalated', 'escalation', 'human takeover', 'need a human'], handler: () => escalatedSummary() },
  { keywords: ['aged', 'old', '24', '24h', 'over a day', 'long', 'older'], handler: () => agedTickets() },
  { keywords: ['containment', 'csat', 'performance', 'monthly', 'this month', 'metric'], handler: () => containmentSummary() },
  { keywords: ['kb', 'knowledge base', 'conflict', 'conflicts', 'article'], handler: () => kbConflictsSummary() },
  { keywords: ['sentiment', 'frustrated', 'angry', 'happy', 'mood'], handler: () => sentimentSummary() },
  {
    keywords: ['tickets for', 'tickets about', 'tickets on'],
    handler: (ctx) => {
      const c = findClientByName(ctx.text) || (ctx.followingClient && clientById(ctx.followingClient));
      if (!c) return null;
      return ticketsByClient(c);
    },
  },
];

/* ── Public: matchIntent ───────────────────────────────── */

export function matchIntent(app, text, context = {}) {
  const ctx = { text, ...context };
  const lib = app === 'hank' ? HANK_INTENTS : app === 'foreman' ? FOREMAN_INTENTS : SAM_INTENTS;

  // Specific record lookups first (high-confidence)
  if (app === 'hank') {
    const c = findClientByName(text);
    if (c) {
      // Only use this if no other intent scores high enough to override
      const bestIntent = lib
        .map((i) => ({ i, score: scoreIntent(i, text) }))
        .sort((a, b) => b.score - a.score)[0];
      if (!bestIntent || bestIntent.score < 3) return clientSnapshot(c);
    }
  }
  if (app === 'foreman') {
    const t = findTaskByText(text);
    if (t) return taskSnapshot(t);
    const m = MEETINGS.find((mm) => lc(text).includes(lc(mm.title)) || lc(text).includes(lc(mm.id)));
    if (m) {
      const c = m.clientId ? clientById(m.clientId) : null;
      return {
        reply: `**${m.title}** (${m.id}) — ${m.type} on ${m.date} ${m.time || ''}.\n\nStatus: **${m.status}**\nAttendees: ${m.attendees.join(', ')}\n\n${m.summaryLetter ? 'Summary letter: ' + (m.summaryLetter.sent ? 'sent ' + m.summaryLetter.sent : 'drafted ' + m.summaryLetter.drafted) : 'No letter yet.'}`,
        citations: [
          { label: `Meeting · ${m.id}`, href: `#/foreman/meetings/${m.id}${c ? '?client=' + c.id : ''}` },
          ...(c ? [{ label: `Client · ${c.name}`, href: `#/hank/clients/${c.id}?client=${c.id}` }] : []),
        ],
      };
    }
    // owner lookup
    const owners = ['Tom Sr.', 'Jessica', 'Ryan', 'Patricia', 'Marcus', 'Henry', 'Diane'];
    for (const o of owners) {
      if (lc(text).includes(lc(o.split(' ')[0])) && (lc(text).includes('task') || lc(text).includes('plate') || lc(text).includes('owns'))) {
        return tasksByOwner(o);
      }
    }
  }
  if (app === 'sam') {
    const tk = findTicketByText(text);
    if (tk) return ticketSnapshot(tk);
  }

  // Intent library matching
  const ranked = lib
    .map((i) => ({ i, score: scoreIntent(i, text) }))
    .sort((a, b) => b.score - a.score);
  const top = ranked[0];
  if (top && top.score > 0) {
    const handlerResult = top.i.handler(ctx);
    if (handlerResult) return handlerResult;
  }

  // Fallback
  const bot = BOTS[app];
  return {
    reply: `I can answer about ${app === 'hank' ? 'clients, stages, opportunities, the morning digest, and drafting outbound' : app === 'foreman' ? 'tasks, meetings, prep cadence, slippage, and owner workloads' : 'tickets, escalations, containment, KB conflicts, and sentiment'}. Try one of the suggestions below.`,
    citations: [],
    quickReplies: bot.starters(),
  };
}

/* ── Public: suggested replies (context-aware) ─────────── */

export function suggestedReplies(app, context = {}) {
  const followingClient = context.followingClient ? clientById(context.followingClient) : null;
  const bot = BOTS[app];
  // If a client is being followed, prepend client-specific prompts
  if (followingClient) {
    if (app === 'hank') return [
      `Status of ${followingClient.name}`,
      `Who are ${followingClient.name}'s stakeholders?`,
      `Draft a follow-up to ${followingClient.name}`,
      `Next step for ${followingClient.name}`,
    ];
    if (app === 'foreman') return [
      `Open tasks for ${followingClient.name}`,
      `Prep cadence for ${followingClient.name}`,
      `Meetings with ${followingClient.name}`,
      'What slipped this week?',
    ];
    if (app === 'sam') return [
      `Tickets for ${followingClient.name}`,
      "What's escalated right now?",
      'Containment rate this month',
      'Any KB conflicts?',
    ];
  }
  return bot.starters();
}

/* ── For Foreman: open tasks for a specific client ─────── */

if (typeof globalThis !== 'undefined') {
  // attach helpers in case render code wants them (kept off the export surface)
}
