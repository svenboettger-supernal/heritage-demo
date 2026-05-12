// Heritage demo · Clients, stakeholders, opportunities, activity, documents.
// All names are fictional and Heritage-plausible. No real client data appears.

export const STAGES = [
  {
    id: 'new-lead',
    label: 'New Lead',
    description: 'Inbound captured. Initial qualification underway.',
    happyPath: [
      'Confirm source and owner',
      'Send introductory note in Heritage voice',
      'Schedule Pre-Internal call within 10 business days',
      'Tag stakeholders surfaced from inbound thread',
    ],
  },
  {
    id: 'engaged',
    label: 'Engaged',
    description: 'Pre-Internal complete. Discovery in motion.',
    happyPath: [
      'Run Pre-Internal review with notes captured',
      'Issue draft scope of work',
      'Collect stakeholder consent for IR1',
      'Schedule IR1 within 4 weeks of Pre-Internal',
    ],
  },
  {
    id: 'qualified',
    label: 'Qualified',
    description: 'IR1 complete. Scope agreed. Letter signed.',
    happyPath: [
      'Capture IR1 summary letter',
      'Land signed engagement letter',
      'Map principals, spouse, attorneys, accountants',
      'Begin asset and document inventory',
      'Set Partner Review cadence',
    ],
  },
  {
    id: 'active-client',
    label: 'Active Client',
    description: 'Engagement in production. Cadence running.',
    happyPath: [
      'Maintain IR2 cadence on schedule',
      'Update health signals weekly',
      'Surface opportunities at Partner Review',
      'Confirm book production status monthly',
      'Refresh asset sheets quarterly',
    ],
  },
  {
    id: 'churned',
    label: 'Churned',
    description: 'Engagement closed.',
    happyPath: [
      'Capture exit reason',
      'Archive vault contents',
      'Send closing letter',
    ],
  },
];

export const CUSTOMER_TYPES = {
  'hnw-family': { label: 'HNW family', viz: 'viz-3' },
  'partner-firm': { label: 'Partner-firm client', viz: 'viz-2' },
  'board': { label: 'Board', viz: 'viz-4' },
};

