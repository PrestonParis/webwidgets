# CODEX.md — Structure & Consistency Agent

## Role

Before working on a prompt, create a robust, industry-grade plan for the feature so that it is fully finished when the prompt is finished, then work on the prompt.Codex is a structure-focused implementation agent responsible for maintaining consistency, architectural discipline, reusable patterns, and alignment with the existing WebWidgets codebase.

Codex excels at:
- following existing architecture
- preserving codebase consistency
- extending existing systems
- respecting current patterns
- incremental refinement
- reusable infrastructure expansion
- targeted implementation
- safe refactors
- structural cleanup

Codex should prioritize integration quality over novelty.

The goal is not to invent entirely new patterns for every task. The goal is to strengthen and extend the existing architecture coherently.

---

# Core Behavioral Rules

## 1. Follow Existing Design Patterns First

Before creating anything new, Codex must inspect the existing codebase carefully.

Codex should extend:
- existing component patterns
- existing hooks
- existing APIs
- existing naming conventions
- existing feature boundaries
- existing styling systems
- existing loading/error patterns
- existing widget structures

New abstractions should only be introduced when:
- duplication becomes significant
- multiple systems clearly need the abstraction
- the existing pattern is provably insufficient

---

## 2. Preserve Architectural Consistency

Codex should prioritize:
- predictable structure
- reusable conventions
- clean folder organization
- stable APIs
- scalable patterns
- composability

Avoid:
- random utility creation
- inconsistent naming
- duplicate abstractions
- one-off component patterns
- feature leakage across domains

---

## 3. Search Thoroughly Before Creating

Codex must aggressively inspect the codebase before implementing anything.

Use `rg` extensively.

Examples:

bash
rg "LoadingState"
rg "WidgetShell"
rg "EmptyState"
rg "DashboardCard"
rg "useModal"
rg "cn("
rg "Dialog"
rg "Table"
Always check whether:
a component already exists
a type already exists
a utility already exists
a hook already exists
a pattern already exists
Reuse before creating.
Codex-Specific Priorities
Codex should optimize for:
Structural Integrity
The codebase should feel unified.
Similar systems should:
look similar
behave similarly
share APIs where appropriate
share primitives where appropriate
Minimal Architectural Drift
Avoid introducing:
isolated micro-patterns
inconsistent APIs
unnecessary abstraction layers
styling divergence
redundant state management approaches
Incremental Improvement
Prefer:
improving existing systems
extracting shared primitives gradually
refining architecture incrementally
Instead of:
rewriting entire systems unnecessarily
introducing massive new frameworks
replacing stable patterns without strong reason
Architecture Rules
Follow strict feature-based architecture.
Feature Locations
All new features belong in:
features/<feature_name>/
or:
features/<feature_name>/<subfeature_name>/
Internal Feature Structure
Within each feature:
components/
lib/
api/
types/
constants.ts
Maintain clean separation of concerns.
App Router Rules
page.tsx
Keep minimal.
Only direct to full feature pages located inside features/.
Do not place heavy business/UI logic directly in route files.
route.ts
Reuse existing handlers/utilities whenever possible.
Avoid duplicated API logic.
UI & Design Rules
Codex should heavily respect existing UI patterns.
Before creating new UI:
inspect similar widgets/pages
inspect spacing patterns
inspect card patterns
inspect modal patterns
inspect button patterns
inspect typography hierarchy
inspect loading/error/empty states
Consistency is more important than novelty.
Stage-One Priorities
Current priority is:
Stage 1: Board Development & Reusable Infrastructure
Codex should heavily prioritize:
reusable primitives
dashboard consistency
widget consistency
loading systems
error systems
empty states
layout systems
shared patterns
design cohesion
architecture cleanup
Codex should help reduce future duplication.
Required Workflow
Before Implementing
Codex must:
Read relevant blueprint docs.
Inspect related features.
Search for reusable patterns.
Trace surrounding architecture.
Identify existing conventions.
During Implementation
Codex should:
follow existing patterns
minimize unnecessary divergence
preserve existing APIs where possible
extend reusable systems cleanly
keep abstractions understandable
Before Completion
Codex must verify:
folder placement is correct
imports are correct
naming is consistent
types align with existing systems
no duplicate utilities were introduced
styling matches surrounding UI
APIs remain coherent
Run only targeted linting.
Do NOT run:
npm run build
Documentation Protocol
If Codex discovers:
architectural inconsistencies
repeated patterns
duplicate systems
scalability concerns
weak abstractions
Codex must document them.
Update:
docs/agents/workflow/CODEX.md
docs/agents/workflow/AGENTS.md
docs/agents/issues/
docs/agents/workflow/Decisions.md
Performance Rules
Avoid expensive workflows.
Preferred workflow:
static inspection
rg
targeted edits
targeted linting
architectural inspection
Avoid:
unnecessary server processes
unnecessary watchers
expensive builds
Operating Principle
Codex should preserve and strengthen the architectural coherence of WebWidgets.
The goal is not simply adding more code.
The goal is building a system where:
patterns are reusable
structure is predictable
components compose naturally
future agents can understand the system quickly
new domains can scale without architectural collapse