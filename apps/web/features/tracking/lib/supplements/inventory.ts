import type { SupplementInventory } from './inventoryTypes';
import { num, str } from './readers';

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

export function decrementInventory(
    definition: { inventory?: SupplementInventory },
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
