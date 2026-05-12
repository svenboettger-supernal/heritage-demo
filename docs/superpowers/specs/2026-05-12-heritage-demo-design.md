# Heritage Demo — Design Spec

**Date:** 2026-05-12
**Author:** Sven Boettger (with Claude)
**Repo:** `svenboettger-supernal/heritage-demo`
**Live URL (after deploy):** `https://svenboettger-supernal.github.io/heritage-demo/`

## 1. Purpose

A HubSpot/Salesforce-style front-end demo for the three AI-Employee environments
proposed to Heritage Strategies: **Hank (CRM)**, **Foreman (Project Manager)**,
and **Sam (Help Desk — CS Manager view)**. The point of the demo is to make
the "one platform, one data layer" pitch from the three SOWs concrete and
clickable for Heritage stakeholders.

Backing proposals (read for context):

- `heritage-strategies-crm/index.html` — Hank
- `heritage-strategies-foreman/index.html` — Foreman
- `heritage-ai-helpdesk/index.html` — Sam (CS Manager workspace, not end-user widget)

Brand authority: `supernal-design-system-prompt.md` (token system, typography,
component conventions).

## 2. Non-goals

- No backend, no real auth, no live AI calls. Seed data + prerecorded
  "Ask Anything" responses only.
- No mobile layout. Responsive down to ~1024px; SOWs are explicit that
  web-first is the launch target.
- No dark mode.
- No end-user help-desk chat widget — only the CS Manager view of Sam, per
  the brief.
- No features marked out-of-scope in the SOWs: time tracking, sales
  forecasting/quota analytics, autonomous outreach, self-serve schema editors,
  email/voice support channels, multi-language.

## 3. Stack and deploy

- **Vanilla static site:** HTML, CSS, JS. No build step.
- Matches the rhythm of the sibling `heritage-proposals` repo so the two feel
  like one product family.
- Deploys via **GitHub Pages** from `main`. Same pattern as the proposals
  repo.
- **Password gate** copied from the proposals site (same overlay, same
  `localStorage` key `supernal_heritage_unlocked`, same password). Anyone with
  proposal access drops straight in.

## 4. File layout

```
heritage-demo/
├── index.html              # shell: gate, top bar, sidebar, route mount
├── styles.css              # tokens + hand-rolled component primitives
├── app.js                  # router, state, render functions, command palette
├── data/
│   ├── clients.js          # 6–8 Heritage-flavored clients, stakeholders, opps
│   ├── work.js             # tasks, meetings, documents (shared Hank ↔ Foreman)
│   └── support.js          # tickets, conversations, KB articles
├── assets/
│   ├── favicon.png         # copied from heritage-proposals
│   ├── supernal-logo.svg   # copied from heritage-proposals
│   └── icons/              # lucide-style inline SVGs as needed
└── README.md               # one-paragraph what + deploy notes
```

All JS modules loaded as `<script type="module">`. No bundler.

## 5. Routing and state

Hash-based router in `app.js`. Routes:

```
#/hank/clients
#/hank/clients/<clientId>?tab=<overview|stakeholders|activity|documents|tasks|opportunities>
#/hank/digest
#/hank/stages
#/foreman/rundown
#/foreman/tasks?view=<list|board|calendar>
#/foreman/tasks/<taskId>
#/foreman/meetings
#/foreman/meetings/<meetingId>
#/foreman/prep
#/sam/tickets
#/sam/tickets/<ticketId>
#/sam/kb
#/sam/report
```

**Cross-app context.** A single query param `?client=<clientId>` rides along
the URL when a client is "followed". Setting it:

- Set automatically when the user opens a client record in Hank.
- Carried across app switches by the top-bar app-switcher dropdown.
- Visible as a "Following: Koenigsberg ✕" chip in the top bar.
- Foreman's tasks/meetings views and Sam's tickets view filter to the
  followed client when set; an inline chip says "Filtered by Koenigsberg".
- Clearing via the ✕ removes the param and reverts every list to its
  unfiltered default.

This is the demo's headline payoff for the "shared data layer" claim that
appears in all three SOWs.

## 6. App-switcher shell

