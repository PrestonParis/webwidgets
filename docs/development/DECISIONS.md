# Architecture Decision Records

---

## ADR-001: ML-First, Claude as Paid Fallback

**Status:** Active

**Decision:** In-house TF-IDF + Logistic Regression models run for all users. Claude (Anthropic API) is reserved as a fallback for paid tier only.

**Why:** Cost control and latency. The ML models are fast, free to run, and sufficient for common cases. Claude adds cost per-request that only makes sense for premium features.

**Consequences:** Models must be retrained as new action/widget patterns emerge. Confidence thresholds need tuning as training data grows.

---

## ADR-002: Regex for Field Extraction, ML for Classification

**Status:** Active

**Decision:** ML model determines action _type_ (what intent category). Regex/heuristics extract structured _fields_ (dates, amounts, service names) after classification.

**Why:** ML classifiers generalize across phrasing variations; they should not be expected to reliably extract precise structured data (dates, currency amounts). Regex is deterministic and auditable for field extraction. Mixing these concerns in one regex engine (the prior approach) made the logic brittle and hard to improve.

**Consequences:** Two separate maintenance surfaces. Adding a new action type requires both a new model class (+ training data) and a new extraction helper.

---

## ADR-003: All-Day Date Format for Midnight UTC Calendar Events

**Status:** Active

**Decision:** When creating Google Calendar events, dates that arrive as `T00:00:00Z` (midnight UTC) are converted to all-day `{ date: "YYYY-MM-DD" }` format instead of `{ dateTime: "..." }`.

**Why:** A `dateTime` of midnight UTC displays as the previous day in US timezones (e.g., UTC midnight = 8pm EST on the prior day). All-day events avoid timezone math entirely.

**Consequences:** Events created this way have no time component. If a future source provides a real time alongside a midnight UTC date, detection logic (`/T00:00:00(\.000)?Z$/`) must be updated.

---

## ADR-004: Self-Contained Feature Modules

**Status:** Active

**Decision:** Each feature lives in `features/<name>/` with its own hooks, components, and types. Features do not import from other features. Shared code goes in `lib/`.

**Why:** Prevents tangled dependency graphs. Makes it safe to delete or rewrite a feature without auditing cross-feature impact.

**Consequences:** Some duplication of utility patterns across features is acceptable. If patterns emerge in 3+ features, extract to `lib/`.

---

## ADR-005: Supabase Admin Client for Server-Side Routes Only

**Status:** Active

**Decision:** The Supabase service role key (admin client) is only used inside `/app/api/**` server routes. All client-side reads go through the anon key + RLS.

**Why:** The service role key bypasses RLS. Exposing it to the client would allow any user to read/write any row.

**Consequences:** All user-facing data access must have correct RLS policies. Admin routes must validate the requesting user's identity before acting on their behalf.

---

## ADR-006: sklearn 1.4.2 Pinned Across Training and Inference

**Status:** Active

**Decision:** `requirements.txt` pins `scikit-learn==1.4.2`. The venv must match exactly.

**Why:** sklearn raises `InconsistentVersionWarning` and can produce wrong results when a model is pickled with one version and loaded by another. Mismatches caused warnings with 1.4.1.post1 vs 1.4.2 pickles.

**Consequences:** Upgrading sklearn requires retraining and repickling all three models (`email_classifier.pkl`, `widget_suggester.pkl`, `action_extractor.pkl`).

---

## ADR-007: Action Confidence Threshold at 0.35

**Status:** Active

**Decision:** Actions with classifier confidence below 0.35 are dropped. `ignore` predictions always return no actions regardless of confidence.

**Why:** Initial threshold of 0.45 dropped legitimate payment emails (Klarna-style) that scored ~0.37. The `ignore` class acts as a safety net — lowering the threshold to 0.35 doesn't increase false positives meaningfully because genuinely irrelevant emails are still classified as `ignore`.

**Consequences:** As training data grows, the threshold may need revisiting. Monitor false positive rate for new email types.
