// Heritage demo · Clients, stakeholders, opportunities, activity, documents.

export const STAGES = [
  {
    id: 'new-lead',
    label: 'New Lead',
    description: 'Prospect identified via referral. Approach call pending.',
    happyPath: [
      'Confirm referral source and partner lead (Sr/Jr)',
      'Tom Sr. or junior partner makes approach call within 10 business days',
      'Schedule PIR once principal confirms interest',
      'Tag referral partner (NEPWM, Tiger 21, DelPrete, etc.) for attribution',
    ],
  },
  {
    id: 'engaged',
    label: 'Engaged',
    description: 'PIR complete. Phase I in motion. Working toward Engagement Letter.',
    happyPath: [
      'Hold PIR with principal',
      'Send Engagement Letter and Confidentiality Agreement',
      'Receive executed Engagement Letter and Phase I payment',
      'Schedule IR1 within 4 weeks of PIR',
    ],
  },
  {
    id: 'qualified',
    label: 'Qualified',
    description: 'Engagement Letter signed. Phase II in production. Asset Sheet and valuations underway.',
    happyPath: [
      'Send Phase II Letter and invoice',
      'Run IR1 and capture Meeting Letter',
      'Receive Phase II payment',
      'Begin Asset Sheet and Flow Diagram production',
      'Schedule IR2 once valuations complete',
    ],
  },
  {
    id: 'active-client',
    label: 'Active Client',
    description: 'Phase III. Annual renewal cycle. Ongoing IR cadence and AI Platform integration.',
    happyPath: [
      'Maintain IR2/IR3 cadence on schedule',
      'Issue Annual Renewal Engagement Letter at anniversary',
      'Refresh Asset Sheet quarterly',
      'Track AI Platform uploads (Data Sheet, Asset Sheet, Insurance Sheet, Flow/EDC)',
      'Surface insurance and planning opportunities at each IR',
    ],
  },
  {
    id: 'churned',
    label: 'Churned',
    description: 'Engagement closed or dormant.',
    happyPath: [
      'Capture last-known status and reason',
      'Archive in Dormant Clients log',
      'Send closing letter only if engagement explicitly terminated',
    ],
  },
];

export const CUSTOMER_TYPES = {
  'hnw-family': { label: 'HNW family', viz: 'viz-3' },
  'partner-firm': { label: 'Referral-firm client', viz: 'viz-2' },
  'board': { label: 'Family office', viz: 'viz-4' },
};

