import type { TrackingEntry } from '@/features/tracking/types/tracking';
import type { Supplement as StoredSupplement } from '@/features/tracking/types/supplement';
import type {
    DietaryFlags,
    DoseStatus,
    Ingredient,
    SupplementDefinition,
    EffectivenessCheckIn,
    OutcomeTarget,
    SupplementForm,
    SupplementInventory,
    SupplementLog,
    SupplementSchedule,
    SideEffectLog,
} from './types';

function str(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function num(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
}

function bool(value: unknown): boolean | undefined {
    return typeof value === 'boolean' ? value : undefined;
}

function list(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value
            .filter(
                (item): item is string =>
                    typeof item === 'string' && item.trim() !== '',
            )
            .map((item) => item.trim());
    }
    if (typeof value === 'string' && value.trim()) {
        return value
            .split(/[,;]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
}

function ingredients(value: unknown, active: boolean): Ingredient[] {
    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (typeof item === 'string') return { name: item, active };
                if (item && typeof item === 'object') {
                    const record = item as Record<string, unknown>;
                    const name = str(record['name']);
                    if (!name) return null;
                    const ingredient: Ingredient = { name, active };
                    const amount = num(record['amount']);
                    const unit = str(record['unit']);
                    if (amount !== undefined) ingredient.amount = amount;
                    if (unit !== undefined) ingredient.unit = unit;
                    return ingredient;
                }
                return null;
            })
            .filter((item): item is Ingredient => item !== null);
    }
    return list(value).map((name) => ({ name, active }));
}

function dietaryFlags(meta: Record<string, unknown>): DietaryFlags {
    const flags: DietaryFlags = {};
    const vegan = bool(meta['vegan']);
    const vegetarian = bool(meta['vegetarian']);
    const glutenFree = bool(meta['glutenFree']);
    const dairyFree = bool(meta['dairyFree']);
    const soyFree = bool(meta['soyFree']);
    const nutFree = bool(meta['nutFree']);
    const shellfishFree = bool(meta['shellfishFree']);
    if (vegan !== undefined) flags.vegan = vegan;
    if (vegetarian !== undefined) flags.vegetarian = vegetarian;
    if (glutenFree !== undefined) flags.glutenFree = glutenFree;
    if (dairyFree !== undefined) flags.dairyFree = dairyFree;
    if (soyFree !== undefined) flags.soyFree = soyFree;
    if (nutFree !== undefined) flags.nutFree = nutFree;
    if (shellfishFree !== undefined) flags.shellfishFree = shellfishFree;
    return flags;
}

export function defaultSchedule(time = '08:00'): SupplementSchedule {
    return {
        frequency: 'daily',
        times: [time],
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
}

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

export function normalizeInventory(
    meta: Record<string, unknown>,
): SupplementInventory | null {
    const quantityRemaining = num(meta['quantityRemaining']);
    const dosesRemaining = num(meta['dosesRemaining']);
    if (quantityRemaining === undefined && dosesRemaining === undefined)
        return null;
    const inventory: SupplementInventory = {
        quantityRemaining: quantityRemaining ?? dosesRemaining ?? 0,
        dosesRemaining: dosesRemaining ?? quantityRemaining ?? 0,
        reorderThreshold: num(meta['reorderThreshold']) ?? 7,
        adjustmentHistory: Array.isArray(meta['adjustmentHistory'])
            ? (meta[
                  'adjustmentHistory'
              ] as SupplementInventory['adjustmentHistory'])
            : [],
    };
    const doseSize = num(meta['doseSize']);
    const expirationDate = str(meta['expirationDate']);
    const storageLocation = str(meta['storageLocation']);
    const supplier = str(meta['supplier']);
    const cost = num(meta['cost']);
    if (doseSize !== undefined) inventory.doseSize = doseSize;
    if (expirationDate !== undefined) inventory.expirationDate = expirationDate;
    if (storageLocation !== undefined)
        inventory.storageLocation = storageLocation;
    if (supplier !== undefined) inventory.supplier = supplier;
    if (cost !== undefined) inventory.cost = cost;
    return inventory;
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

export function decrementInventory(
    definition: SupplementDefinition,
    doses = 1,
): SupplementInventory | null {
    if (!definition.inventory) return null;
    return {
        ...definition.inventory,
        quantityRemaining: Math.max(
            0,
            definition.inventory.quantityRemaining - doses,
        ),
        dosesRemaining: Math.max(
            0,
            definition.inventory.dosesRemaining - doses,
        ),
        adjustmentHistory: [
            ...definition.inventory.adjustmentHistory,
            {
                date: new Date().toISOString(),
                delta: -doses,
                reason: 'Dose marked taken',
            },
        ],
    };
}
