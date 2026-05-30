# 028 - ML: Memorization Card Generator

Status: Available
Assigned Agent: Unassigned
Stage: 2
Priority: High

## Objective

Build an ML/text-processing service that turns highlights, notes, tutorial lessons, and knowledge graph entries into spaced-repetition cards for the Memorization feature.

## Context

- `features/memorization/` contains deck, routine, and review-card UI.
- `features/reading/` produces highlights and notes.
- `features/knowledge/` stores knowledge items and research concepts.
- `features/tutorials/` has guided lessons that can become workflow drills.

## Required Implementation

1. Add deterministic generation module `ml_service/memory_card_generator.py`.
   - Extract cloze cards from source text.
   - Generate Q/A cards from sentences with definitions, decisions, and concepts.
   - Produce card difficulty hints from source length and entity density.
2. Add optional trained classifier `ml_service/train_memory_card_quality.py`.
   - Training data: `ml_service/data/memory_card_quality.json`.
   - Labels: `keep`, `revise`, `discard`.
   - Features: TF-IDF on front/back/source + numeric lengths.
3. Add schemas:
   - `MemorySourceItem`
   - `GeneratedMemoryCard`
   - `GenerateMemoryCardsRequest`
   - `GenerateMemoryCardsResponse`
4. Add endpoint `POST /generate-memory-cards`.
5. Add Next proxy `app/api/ml/generate-memory-cards/route.ts`.
6. Wire Memorization page import actions to call the endpoint and append generated cards to the local review queue.

## Validation

- A reading highlight produces at least one useful Q/A card.
- A tutorial checklist produces workflow drill cards.
- Empty or very short input returns a safe empty response with a reason.
- UI gracefully falls back to deterministic local examples when ML is unavailable.
