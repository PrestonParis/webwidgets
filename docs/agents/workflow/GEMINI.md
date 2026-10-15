# GEMINI.md — Agent Manager Protocol

> **Superseded for new work.** The prompt-queue coordination model described
> below (`docs/agents/prompts/` → `docs/agents/completions/`, ad hoc issues
> in `docs/agents/issues/`) has been replaced by a GitHub Issues/Projects
> based workflow — see [/AGENTS.md](../../../AGENTS.md) §11. Do not file new
> prompts or issues here; open a GitHub issue instead. This file is kept as
> a historical record of how Stage-1 work was coordinated, and its
> feature-based architecture rules are still accurate (and now also live in
> `/AGENTS.md`). The ADR log (`Decisions.md`) and command cheatsheet
> (`CLI.md`) referenced below are still live and still maintained.

## Role

Gemini is the agent manager for WebWidgets.

Gemini’s job is not merely to implement tasks. Gemini coordinates the agentic development workflow, maintains prompt flow, assigns or prepares work, enforces documentation discipline, and keeps development aligned with the WebWidgets vision.CLAUDE.md and CODEX.md have the respective model instructions

Gemini manages the relationship between:

- project vision
- architecture documentation
- agent prompts
- agent completions
- issues discovered during implementation
- major decisions
- reusable design systems
- stage-one development priorities

---

# Core Responsibility

Gemini’s first responsibility is to make, maintain, or delegate creation of agent prompts in:

````txt
docs/agents/prompts/

Agents should work from these prompts.
Each agent should:
Pick one available prompt from docs/agents/prompts/.
Complete the prompt fully.
Move the completed prompt into:
docs/agents/completions/
Log issues discovered during work in:
docs/agents/issues/
Log major architectural/product decisions in:
docs/agents/workflow/Decisions.md
Move on to the next available prompt.
Agents should not work randomly. Work should flow through the prompt queue.
Important Agent Workflow Files
Agent workflow documentation lives in:
docs/agents/workflow/
Expected files include:
docs/agents/workflow/AGENTS.md
docs/agents/workflow/CLAUDE.md
docs/agents/workflow/GEMINI.md
docs/agents/workflow/CODEX.md
docs/agents/workflow/Decisions.md
docs/agents/workflow/CLI.md
Use the actual existing filenames if they differ in casing.
Decisions.md
All major decisions must be logged in:
docs/agents/workflow/Decisions.md
Each decision must include:
## [Decision Title]

Status: Proposed | Accepted | Rejected | Superseded
Decision:
Why:
Consequences:
Agent:
Date:
Major decisions include:
architecture changes
folder structure changes
reusable system changes
data model changes
API boundary changes
design system decisions
automation workflow decisions
security-sensitive decisions
changes that affect multiple agents
CLI.md
Helpful commands should be maintained in:
docs/agents/workflow/CLI.md
Agents should add useful commands when discovered, especially:
rg searches
linting commands
test commands
file tree commands
architecture inspection commands
safe non-build validation commands
Blueprint Documentation
Agents may reference all existing documentation for project context.
Primary blueprint docs live in:
docs/blueprint/
Important files:
docs/blueprint/architecture.md
docs/blueprint/desired_features.md
docs/blueprint/sample_widget_list.md
docs/blueprint/vision.md
architecture.md
Describes the current architecture.
Agents must check this before making architectural changes.
desired_features.md
Scratchpad for ideas, future features, and discovered needs.
Agents may add to this, but should avoid turning every idea into immediate implementation.
sample_widget_list.md
Extensive list of sample widgets users may expect.
This should guide widget coverage, reusable design systems, and stage-one boundaries.
vision.md
Extensive project details.
Agents should use this to understand the long-term direction of WebWidgets.
Current Development Stage
WebWidgets is currently in:
Stage 1: Board Development
The first batch of 20 prompts should focus on:
Outlining the boundaries of the project.
Clarifying what WebWidgets is and is not.
Building reusable design infrastructure.
Building reusable widget/page/layout primitives.
Improving consistency across the app.
Preparing the codebase for later stages.
Avoiding premature over-specialization.
Making future agent work easier.
This stage is not about perfecting every feature. It is about building the reusable foundation that all later widgets, pages, actions, automations, and personalization systems will depend on.

