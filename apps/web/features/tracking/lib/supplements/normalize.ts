import type { TrackingEntry } from '@/features/tracking/types/trackingEntryTypes';
import type { Supplement as StoredSupplement } from '@/features/tracking/types/supplement';
import type { DoseStatus, OutcomeTarget, SupplementForm } from './baseTypes';
import type { SupplementDefinition } from './definitionTypes';
import type {
    EffectivenessCheckIn,
    SupplementLog,
    SideEffectLog,
} from './logTypes';
import { str, num, list, ingredients, dietaryFlags } from './readers';
import { normalizeInventory, decrementInventory } from './inventory';
import { defaultSchedule } from './schedule';

export { decrementInventory, defaultSchedule };

export function supplementDefinitionFromStored(
    supplement: StoredSupplement,
): SupplementDefinition {
    const schedule = defaultSchedule(supplement.scheduleStart);
    if (
        supplement.scheduleEnd &&
        supplement.scheduleEnd !== supplement.scheduleStart
    ) {
        schedule.times = [supplement.scheduleStart, supplement.scheduleEnd];
    }
    return {
        id: supplement.id,
        name: supplement.name,
        ...(supplement.dose !== undefined && { servingSize: supplement.dose }),
        activeIngredients: [],
        inactiveIngredients: [],
        allergens: [],
        dietaryFlags: {},
        verified: false,
        sourceProvider: 'manual',
        schedule,
        tags: [],
        sourceSupplement: supplement,
    };
}

export function normalizeSupplementDefinitions(
    stored: StoredSupplement[],
    entries: TrackingEntry[],
): SupplementDefinition[] {
    const map = new Map<string, SupplementDefinition>();
    for (const supplement of stored)
        map.set(
            supplement.name.toLowerCase(),
            supplementDefinitionFromStored(supplement),
        );
    for (const entry of entries) {
        if (entry.category !== 'supplement') continue;
        const meta = entry.metadata;
        const name = str(meta['name'] ?? meta['supplementName']);
        if (!name) continue;
        const id =
            str(meta['supplementId']) ??
            name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const existing = map.get(name.toLowerCase());
        const schedule =
            existing?.schedule ?? defaultSchedule(str(meta['time']) ?? '08:00');
        const inventory = normalizeInventory(meta);
        const definition: SupplementDefinition = {
            id: existing?.id ?? id,
            name,
            activeIngredients: ingredients(meta['activeIngredients'], true),
            inactiveIngredients: ingredients(
                meta['inactiveIngredients'],
                false,
            ),
            allergens: list(meta['allergens']),
            dietaryFlags: dietaryFlags(meta),
            verified: meta['verified'] === true,
            sourceProvider:
                str(meta['sourceProvider']) ??
                existing?.sourceProvider ??
                'manual',
            schedule,
            tags: entry.tags,
        };
        const brand = str(meta['brand']);
        const form = str(meta['form']);
        const doseAmount = num(meta['doseAmount']);
        const doseUnit = str(meta['doseUnit']);
        const servingSize = str(meta['servingSize'] ?? meta['dose']);
        const barcode = str(meta['barcode']);
        const reason = str(meta['reason']);
        const targetOutcome = str(meta['targetOutcome']);
        const baselineScore = num(meta['baselineScore']);
        if (brand !== undefined) definition.brand = brand;
        if (form !== undefined) definition.form = form as SupplementForm;
        if (doseAmount !== undefined) definition.doseAmount = doseAmount;
        if (doseUnit !== undefined) definition.doseUnit = doseUnit;
        if (servingSize !== undefined) definition.servingSize = servingSize;
        if (barcode !== undefined) definition.barcode = barcode;
        if (reason !== undefined) definition.reason = reason;
        if (targetOutcome !== undefined)
            definition.targetOutcome = targetOutcome as OutcomeTarget;
        if (baselineScore !== undefined)
            definition.baselineScore = baselineScore;
        if (inventory !== null) definition.inventory = inventory;
        if (entry.notes !== undefined) definition.notes = entry.notes;
        if (existing?.sourceSupplement !== undefined)
            definition.sourceSupplement = existing.sourceSupplement;
        map.set(name.toLowerCase(), { ...existing, ...definition });
    }
    return [...map.values()].filter(
        (definition) => !definition.schedule.archived,
    );
}