export const CLIENTS = [
  {
    id: 'koenigsberg',
    name: 'Koenigsberg Family',
    kicker: 'Long Island, NY · Palm Beach, FL',
    stage: 'active-client',
    health: 'green',
    healthReason: 'On cadence. IR2 Meeting Letter delivered May 10. Q2 Renewal cycle ahead of schedule.',
    customerType: 'hnw-family',
    owner: 'Tom Sr.',
    lastTouch: '2026-05-10',
    daysInStage: 412,
    nextStep: 'IR3 May 22 with Craig + Yvonne. Foreman has the prep pack ready.',
    netWorthBand: '$80M to $120M',
    insight:
      "Craig is one of our most loyal clients. He owns the CLK building Heritage operates out of. Yvonne Hernandez (his office manager) is the day-to-day point of contact. Q2 cycle is on track. Watch the Jake insurance discussion: that's the live $50M+ opportunity Tom Sr. has been advancing with Eugene Koenigsberg since January.",
    stakeholders: [
      { name: 'Craig Koenigsberg', role: 'Principal' },
      { name: 'Yvonne Hernandez', role: 'Office manager / POC', email: 'yhernandez@clk.example' },
      { name: 'Eugene Koenigsberg', role: 'Son' },
      { name: 'Jake Koenigsberg', role: 'Son (life insurance subject)' },
      { name: 'Keith Meltzer', role: 'Estate attorney', firm: 'Meltzer Lippe' },
    ],
    opportunities: [
      { name: 'Jake Koenigsberg life insurance ($50M)', type: 'insurance', expectedRevenue: 250000, status: 'Open', owner: 'Tom Sr.', dueDate: '2026-09-30' },
      { name: 'Q2 Asset Sheet refresh', type: 'expansion', expectedRevenue: 0, status: 'Open', owner: 'Tom Jr.', dueDate: '2026-06-15' },
    ],
    activity: [
      { type: 'meeting', date: '2026-05-10', summary: 'IR2 with Craig + Yvonne · Q2 Renewal cycle', source: 'mtg-koenigsberg-ir2', who: 'Tom Sr.' },
      { type: 'email', date: '2026-04-24', summary: 'Yvonne sent updated asset list for Q2 refresh', who: 'Yvonne Hernandez' },
      { type: 'meeting', date: '2026-04-21', summary: 'Eugene + Jake meeting to discuss life insurance options', who: 'Tom Sr.' },
      { type: 'email', date: '2026-04-09', summary: 'Reply received · Yvonne confirmed the updated asset list is on its way for the Q2 refresh', who: 'Hank · auto-logged, last touch updated' },
      { type: 'email', date: '2026-04-07', summary: 'Quarterly email sent · Q1 2026 client update', who: 'Hank via Outlook' },
      { type: 'meeting', date: '2026-03-04', summary: 'PIR / Q2 cycle opener', source: 'mtg-koenigsberg-preinternal', who: 'Tom Sr.' },
      { type: 'meeting', date: '2026-01-21', summary: 'Koenigsberg Scout Call · Jake insurance approach', who: 'Tom Sr.' },
    ],
    documents: [
      { name: 'Koenigsberg Annual Renewal Engagement Letter 2026.docx', type: 'Word', lastModified: '2026-01-15', source: 'SharePoint' },
      { name: 'Koenigsberg Asset Sheet Q1 2026.xlsx', type: 'Excel', lastModified: '2026-04-24', source: 'SharePoint' },
      { name: 'Koenigsberg Meeting Letter 1-21-2026.docx', type: 'Word', lastModified: '2026-01-28', source: 'SharePoint' },
      { name: 'Koenigsberg Flow Diagram v4.pdf', type: 'PDF', lastModified: '2026-03-04', source: 'SharePoint' },
      { name: 'Koenigsberg Confidentiality Agreement (AI Platform).pdf', type: 'PDF', lastModified: '2025-10-29', source: 'SharePoint' },
    ],
  },
  {
    id: 'whitcombe',
    name: 'Mills Family',
    kicker: 'Roslyn, NY · 3 brothers · NEPWM/Filone referral',
    stage: 'qualified',
    health: 'amber',
    healthReason: 'Phase II in motion for all 3 brothers. Valuations not complete. IRA beneficiary changes pending at NEPWM.',
    customerType: 'hnw-family',
    owner: 'Jess',
    lastTouch: '2026-05-07',
    daysInStage: 87,
    nextStep: 'Diane forwarding executed apps to carrier. NEPWM to confirm IRA beneficiary updates by May 13.',
    netWorthBand: '$60M to $90M',
    insight:
      "Three brothers (John, Matt, Vic) all in Phase II simultaneously. NEPWM/Filone referral. Diane has been the back-office workhorse: sent apps Feb 17, signed apps received March 9. Valuations not complete; if one brother's valuation slips, all three are blocked. The carrier change at NEPWM is the active risk.",
    stakeholders: [
      { name: 'John Mills', role: 'Principal (brother 1)' },
      { name: 'Matt Mills', role: 'Principal (brother 2)' },
      { name: 'Vic Mills', role: 'Principal (brother 3)' },
      { name: 'Jeff Filone', role: 'Referral partner', firm: 'NEPWM' },
      { name: 'Diane', role: 'Heritage ops · application processing' },
    ],
    opportunities: [
      { name: 'Mills 3-brother Phase II insurance package', type: 'insurance', expectedRevenue: 420000, status: 'Open', owner: 'Jess', dueDate: '2026-06-30' },
    ],
    activity: [
      { type: 'meeting', date: '2026-04-23', summary: 'IR2 with John Mills · investment options', who: 'Jess' },
      { type: 'meeting', date: '2026-04-21', summary: 'IR2 with Matt Mills · valuations review', who: 'Jess' },
      { type: 'email', date: '2026-04-22', summary: 'NEPWM confirming IRA beneficiary updates for Vic', who: 'Jeff Filone' },
      { type: 'email', date: '2026-04-07', summary: 'Quarterly email sent · Q1 2026 client update', who: 'Hank via Outlook' },
      { type: 'meeting', date: '2026-03-24', summary: 'Vic Mills · valuations meeting', who: 'Jess' },
    ],
    documents: [
      { name: 'Mills Engagement Letter 2026.docx', type: 'Word', lastModified: '2026-02-12', source: 'SharePoint' },
      { name: 'Mills Phase II Letter.docx', type: 'Word', lastModified: '2026-03-15', source: 'SharePoint' },
      { name: 'Mills Asset Sheet (3 brothers) Q1 2026.xlsx', type: 'Excel', lastModified: '2026-04-20', source: 'SharePoint' },
      { name: 'Mills Flow Diagram v2.pdf', type: 'PDF', lastModified: '2026-04-15', source: 'SharePoint' },
    ],
  },
  {
    id: 'aldermount',
    name: 'Garten Family',
    kicker: 'Manhattan / Palm Beach · Larry Glick referral',
    stage: 'qualified',
    health: 'green',
    healthReason: 'MH engagement letter executed March 28. Flow Diagram in production at MH. Phase II Asset Sheet uploaded to AI.',
    customerType: 'partner-firm',
    owner: 'Jess',
    lastTouch: '2026-05-08',
    daysInStage: 64,
    nextStep: 'MH delivers Flow Diagram week of May 18. Tom Jr. to review before sharing with Alan.',
    netWorthBand: '$100M to $150M',
    insight:
      "Alan Garten is a Phase II client referred by Larry Glick. MH (the planning firm) is drafting the Flow Diagram; Heritage coordinates and reviews. Asset Sheet uploaded to AI Platform in prep for initial presentation. Larry Glick is also a P2 Heritage client. Keep messaging consistent across both.",
    stakeholders: [
      { name: 'Alan Garten', role: 'Principal' },
      { name: 'Larry Glick', role: 'Referral partner / Heritage client' },
      { name: 'MH planning team', role: 'External planning firm', firm: 'Mehlman Hubbard' },
    ],
    opportunities: [
      { name: 'Garten Phase II planning package', type: 'expansion', expectedRevenue: 240000, status: 'Open', owner: 'Jess', dueDate: '2026-07-31' },
    ],
    activity: [
      { type: 'email', date: '2026-04-07', summary: 'Quarterly email sent · Q1 2026 client update', who: 'Hank via Outlook' },
      { type: 'email', date: '2026-04-07', summary: 'Flow Diagram sent to MH to begin drafting', who: 'Tom Jr.' },
      { type: 'email', date: '2026-03-28', summary: 'MH executed engagement letter received', who: 'MH' },
      { type: 'meeting', date: '2026-03-02', summary: 'IR1 with Alan Garten', source: 'mtg-aldermount-ir1', who: 'Tom Sr.' },
    ],
    documents: [
      { name: 'Garten Engagement Letter 2026.docx', type: 'Word', lastModified: '2026-02-15', source: 'SharePoint' },
      { name: 'Garten Phase II Letter.docx', type: 'Word', lastModified: '2026-03-10', source: 'SharePoint' },
      { name: 'Garten Asset Sheet (uploaded to AI) Q1 2026.xlsx', type: 'Excel', lastModified: '2026-04-05', source: 'SharePoint' },
      { name: 'Garten Meeting Letter 12-29-25.docx', type: 'Word', lastModified: '2026-01-05', source: 'SharePoint' },
    ],
  },
  {
    id: 'carrington',
    name: 'Castellana Family',
    kicker: 'Long Island, NY · Western Beef · DelPrete & Giunta referral',
    stage: 'new-lead',
    health: 'green',
    healthReason: 'Captured 5 days ago. Approach call within first-touch SLA. DelPrete + Giunta both committed referrals.',
    customerType: 'partner-firm',
    owner: 'Jess',
    lastTouch: '2026-05-09',
    daysInStage: 5,
    nextStep: 'Tom Sr. personally calls Peter Castellana: owns Western Beef; 80 y/o, fourth wife, children in business.',
    insight:
      "Peter Castellana came in via Carl DelPrete + Phil Giunta, two of Heritage's most reliable referral partners. He owns Western Beef (LI grocery chain). 80 years old, fourth wife, multiple children active in the family business, classic Heritage case profile. Tom Sr. should make the approach call personally.",
    stakeholders: [
      { name: 'Peter Castellana', role: 'Principal · Western Beef' },
      { name: 'Carl DelPrete', role: 'Referral partner (Heritage P3 client)' },
      { name: 'Phil Giunta', role: 'Referral partner (Heritage P3 client)' },
    ],
    opportunities: [],
    activity: [
      { type: 'email', date: '2026-05-10', summary: 'Phil Giunta confirmed warm intro available', who: 'Phil Giunta' },
      { type: 'call', date: '2026-05-09', summary: 'Carl DelPrete called Tom Sr., wants to introduce Peter', who: 'Carl DelPrete' },
    ],
    documents: [],
  },
  {
    id: 'brooks-halley',
    name: 'Haugland Family',
    kicker: 'Long Island, NY · Chris Giamo referral',
    stage: 'active-client',
    health: 'red',
    healthReason: 'Last meeting was August 2025. Follow-up overdue; Phase I drag risks losing momentum with Chris Giamo. Ed Hackenberg not responding.',
    customerType: 'hnw-family',
    owner: 'Tom Sr.',
    lastTouch: '2026-05-02',
    daysInStage: 264,
    nextStep: 'Tom Sr. follows up with Chris Giamo this week (golfed May 2, committed to follow-up).',
    netWorthBand: '$1B+',
    insight:
      "Billy Haugland is Heritage's biggest opportunity: billionaire, Chris Giamo referral via Tiger 21 adjacency. We held IR1 in August 2025 but have not advanced to Phase II in 9 months. Chris Giamo (referral) and Ed Hackenberg are the day-to-day gatekeepers. Tom Sr. golfed with Giamo May 2; committed to following up within a week. EAs have been chasing Hackenberg with no response. Extremely delicate case: do not draft outbound, Tom Sr. handles directly.",
    stakeholders: [
      { name: 'Billy Haugland', role: 'Principal (billionaire)' },
      { name: 'Chris Giamo', role: 'Referral partner / advisor', firm: 'Tiger 21 adjacency' },
      { name: 'Ed Hackenberg', role: 'POC / family advisor' },
    ],
    opportunities: [
      { name: 'Haugland Phase II engagement', type: 'expansion', expectedRevenue: 750000, status: 'Stalled', owner: 'Tom Sr.', dueDate: '2026-07-31' },
    ],
    activity: [
      { type: 'meeting', date: '2026-05-02', summary: 'Tom Sr. golfed with Chris Giamo, committed to follow-up within a week', who: 'Tom Sr.' },
      { type: 'email', date: '2026-04-15', summary: 'EAs chasing Ed Hackenberg on meeting scheduling, no response', who: 'Ang' },
      { type: 'meeting', date: '2025-08-21', summary: 'IR1 with Billy Haugland', source: 'mtg-haugland-ir1', who: 'Tom Sr.' },
    ],
    documents: [
      { name: 'Haugland Meeting Letter 8-21-25.docx', type: 'Word', lastModified: '2025-08-28', source: 'SharePoint' },
      { name: 'Haugland Confidentiality Agreement (draft).pdf', type: 'PDF', lastModified: '2025-09-15', source: 'SharePoint' },
    ],
  },
  {
    id: 'saint-croix',
    name: 'Chrinian Family Office',
    kicker: 'Long Island, NY · Nevada trust',
    stage: 'active-client',
    health: 'green',
    healthReason: 'On cadence. Board Meeting locked for May 21. KM webinar held April 14 on Nevada trust.',
    customerType: 'board',
    owner: 'Matt',
    lastTouch: '2026-05-12',
    daysInStage: 730,
    nextStep: 'Chrinian Board Meeting May 21, 9:00 ET. Matt has the prep pack ready.',
    netWorthBand: '$200M to $400M',
    insight:
      "Eugene is one of the most active P3 clients: constantly has new projects (Nevada trust, NEWCO for Brandon). Wants constant updates with his estate planning. Brandon (son) is starting NEWCO; Justin (other son) is minimally engaged. Keith Meltzer is leading attorney coordination.",
    stakeholders: [
      { name: 'Eugene Chrinian', role: 'Principal' },
      { name: 'Brandon Chrinian', role: 'Son (NEWCO founder)' },
      { name: 'Justin Chrinian', role: 'Son' },
      { name: 'Keith Meltzer (KM)', role: 'Estate attorney', firm: 'Meltzer Lippe' },
    ],
    opportunities: [
      { name: 'Nevada trust restructure', type: 'expansion', expectedRevenue: 180000, status: 'Open', owner: 'Matt', dueDate: '2026-08-15' },
      { name: 'NEWCO planning (Brandon)', type: 'expansion', expectedRevenue: 90000, status: 'Open', owner: 'Matt', dueDate: '2026-12-31' },
    ],
    activity: [
      { type: 'email', date: '2026-05-12', summary: 'Renewal Meeting Letter delivered, May 14 review', who: 'Matt' },
      { type: 'meeting', date: '2026-04-14', summary: 'KM webinar with Eugene on Nevada trust changes', who: 'Keith Meltzer' },
      { type: 'email', date: '2026-04-09', summary: 'Reply received · Eugene asked to add a NEWCO update to the May board agenda', who: 'Hank · auto-logged, last touch updated' },
      { type: 'email', date: '2026-04-07', summary: 'Quarterly email sent · Q1 2026 client update', who: 'Hank via Outlook' },
      { type: 'meeting', date: '2026-01-15', summary: 'IR2 with Eugene · estate review', source: 'mtg-chrinian-ir2', who: 'Tom Sr.' },
    ],
    documents: [
      { name: 'Chrinian Annual Renewal Engagement Letter 2026.docx', type: 'Word', lastModified: '2026-01-10', source: 'SharePoint' },
      { name: 'Chrinian Meeting Letter 11-13-25.docx', type: 'Word', lastModified: '2025-11-20', source: 'SharePoint' },
      { name: 'Chrinian Nevada Trust Memo v2.pdf', type: 'PDF', lastModified: '2026-04-14', source: 'SharePoint' },
    ],
  },
  {
    id: 'helmsley',
    name: 'Penson Family',
    kicker: 'NYC · Tiger 21 referral',
    stage: 'engaged',
    health: 'green',
    healthReason: 'Engagement Letter signed April 2. Insurance underwriting in motion via Kearney & Raffanelli.',
    customerType: 'partner-firm',
    owner: 'Marcus',
    lastTouch: '2026-05-06',
    daysInStage: 32,
    nextStep: 'Marcus to f/u with Kearney & Raffanelli (underwriters) on Andrew Penson medical disclosures.',
    netWorthBand: '$150M to $250M',
    insight:
      "Andrew Penson is a Tiger 21 referral: big case, Phase I in motion with end goal of selling insurance. Engagement Letter signed and payment received April 2. Kearney & Raffanelli are handling underwriting. Marcus continues to follow up directly with Andrew.",
    stakeholders: [
      { name: 'Andrew Penson', role: 'Principal' },
      { name: 'Tiger 21', role: 'Referral channel' },
      { name: 'Kearney & Raffanelli', role: 'Insurance underwriters', firm: 'K&R Insurance' },
    ],
    opportunities: [
      { name: 'Penson insurance Phase I', type: 'insurance', expectedRevenue: 600000, status: 'Open', owner: 'Marcus', dueDate: '2026-09-30' },
    ],
    activity: [
      { type: 'email', date: '2026-04-30', summary: 'Marcus sent email to Kearney & Raffanelli re medical disclosures', who: 'Marcus' },
      { type: 'meeting', date: '2026-04-29', summary: 'PIR with Andrew Penson', source: 'mtg-penson-pir', who: 'Tom Jr.' },
      { type: 'email', date: '2026-04-02', summary: 'Engagement Letter executed; Phase I payment received', who: 'Marcus' },
    ],
    documents: [
      { name: 'Penson Engagement Letter Phase I (April 2026).docx', type: 'Word', lastModified: '2026-04-02', source: 'SharePoint' },
      { name: 'Penson Meeting Letter 4-29-26.docx', type: 'Word', lastModified: '2026-05-06', source: 'SharePoint' },
    ],
  },
  {
    id: 'devonshire',
    name: 'Dana Family',
    kicker: 'Long Island, NY · Goodman Marks valuations',
    stage: 'engaged',
    health: 'amber',
    healthReason: 'Valuations from Goodman Marks complete April 17. Awaiting final valuations on remaining holdings before Phase II Letter.',
    customerType: 'hnw-family',
    owner: 'Marcus',
    lastTouch: '2026-04-27',
    daysInStage: 41,
    nextStep: 'Marcus to send updated Asset Sheet to Fred Dana + Gary Cassiello by May 13.',
    netWorthBand: '$70M to $100M',
    insight:
      "Fred Dana is one of Tom Sr.'s closest friends, relationship-managed at the partner level. Gary Cassiello is Fred's accountant / right-hand person and the main day-to-day contact. Goodman Marks completing valuations is the active blocker for advancing to Phase II.",
    stakeholders: [
      { name: 'Fred Dana', role: 'Principal' },
      { name: 'Gary Cassiello', role: 'Accountant / POC', firm: 'Cassiello CPA' },
      { name: 'Goodman Marks', role: 'Valuation firm', firm: 'Goodman Marks' },
    ],
    opportunities: [
      { name: 'Dana Phase II planning', type: 'expansion', expectedRevenue: 180000, status: 'Open', owner: 'Marcus', dueDate: '2026-08-15' },
      { name: 'Sayville warehouse sale · proceeds planning', type: 'expansion', expectedRevenue: 120000, status: 'Open', owner: 'Marcus', dueDate: '2026-07-15', fromReply: true },
    ],
    activity: [
      { type: 'email', date: '2026-04-27', summary: 'IR2 with Fred + Gary Cassiello', who: 'Marcus' },
      { type: 'email', date: '2026-04-17', summary: 'Goodman Marks valuations received, partial', who: 'Marcus' },
      { type: 'opportunity', date: '2026-04-10', summary: 'Opportunity created from quarterly reply · Sayville warehouse sale proceeds planning', who: 'Hank' },
      { type: 'email', date: '2026-04-10', summary: 'Reply received · Fred is selling the Sayville warehouse and wants planning for the proceeds', who: 'Hank · auto-logged, last touch updated' },
      { type: 'email', date: '2026-04-07', summary: 'Quarterly email sent · Q1 2026 client update', who: 'Hank via Outlook' },
      { type: 'meeting', date: '2026-02-12', summary: 'IR1 with Fred Dana', source: 'mtg-dana-ir1', who: 'Tom Sr.' },
    ],
    documents: [
      { name: 'Dana Engagement Letter 2026.docx', type: 'Word', lastModified: '2026-02-01', source: 'SharePoint' },
      { name: 'Dana Asset Sheet (partial valuations) Q1 2026.xlsx', type: 'Excel', lastModified: '2026-04-17', source: 'SharePoint' },
      { name: 'Dana Meeting Letter 4-27-26.docx', type: 'Word', lastModified: '2026-05-04', source: 'SharePoint' },
    ],
  },
  {
    id: 'fairhaven',
    name: 'Esposito Family',
    kicker: 'Garden City, NY · renewal cadence lapsed',
    stage: 'active-client',
    health: 'red',
    healthReason: 'No touch in 14 months. Overdue follow-up is dragging the score. Last IR was March 2025 and the Q1 quarterly email never reached them.',
    customerType: 'hnw-family',
    owner: 'Tom Sr.',
    lastTouch: '2025-03-06',
    daysInStage: 1160,
    nextStep: 'Tom Sr. calls Sal Esposito this week to restart the IR cadence, then include the family in the Q2 quarterly send.',
    netWorthBand: '$40M to $70M',
    insight:
      "Tom Sr. flagged this case himself: no contact in over a year. Sal renewed in early 2025 and then went quiet. The Espositos also missed the Q1 quarterly send because the old Outlook distribution list was stale, exactly the failure mode the centralized quarterly email removes. A direct call from Tom Sr. plus the Q2 send is the fastest path back to cadence.",
    stakeholders: [
      { name: 'Sal Esposito', role: 'Principal' },
      { name: 'Marie Esposito', role: 'Spouse' },
      { name: 'Anthony Russo', role: 'CPA / POC', firm: 'Russo & Co.' },
    ],
    opportunities: [],
    activity: [
      { type: 'meeting', date: '2025-03-06', summary: 'IR2 with Sal and Marie · annual review', who: 'Tom Sr.' },
      { type: 'email', date: '2025-01-20', summary: 'Annual Renewal Engagement Letter executed', who: 'Ang' },
    ],
    documents: [
      { name: 'Esposito Annual Renewal Engagement Letter 2025.docx', type: 'Word', lastModified: '2025-01-20', source: 'SharePoint' },
      { name: 'Esposito Asset Sheet 2024.xlsx', type: 'Excel', lastModified: '2024-11-12', source: 'SharePoint' },
    ],
  },
];

