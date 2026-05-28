import type { DietaryFlags, Ingredient } from './ingredientTypes';

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

export { str, num, bool, list, ingredients, dietaryFlags };