export function normalizeSupplementLog(
    entry: TrackingEntry,
): SupplementLog | null {
    if (entry.category !== 'supplement') return null;
    const meta = entry.metadata;
    const name = str(meta['name'] ?? meta['supplementName']);
    if (!name) return null;
    const explicitStatus = str(meta['status']) as DoseStatus | undefined;
    const status: DoseStatus =
        explicitStatus ??
        (meta['taken'] === true
            ? 'taken'
            : meta['taken'] === false
              ? 'skipped'
              : 'planned');
    const sideEffects: SideEffectLog[] = Array.isArray(meta['sideEffects'])
        ? meta['sideEffects']
              .filter(
                  (item): item is Record<string, unknown> =>
                      !!item && typeof item === 'object',
              )
              .map((item) => {
                  const sideEffect: SideEffectLog = {
                      name: str(item['name']) ?? 'Side effect',
                      severity: num(item['severity']) ?? 1,
                  };
                  const timingMinutesAfterDose = num(
                      item['timingMinutesAfterDose'],
                  );
                  const notes = str(item['notes']);
                  if (timingMinutesAfterDose !== undefined)
                      sideEffect.timingMinutesAfterDose =
                          timingMinutesAfterDose;
                  if (notes !== undefined) sideEffect.notes = notes;
                  return sideEffect;
              })
        : [];
    const effectiveness: EffectivenessCheckIn | undefined =
        num(meta['outcomeRating']) !== undefined ||
        num(meta['perceivedEffectiveness']) !== undefined
            ? {
                  date: entry.entryDate,
                  targetOutcome: (str(meta['targetOutcome']) ??
                      'other') as EffectivenessCheckIn['targetOutcome'],
                  outcomeRating: num(meta['outcomeRating']) ?? 0,
                  perceivedEffectiveness:
                      num(meta['perceivedEffectiveness']) ?? 0,
              }
            : undefined;
    if (effectiveness) {
        const notes = str(meta['effectivenessNotes']);
        if (notes !== undefined) effectiveness.notes = notes;
    }
    const log: SupplementLog = {
        id: entry.id,
        name,
        date: entry.entryDate,
        status,
        tags: entry.tags,
        source: entry.source,
        sideEffects,
        rawEntry: entry,
    };
    const supplementId = str(meta['supplementId']);
    const brand = str(meta['brand']);
    const time = str(meta['time']);
    const doseAmount = num(meta['doseAmount']);
    const doseUnit = str(meta['doseUnit']);
    const servingSize = str(meta['servingSize'] ?? meta['dose']);
    const skipReason = str(meta['skipReason']);
    const sourceProvider = str(meta['sourceProvider']);
    if (supplementId !== undefined) log.supplementId = supplementId;
    if (brand !== undefined) log.brand = brand;
    if (time !== undefined) log.time = time;
    if (doseAmount !== undefined) log.doseAmount = doseAmount;
    if (doseUnit !== undefined) log.doseUnit = doseUnit;
    if (servingSize !== undefined) log.servingSize = servingSize;
    if (skipReason !== undefined) log.skipReason = skipReason;
    if (entry.notes !== undefined) log.notes = entry.notes;
    if (sourceProvider !== undefined) log.sourceProvider = sourceProvider;
    if (effectiveness !== undefined) log.effectiveness = effectiveness;
    return log;
}

export function normalizeSupplementLogs(
    entries: TrackingEntry[],
): SupplementLog[] {
    return entries
        .map(normalizeSupplementLog)
        .filter((log): log is SupplementLog => log !== null)
        .sort(
            (a, b) =>
                b.date.localeCompare(a.date) ||
                (b.time ?? '').localeCompare(a.time ?? ''),
        );
}