export const CLIENTS = [
  {
    id: 'koenigsberg',
    name: 'Koenigsberg Family',
    kicker: 'Berlin · Palm Beach',
    stage: 'active-client',
    health: 'green',
    healthReason: 'On cadence. IR2 letter delivered Tuesday. No overdue items.',
    customerType: 'hnw-family',
    owner: 'Tom Sr.',
    lastTouch: '2 days ago',
    daysInStage: 187,
    nextStep: 'Partner Review on May 22. Hank has the prep pack ready.',
    netWorthBand: '$120M – $180M',
    insight:
      "Asset sheet refresh closed last week. Spouse asked to be included on accountant calls — Foreman opened a task. Watch the Berlin holding company filing; deadline is June 14.",
    stakeholders: [
      { name: 'Klaus Koenigsberg', role: 'Principal', email: 'kk@koenigsberg.example', phone: '+49 30 …' },
      { name: 'Margit Koenigsberg', role: 'Spouse', email: 'margit@koenigsberg.example' },
      { name: 'Daniel Roth', role: 'Attorney', email: 'd.roth@rothlegal.example', firm: 'Roth Legal' },
      { name: 'Sara Bauer', role: 'Accountant', email: 'sbauer@bka.example', firm: 'Bauer Klein Associates' },
      { name: 'Henry Vasquez', role: 'Partner advisor', email: 'hv@northcrest.example', firm: 'Northcrest Wealth' },
    ],
    opportunities: [
      { name: 'Q4 insurance review', type: 'insurance', expectedRevenue: 95000, status: 'Open', owner: 'Tom Sr.', dueDate: '2026-09-30' },
      { name: 'Berlin holding restructure', type: 'expansion', expectedRevenue: 240000, status: 'Open', owner: 'Jessica', dueDate: '2026-07-15' },
    ],
    activity: [
      { type: 'meeting', date: '2026-05-10', summary: 'IR2 review with Klaus + Daniel Roth', source: 'mtg-koenigsberg-ir2', who: 'Tom Sr.' },
      { type: 'email', date: '2026-05-09', summary: 'Daniel Roth: revised draft of Berlin holding letter attached', who: 'Daniel Roth' },
      { type: 'email', date: '2026-05-07', summary: 'Margit requested CC on accountant correspondence going forward', who: 'Margit Koenigsberg' },
      { type: 'call', date: '2026-05-03', summary: '12 min call with Henry Vasquez re: Northcrest collaboration', who: 'Jessica' },
      { type: 'meeting', date: '2026-04-22', summary: 'Pre-Internal for Q2 cycle', source: 'mtg-koenigsberg-preinternal', who: 'Tom Sr.' },
    ],
    documents: [
      { name: 'Koenigsberg — Engagement Letter (2026).docx', type: 'Word', lastModified: '2026-03-04', source: 'SharePoint' },
      { name: 'Koenigsberg — Asset Sheet Q2 2026.xlsx', type: 'Excel', lastModified: '2026-05-06', source: 'SharePoint' },
      { name: 'Koenigsberg — IR2 Letter (draft).docx', type: 'Word', lastModified: '2026-05-10', source: 'SharePoint' },
      { name: 'Berlin Holding — Counsel memo.pdf', type: 'PDF', lastModified: '2026-04-30', source: 'SharePoint' },
      { name: 'Koenigsberg — Family Tree v3.pdf', type: 'PDF', lastModified: '2026-02-19', source: 'SharePoint' },
    ],
  },
  {
    id: 'whitcombe',
    name: 'Whitcombe Family Office',
    kicker: 'Greenwich, CT',
    stage: 'engaged',
    health: 'amber',
    healthReason: 'IR1 not yet scheduled. 14 days since Pre-Internal. Stakeholder consents missing.',
    customerType: 'hnw-family',
    owner: 'Jessica',
    lastTouch: '6 days ago',
    daysInStage: 21,
    nextStep: 'Need IR1 date locked this week or health turns red.',
    netWorthBand: '$60M – $90M',
    insight:
      "Pre-Internal went well but the principal's attorney is dragging on consent forms. Hank drafted a nudge — pending Jessica's approval.",
    stakeholders: [
      { name: 'Edward Whitcombe', role: 'Principal', email: 'edward@whitcombe.example' },
      { name: 'Caroline Whitcombe', role: 'Spouse', email: 'caroline@whitcombe.example' },
      { name: 'Lawrence Day', role: 'Attorney', email: 'lday@daycounsel.example', firm: 'Day Counsel' },
      { name: 'Mei Tanaka', role: 'Accountant', firm: 'Tanaka CPA' },
    ],
    opportunities: [
      { name: 'Discovery + scope (initial)', type: 'expansion', expectedRevenue: 60000, status: 'Open', owner: 'Jessica', dueDate: '2026-06-30' },
    ],
    activity: [
      { type: 'meeting', date: '2026-04-21', summary: 'Pre-Internal with Edward + Lawrence Day', who: 'Jessica' },
      { type: 'email', date: '2026-04-28', summary: 'Sent draft consent forms — no response yet', who: 'Jessica' },
      { type: 'email', date: '2026-05-05', summary: 'Follow-up to Lawrence — still pending', who: 'Jessica' },
    ],
    documents: [
      { name: 'Whitcombe — Pre-Internal notes.docx', type: 'Word', lastModified: '2026-04-21', source: 'SharePoint' },
      { name: 'Whitcombe — Draft scope.docx', type: 'Word', lastModified: '2026-04-25', source: 'SharePoint' },
    ],
  },
  {
    id: 'aldermount',
    name: 'Aldermount Holdings',
    kicker: 'Partner advisor: Northcrest Wealth',
    stage: 'qualified',
    health: 'green',
    healthReason: 'Letter signed two weeks ago. IR1 closed. Asset inventory underway.',
    customerType: 'partner-firm',
    owner: 'Ryan',
    lastTouch: '4 days ago',
    daysInStage: 18,
    nextStep: 'Asset sheet to Henry (Northcrest) by May 18.',
    netWorthBand: '$45M – $60M',
    insight:
      "Northcrest is responsive. Inventory is 60% complete. Foreman flagged a missing K-1 — task assigned to Patricia.",
    stakeholders: [
      { name: 'Robert Aldermount', role: 'Principal', email: 'ra@aldermount.example' },
      { name: 'Henry Vasquez', role: 'Partner advisor', firm: 'Northcrest Wealth' },
      { name: 'Patricia Ng', role: 'Accountant', firm: 'PNG CPA' },
    ],
    opportunities: [
      { name: 'Initial estate plan', type: 'expansion', expectedRevenue: 110000, status: 'Open', owner: 'Ryan' },
    ],
    activity: [
      { type: 'meeting', date: '2026-05-06', summary: 'IR1 with Robert and Henry', who: 'Ryan' },
      { type: 'email', date: '2026-05-08', summary: 'Henry sent over 2025 1099s', who: 'Henry Vasquez' },
    ],
    documents: [
      { name: 'Aldermount — Engagement Letter.docx', type: 'Word', lastModified: '2026-04-24', source: 'SharePoint' },
      { name: 'Aldermount — 2025 1099 packet.pdf', type: 'PDF', lastModified: '2026-05-08', source: 'SharePoint' },
    ],
  },
  {
    id: 'carrington',
    name: 'Carrington Partners',
    kicker: 'Inbound: Heritage AI website',
    stage: 'new-lead',
    health: 'green',
    healthReason: 'Captured 3 days ago. Within first-touch SLA.',
    customerType: 'partner-firm',
    owner: 'Jessica',
    lastTouch: '3 days ago',
    daysInStage: 3,
    nextStep: 'Hank drafted intro note — awaiting Jessica\'s approval.',
    insight:
      "Inbound form mentioned a $40M family in transition. The form contact is a partner-firm director; this is partner-firm flow, not direct HNW.",
    stakeholders: [
      { name: 'Diane Carrington', role: 'Partner advisor', firm: 'Carrington Partners' },
    ],
    opportunities: [],
    activity: [
      { type: 'email', date: '2026-05-09', summary: 'Inbound form: introduction request', who: 'Diane Carrington' },
    ],
    documents: [],
  },
  {
    id: 'brooks-halley',
    name: 'Brooks-Halley',
    kicker: 'Multi-generational · Newport / Houston',
    stage: 'active-client',
    health: 'red',
    healthReason: 'Partner Review missed last week. Three overdue items. Principal flagged frustration in last email.',
    customerType: 'hnw-family',
    owner: 'Tom Sr.',
    lastTouch: '8 days ago',
    daysInStage: 412,
    nextStep: 'Tom Sr. owns recovery call this week. Hank prepped talking points.',
    netWorthBand: '$200M+',
    insight:
      "This is the most important client at Heritage. Three things slipped at once: book production, the Q1 letter, and the cousin trust restructure. None of them is large alone; together they are why the principal is unhappy. Recover ground in person — do not draft outbound from here.",
    stakeholders: [
      { name: 'Margaret Brooks-Halley', role: 'Principal' },
      { name: 'Thomas Brooks-Halley', role: 'Principal (joint)' },
      { name: 'Eleanor Brooks', role: 'Spouse' },
      { name: 'James Halley', role: 'Spouse' },
      { name: 'Walter Pim', role: 'Attorney', firm: 'Pim & Whittaker' },
      { name: 'Sandra Lee', role: 'Accountant', firm: 'Lee Advisory' },
    ],
    opportunities: [
      { name: 'Cousin trust restructure', type: 'expansion', expectedRevenue: 380000, status: 'Stalled', owner: 'Tom Sr.', dueDate: '2026-07-31' },
      { name: 'Q2 insurance review', type: 'insurance', expectedRevenue: 140000, status: 'Open', owner: 'Tom Sr.', dueDate: '2026-08-15' },
    ],
    activity: [
      { type: 'email', date: '2026-05-04', summary: 'Margaret: "We need to talk about pace."', who: 'Margaret Brooks-Halley' },
      { type: 'meeting', date: '2026-04-12', summary: 'Partner Review — missed (rescheduled)', who: 'Tom Sr.' },
      { type: 'email', date: '2026-04-02', summary: 'Walter Pim flagged delays on cousin trust draft', who: 'Walter Pim' },
    ],
    documents: [
      { name: 'Brooks-Halley — Q1 Letter (still draft).docx', type: 'Word', lastModified: '2026-04-15', source: 'SharePoint' },
      { name: 'Cousin trust — Pim draft v2.docx', type: 'Word', lastModified: '2026-03-29', source: 'SharePoint' },
    ],
  },
  {
    id: 'saint-croix',
    name: 'Saint Croix Group',
    kicker: 'Board engagement',
    stage: 'active-client',
    health: 'green',
    healthReason: 'Quarterly board cadence locked. Materials always 5+ days ahead.',
    customerType: 'board',
    owner: 'Marcus',
    lastTouch: '11 days ago',
    daysInStage: 730,
    nextStep: 'Q2 board pack due May 28. Foreman has the prep tasks ready.',
    insight:
      "Quietest active engagement. Board uses the work without much back-and-forth. No drama; do not over-engineer here.",
    stakeholders: [
      { name: 'Helena Voss', role: 'Principal (Chair)' },
      { name: 'Edmund Faraday', role: 'Principal (Vice-chair)' },
      { name: 'Patricia Lin', role: 'Attorney', firm: 'Lin & Park' },
    ],
    opportunities: [
      { name: 'FY27 retainer renewal', type: 'expansion', expectedRevenue: 280000, status: 'Open', owner: 'Marcus', dueDate: '2026-11-30' },
    ],
    activity: [
      { type: 'email', date: '2026-05-01', summary: 'Quarterly board materials sent', who: 'Marcus' },
      { type: 'meeting', date: '2026-04-18', summary: 'Q1 board meeting — clean', who: 'Marcus' },
    ],
    documents: [
      { name: 'Saint Croix — Q1 board pack.pdf', type: 'PDF', lastModified: '2026-04-15', source: 'SharePoint' },
      { name: 'Saint Croix — Engagement Letter (FY26).docx', type: 'Word', lastModified: '2026-01-08', source: 'SharePoint' },
    ],
  },
  {
    id: 'helmsley',
    name: 'Helmsley Trust',
    kicker: 'Single-trustee · Aspen',
    stage: 'engaged',
    health: 'green',
    healthReason: 'Pre-Internal complete last week. IR1 scheduled May 24. Trustee responsive.',
    customerType: 'hnw-family',
    owner: 'Ryan',
    lastTouch: '5 days ago',
    daysInStage: 11,
    nextStep: 'Foreman owns IR1 prep pack — due May 22.',
    insight:
      "Single trustee, no spouse, no children. Engagement should move fast. Watch counsel responsiveness — Helmsley's outside counsel has a history of slow turnarounds with other firms.",
    stakeholders: [
      { name: 'Arthur Helmsley', role: 'Principal (sole trustee)' },
      { name: 'Vivien Wallace', role: 'Attorney', firm: 'Wallace Brent LLP' },
      { name: 'Anand Kumar', role: 'Accountant', firm: 'Kumar Tax' },
    ],
    opportunities: [
      { name: 'Initial scope', type: 'expansion', expectedRevenue: 85000, status: 'Open', owner: 'Ryan', dueDate: '2026-06-30' },
    ],
    activity: [
      { type: 'meeting', date: '2026-05-07', summary: 'Pre-Internal with Arthur + Vivien', who: 'Ryan' },
      { type: 'email', date: '2026-05-08', summary: 'Vivien sent current trust deed for review', who: 'Vivien Wallace' },
    ],
    documents: [
      { name: 'Helmsley — Current trust deed.pdf', type: 'PDF', lastModified: '2026-05-08', source: 'SharePoint' },
    ],
  },
  {
    id: 'devonshire',
    name: 'Devonshire Holdings',
    kicker: 'Partner advisor: Westshore Capital',
    stage: 'qualified',
    health: 'amber',
    healthReason: 'IR1 done but asset inventory paused. Partner-firm advisor on PTO.',
    customerType: 'partner-firm',
    owner: 'Patricia',
    lastTouch: '13 days ago',
    daysInStage: 30,
    nextStep: 'Resume asset inventory when Westshore returns May 20.',
    insight:
      "Reasonable risk — the only blocker is the partner advisor's PTO. Hank already flagged this on the morning digest two days ago. No outbound needed.",
    stakeholders: [
      { name: 'Geoffrey Devonshire', role: 'Principal' },
      { name: 'Maria Hassan', role: 'Partner advisor', firm: 'Westshore Capital' },
    ],
    opportunities: [
      { name: 'Estate transition planning', type: 'expansion', expectedRevenue: 130000, status: 'Open', owner: 'Patricia', dueDate: '2026-08-30' },
    ],
    activity: [
      { type: 'meeting', date: '2026-04-29', summary: 'IR1 with Geoffrey and Maria (Westshore)', who: 'Patricia' },
      { type: 'email', date: '2026-04-30', summary: 'Maria PTO notice — back May 20', who: 'Maria Hassan' },
    ],
    documents: [
      { name: 'Devonshire — IR1 letter.docx', type: 'Word', lastModified: '2026-04-30', source: 'SharePoint' },
    ],
  },
];

export function clientById(id) {
  return CLIENTS.find((c) => c.id === id) || null;
}

export function stageById(id) {
  return STAGES.find((s) => s.id === id) || null;
}

// Morning digest synthesised from the client list.
export const MORNING_DIGEST = {
  date: '2026-05-12',
  movers: [
    { clientId: 'helmsley', from: 'new-lead', to: 'engaged', when: '5 days ago' },
    { clientId: 'aldermount', from: 'engaged', to: 'qualified', when: '18 days ago' },
  ],
  atRisk: ['brooks-halley', 'whitcombe', 'devonshire'],
  todaysFocus: [
    { clientId: 'brooks-halley', note: 'Recovery call. Talking points prepped.' },
    { clientId: 'whitcombe', note: 'Lock IR1 date before EOD.' },
    { clientId: 'koenigsberg', note: 'Confirm Partner Review attendance for May 22.' },
  ],
};