Layout, top to bottom:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Supernal] [▼ Hank · CRM]  [search]  [Ask Anything ⌘K]  [Following: …✕] [JH] │
├──────────┬──────────────────────────────────────────────────────────────┤
│ Sidebar  │ Main content (route-driven)                                  │
│ (per-app)│                                                              │
│          │                                                              │
└──────────┴──────────────────────────────────────────────────────────────┘
```

- App-switcher dropdown lists the three environments with viz-palette
  accents: **Hank = viz-2 (slate blue)**, **Foreman = viz-0 (terracotta)**,
  **Sam = viz-1 (amber)**.
- Global search is decorative (visible, focusable, no real results) in this
  cut.
- **Ask Anything (⌘K)** opens a command palette over a translucent
  backdrop. Five prerecorded prompts return sourced answers with clickable
  citation chips that deep-link into the relevant record. Works in every
  app. Driven by the Foreman SOW's "Ask Anything by chat or voice"
  requirement.
- Per-app sidebar holds the top-level navigation entries for that app.

## 7. Screen inventory (14 screens)

### Hank · CRM (5)

1. **Pipeline list** — table with columns: Client, Stage, Health (●/●/●),
   Owner, Last touch, Open opps. Filter chips above: stage, health,
   customer type (HNW family / partner-firm / board). Sort by header click.
2. **Client record (default: Koenigsberg)** — header with name, health
   pill, stage progress bar, customer-type badge, primary CTA "Draft
   outbound". Tabs:
   - **Overview** — stage progress + happy-path checklist for the current
     stage.
   - **Stakeholders** — list with role per stakeholder (principal, spouse,
     attorney, accountant, partner advisor).
   - **Activity** — chronological timeline of emails, calls, meetings.
   - **Documents** — SharePoint-style file rows with type/last-modified.
   - **Tasks** — pulled from Foreman, filtered by this client.
   - **Opportunities** — name, type, expected revenue, status, owner.
   - Right rail: "Hank's read" insight card with a plain-language summary
     and link to source.
3. **Morning client digest** — three card stacks: movers (stage changes),
   at-risk, today's focus.
4. **Outbound draft modal** — Hank-drafted email in Heritage voice with
   citation chips, "Send for approval" CTA, "Edit" toggle. Opened from
   client record.
5. **Stages & happy paths** — read-only configurator: list of stages with
   the happy-path checklist for each. Demonstrates the editable shape
   without implementing edits.

### Foreman · PM (5)

1. **Monday rundown** — color-coded engagement rows (green/amber/red) with
   a one-line reason per row. Above the fold: top three risks. Landing
   screen for Foreman.
2. **Tasks** — list with filters by owner, status (To Do/In Progress/
   Blocked/Done), priority (Low/Normal/High/Urgent), label, engagement.
   View tabs: **List / Board / Calendar**. Bulk-action toolbar
   (close, reassign, tag) when rows selected.
3. **Task detail** — title, owner, due, status, priority, labels.
   Sub-tasks. Dependencies. Comments with @mentions. Activity feed
   (audit trail). Attachments.
4. **Meetings list** + **Meeting detail** — Past/Upcoming tabs. Each
   meeting row shows status (Prep Ready / Recording / Letter Drafted /
   Letter Sent). Detail screen shows transcript excerpt, draft summary
   letter, extracted action-item review queue with owner+due-date
   enforcement.
5. **Prep-protocol cadence** — per engagement: Pre-Internal / IR1 / IR2 /
   Partner Review milestones as a horizontal progress strip with slip
   flags.

### Sam · Help Desk (CS Manager view, 4)

1. **Ticket inbox** — table with columns: ID, Subject, Persona (L1 HNW /
   L2–L5 partner-firm), Status, Assignee, Priority, Age, Last AI
   response, SLA timer. Filters + saved views (e.g., "Open · partner-firm",
   "Escalated today"). Bulk actions: close, reassign, tag, merge, split.
2. **Ticket detail** — three regions:
   - Top: status, assignee, persona pill, sentiment indicator, SLA timer,
     "Take over chat" button.
   - Left: conversation thread (user ↔ Sam ↔ human takeover where
     applicable) with citation chips on Sam's messages.
   - Right: context panel (user identity + firm, book status, document
     inventory, escalation history).
3. **Knowledge base** — list of articles with freshness SLA, editorial
   owner, last reviewed, conflict-flag badges. Filters by topic and
   freshness.
4. **Performance report** — monthly stats card grid: containment rate,
   escalations by reason, CSAT, volume by persona. One simple bar/line
   chart per metric (inline SVG, no chart library).

## 8. Brand mapping

### Tokens

Extend the proposals' CSS variable set in `styles.css`:

- **Surface scale** (full 11 stops from the brand prompt) and **action
  scale** (10 stops). Components only reference semantic aliases
  (`--bg-page`, `--fg`, `--border`, etc.), never the raw stops.
- **Status colors**: `--success / --warning / --error / --info` plus
  each `-bg` pair.
- **Viz palette**: 7 colors plus their `-bg` tints (avatars, app
  accents).
- **Light mode only** (one `:root` block; no `.dark`).

### Typography

Lora display, Inter UI, JetBrains Mono for code/IDs/SLA timers. Loaded via
`@import url(fonts.googleapis.com…)` in `styles.css` to match the
proposals site. The brand prompt's `next/font/google`-only rule is
Next.js-specific; the spirit (single load mechanism, no FOUC) is satisfied
here.

### Components (hand-rolled, no shadcn)

`.btn` (+ `--primary`, `--secondary`, `--ghost`, `--destructive`,
`--sm`/`--lg` size modifiers), `.badge` (+ status variants),
`.card` (+ `-header`/`-content`/`-footer`), `.table` (sortable headers,
hover rows), `.tabs`, `.dialog` (+ backdrop), `.popover`, `.tooltip`,
`.input`, `.select`, `.switch`, `.checkbox`, `.sidebar` and
`.sidebar-item`, `.avatar` (viz-palette-hashed), `.skeleton` (1.5s
shimmer with `prefers-reduced-motion` fallback to static), `.health-dot`
(green/amber/red), `.kbd` chip.

### Layout

- 12-column CSS Grid, `gap: 16px`.
- Content max-width: `1280px`, centered.
- Sidebar background `hsl(33 22% 87%)`; active item `bg surface-4`.
- Z-index scale per brand prompt (dropdown 20, modal 40, toast 50,
  tooltip 60).
- Border radius per brand: badges 4px, buttons/inputs 6px, cards 8px,
  modals 12px, pills 999px.

### Motion

CSS transitions only (no Framer Motion). 200ms default,
`cubic-bezier(0, 0, 0.2, 1)` ease-out. Modal in via grid-rows or
opacity+translate (no `max-height` animation). Skeleton shimmer
1.5s. `prefers-reduced-motion` override forces 0.01ms everywhere.

## 9. Seed data (Heritage-flavored)

### Clients

Eight client records with the following spread of stage × health:

| Client | Stage | Health | Customer type |
|---|---|---|---|
| Koenigsberg Family | Active Client | On Track | HNW family |
| Whitcombe Family Office | Engaged | At Risk | HNW family |
| Aldermount Holdings | Qualified | On Track | partner-firm client |
| Carrington Partners | New Lead | On Track | partner-firm client |
| Brooks-Halley | Active Client | Critical | HNW family |
| Saint Croix Group | Active Client | On Track | board |
| Helmsley Trust | Engaged | On Track | HNW family |
| Devonshire Holdings | Qualified | At Risk | partner-firm client |

Koenigsberg is the default deep-link target (matches the SOW example
"where are we on Koenigsberg?").

### Stakeholders

Roles drawn from the Hank SOW: principal, spouse, attorney, accountant,
partner advisor. Two to five stakeholders per client.

### Owners

Drawn from Heritage roster: Tom Sr., Jessica, Ryan, plus two or three
additional first-name-only Heritage employees. No Supernal Pod names
appear in the demo.

### Foreman tasks

~30 tasks across the clients, spread across statuses and priorities.
Roughly five tied to prep-protocol cadence (Pre-Internal/IR1/IR2/Partner
Review milestones).

### Sam tickets

~20 tickets split L1 HNW end-client and L2–L5 partner-firm. Mix of
"contained by Sam", "escalated", "in human takeover". Tied to clients
where realistic to demonstrate cross-app filtering.

## 10. Ask Anything (command palette)

Triggered by ⌘K. Five prerecorded prompts in the catalog:

1. "Where are we on Koenigsberg?" → sourced answer citing meeting
   letter + open tasks.
2. "What slipped this week?" → list of overdue tasks across engagements
   with reasons.
3. "Prep status for IR2 across active clients" → table of cadence flags.
4. "Open partner-firm tickets aged > 24h" → list deep-linking into Sam.
5. "Draft a follow-up to Whitcombe principal" → opens the outbound
   draft modal in Hank with seed content.

Each answer renders citation chips that route to the source record. No
free-text answering; if the user types something else, the palette shows
"Try one of the suggested prompts" and the five catalog entries.

## 11. Accessibility

- WCAG 2.1 AA contrast targets on every token pairing.
- All interactive elements reachable via keyboard with visible
  `ring-2 ring-[--action] ring-offset-2`-equivalent focus.
- Dialogs trap focus and restore it to the trigger on close.
- Icon-only buttons carry `aria-label`.
- Skip link to `#main` at the top of the layout.
- All non-decorative images have `alt`.

## 12. Open risks

- **Vanilla JS at this scale.** Fourteen screens with cross-app context
  in a single hand-written router is more JS than the proposals site
  carries. Mitigation: keep render functions pure, separate data from
  view, no inline event listeners outside the router boundary. If
  complexity outgrows the budget, the next iteration jumps to
  Next.js + shadcn.
- **Brand-rule deviation on font loading.** Acknowledged above; matches
  proposals-site precedent.
- **Demo data realism vs. confidentiality.** All client names are
  fictional but Heritage-plausible. Stakeholder names invented. No
  real Heritage client data appears.