/* ── Demo clock + last-touch helpers ───────────────────────── */

export const DEMO_TODAY = '2026-05-12';

export function touchAgeDays(c) {
  return Math.round((new Date(DEMO_TODAY) - new Date(c.lastTouch)) / 86400000);
}

export function touchOverdue(c) {
  return touchAgeDays(c) >= 365;
}

export function lastTouchLabel(c) {
  const days = touchAgeDays(c);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return `${Math.round(days / 30.44)} months ago`;
}

export function clientById(id) {
  return CLIENTS.find((c) => c.id === id) || null;
}

export function stageById(id) {
  return STAGES.find((s) => s.id === id) || null;
}

export const MORNING_DIGEST = {
  date: '2026-05-12',
  movers: [
    { clientId: 'helmsley', from: 'new-lead', to: 'engaged', when: '32 days ago' },
    { clientId: 'aldermount', from: 'engaged', to: 'qualified', when: '64 days ago' },
  ],
  atRisk: ['fairhaven', 'brooks-halley', 'whitcombe', 'devonshire'],
  todaysFocus: [
    { clientId: 'brooks-halley', note: 'Tom Sr. follow-up with Chris Giamo this week (golfed May 2).' },
    { clientId: 'whitcombe', note: 'Confirm Mills valuations complete; unblock IRA beneficiary at NEPWM.' },
    { clientId: 'koenigsberg', note: 'IR3 prep for May 22 with Craig + Yvonne.' },
  ],
};