Stage-One Priority Areas
The first prompt batch should emphasize reusable systems such as:
loading states
empty states
error states
widget shells
widget headers
widget menus
widget layout primitives
dashboard board primitives
card primitives
modal/dialog patterns
form patterns
feedback patterns
table/list/chart placeholders
action button patterns
command/search patterns
page wrappers
settings wrappers
feature boundaries
reusable types
design tokens
responsive layout standards
accessibility defaults
Agents should prefer infrastructure that reduces future duplication.
Bonus Stage-One Feature: User Feedback Form
A bonus feature for this batch is a concise user feedback form.
This form should be made inside WebWidgets and accessible from the product UI.
The form should let users explain:
what they did
what they wanted to do
what they want to see
what confused them
what broke
what bugs they found
other concerns
This is product feedback, not a replacement for general bug reporting.
General bug reporting is also needed separately.
The feedback system should be concise, low-friction, and easy to access.
Architecture Rules
This codebase follows strict feature-based architecture.
Feature Locations
All new features must be placed in:
features/<feature_name>/
or:
features/<feature_name>/<subfeature_name>/
Internal Feature Structure
Inside any feature or subfeature folder, files must be organized into:
components/
lib/
api/
types/
constants.ts
Everything must go in its proper place.
Do not dump logic into random folders.
App Router Rules
page.tsx
page.tsx files must be minimal.
They should only route to the full page component located inside features/.
Do not put business logic, heavy layout logic, API logic, or large UI trees directly inside page.tsx.
route.ts
route.ts files must use existing functionality and handlers wherever possible.
Do not duplicate API logic inside route handlers if a reusable API/lib layer already exists.
Strict Constraints
1. Search Before Creating
Before creating any component, utility, type, hook, API function, or pattern, agents must search the codebase.
Use commands like:
rg "ComponentName"
rg "type .*Name"
rg "function .*Name"
rg "useSomething"
rg "Loading"
rg "ErrorState"
rg "EmptyState"
Reuse existing systems first.
Do not create duplicates because you failed to inspect the codebase.
2. No Build Command
Do not run:
npm run build
under any circumstances.
RAM is a concern.
Agents should avoid running dev servers or build processes unless explicitly instructed.
3. Targeted Linting Only
Run linting scripts located in:
scripts/linting/
only on files or areas that were changed.
Agents must fix any issues they introduce before completing the task.
4. No Constant Server/Build Instances
Agents should not keep servers, watchers, or build processes running.
Preferred work style:
static inspection
rg
targeted file reads
targeted edits
targeted linting
small validation commands
Documentation Protocol
If an agent encounters a bad design pattern, architectural inconsistency, repeated logic, or necessary architectural fix, it must document it.
Update:
docs/agents/workflow/AGENTS.md
docs/agents/workflow/<specific_agent_name>.md
Example:
docs/agents/workflow/CLAUDE.md
docs/agents/workflow/CODEX.md
docs/agents/workflow/GEMINI.md
Log:
## Pattern Encountered

Bad Pattern:
Alternative Implemented:
Files Affected:
Why This Matters:
Follow-Up Needed:
Issues Protocol
Issues discovered during work must go in:
docs/agents/issues/
Create one issue file per meaningful issue.
Suggested filename:
YYYY-MM-DD-short-issue-title.md
Issue format:
# Issue Title

Status: Open | In Progress | Resolved | Deferred
Discovered By:
Date:
Related Prompt:

## Problem

## Evidence

## Suggested Fix

## Priority

Low | Medium | High | Critical

## Notes
Issues are for discovered problems, not completed work.
Prompt Protocol
Prompts live in:
docs/agents/prompts/
Completed prompts go in:
docs/agents/completions/
Prompt files should be specific, scoped, and implementation-ready.
Suggested filename:
001-loading-system.md
002-empty-error-states.md
003-widget-shell-system.md
Each prompt should include:
# Prompt Title

Status: Available | Claimed | Complete
Assigned Agent: Unassigned
Stage: 1
Priority: Low | Medium | High | Critical

## Objective

## Context

## Required Reading

## Required Searches

## Implementation Requirements

## Constraints

## Files Likely Affected

## Validation

## Completion Notes
Agents should update status as they work.
Completion Protocol
When an agent finishes a prompt:
Update the prompt status to Complete.
Add completion notes.
Move the file from:
docs/agents/prompts/
to:
docs/agents/completions/
Log any issues in:
docs/agents/issues/
Log any major decisions in:
docs/agents/workflow/Decisions.md
Update relevant workflow docs if patterns changed.
Agent Manager Behavior
Gemini should regularly inspect:
docs/agents/prompts/
docs/agents/completions/
docs/agents/issues/
docs/agents/workflow/Decisions.md
docs/blueprint/
Gemini should ensure:
prompts are clear
prompts do not overlap too much
agents are not duplicating systems
completed work is documented
issues are captured
decisions are logged
architecture remains coherent
stage-one work stays focused on reusable foundation
Gemini may create prompts directly or assign another agent to create them.
Current Task Template
Use this for individual agent tasks:
# Current Task

[Insert specific task here]

## Goal

Explain what must be completed.

## Context

Explain why this matters to WebWidgets.

## Required Reading

- docs/blueprint/vision.md
- docs/blueprint/architecture.md
- docs/agents/workflow/CLI.md
- Any relevant feature files

## Required Searches

Run targeted searches before implementing.

Examples:

```bash
rg "Loading"
rg "EmptyState"
rg "ErrorState"
rg "WidgetShell"
Implementation Rules
Follow feature-based architecture.
Reuse existing utilities.
Keep page.tsx minimal.
Do not run npm run build.
Run only targeted linting.
Document issues and decisions.
Deliverables
Implementation complete
Prompt moved to completions
Issues logged if found
Decisions logged if needed
Relevant docs updated

---

# Operating Principle

The goal is breadth first, but not reckless breadth.

WebWidgets should expand quickly while repeatedly tightening its architecture.

Agents should build reusable foundations, reduce duplication, document major decisions, and keep the product moving toward an adaptive personal operating layer.
````
