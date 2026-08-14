# WebWidgets V1 Scope and Breadth Freeze

## Product definition

WebWidgets V1 helps a user understand what changed, what matters, and what to
do next. It collects authorized personal and external signals into a timeline,
creates an evidence-backed briefing, and safely completes basic approved
actions.

The initial product should be useful even if the user never manually arranges
a complex dashboard.

## Required V1 journeys

### 1. Timeline and briefing

The user connects or configures sources. WebWidgets continuously ingests new
events, removes duplicates, preserves provenance, and presents a prioritized
timeline plus a concise briefing.

### 2. Commitment to completed task

WebWidgets detects a commitment or deadline in an authorized source, proposes
a task with the supporting evidence, lets the user approve or edit it, creates
the task, and later records its completion.

### 3. Safe basic automation

The user enables a bounded rule or schedule. When its trigger occurs,
WebWidgets evaluates its conditions, requests approval when required, performs
the action exactly once, and records a comprehensible run result.

## V1 sources

V1 supports a deliberately small source set:

- Gmail and Outlook messages already authorized by the user;
- Google Calendar and, if the existing boundary is sound, Outlook Calendar;
- WebWidgets tasks and task status changes;
- user-authored notes and selected uploaded documents;
- user goals, active projects, preferences, and explicit feedback;
- user-selected RSS/Atom feeds; and
- WebWidgets activity and action outcomes.

Public news is not sourced through CNN, NBC, or similar publisher-specific
APIs. V1 does not depend on a mainstream news-vendor API. External timeline
items come from feeds the user explicitly selects or sources added to a
curated, transparent feed catalog. Every item retains its source URL,
publisher, publication time, fetch time, and extraction status.

The existing `news` product surface should evolve into **Timeline
Intelligence**. “News” is one event type inside that timeline, not the sole
purpose of the system.

## Required V1 outputs

- prioritized chronological timeline;
- daily or on-demand briefing;
- detected commitments and deadlines;
- evidence-backed task suggestions;
- pending approvals;
- automation run history;
- clear failure and reconnect states; and
- user feedback controls: approve, edit, dismiss, complete, undo where
  possible, and report incorrect reasoning.

## Required V1 actions

The initial action catalog is intentionally narrow:

1. Create a WebWidgets task.
2. Update or complete a WebWidgets task.
3. Create a calendar event.
4. Prepare an email draft without sending it.
5. Trigger one explicitly configured workflow.

Sending email autonomously, deleting external data, purchasing, publishing,
and other high-impact actions are not V1 capabilities.

## Basic V1 automations

V1 ships with bounded templates rather than an unrestricted workflow builder:

- **Commitment capture:** new message with a credible commitment or deadline
  proposes a task.
- **Daily briefing:** at a user-selected time, summarize important changes,
  due work, and pending approvals.
- **Calendar preparation:** an approved task with a concrete time window can
  create a calendar event.
- **Stale-task review:** periodically surface overdue or inactive tasks for
  user review; never silently delete or reschedule them.

Each template must support enable/disable, dry-run, approval policy, last-run
status, and failure visibility.

## Suspended beta surfaces

The current Entertainment category mixes core timeline work with optional
experiences. For V1, retain the code but suspend active development and place
these surfaces in beta:

- Chess
- Creative / Art Studio
- Memorization
- Reading platform

“Suspended beta” means:

- excluded from default onboarding recommendations and generated workspaces;
- clearly labeled Beta wherever discoverable;
- absent from the primary V1 navigation unless the user enables beta
  features;
- no feature expansion, polish campaign, model tuning, or dedicated V1 test
  work;
- only platform-wide security, data-loss, or severe regression fixes; and
- not counted in V1 completion metrics.

News is explicitly excluded from this suspension because it is being
reframed as Timeline Intelligence.

## Other frozen breadth

All features outside the critical V1 journeys are maintenance-only during
finalization. Existing finance, health, recovery, collaboration, research,
developer, conversion, accessibility, and dashboard capabilities may remain
available, but they do not block V1 unless they are on a shared critical path
or present a security/data-loss issue.

Do not add:

- new widgets;
- new platforms such as mobile, desktop, extension, or CLI;
- new standalone ML models without a V1 evaluation and live consumer;
- advanced dashboard layout mechanics;
- general MCP servers without a specific V1 integration need; or
- new automation action categories beyond the required catalog.

## Scope-change rule

Adding a V1 requirement requires removing or deferring work of comparable
size. Scope additions should be recorded in `DECISIONS.md` with the affected
release gate.
