import type {
    AllergySeverity,
    AllergyTrigger,
    PainType,
    Severity,
    SicknessType,
    TemperatureUnit,
} from './types';

export function str(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function num(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
}

export function severity(value: unknown): Severity | undefined {
    const parsed = num(value);
    if (parsed === undefined) return undefined;
    return Math.max(1, Math.min(10, Math.round(parsed))) as Severity;
}

export function bool(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return false;
}

const PAIN_TYPES: PainType[] = ['soreness', 'injury'];
const SICKNESS_TYPES: SicknessType[] = [
    'cold',
    'flu',
    'gi',
    'migraine',
    'allergy',
    'headache',
    'fatigue',
    'other',
];
const ALLERGY_TRIGGERS: AllergyTrigger[] = [
    'pollen',
    'dust',
    'pet',
    'food',
    'mold',
    'medication',
    'insect',
    'other',
];
const ALLERGY_SEVERITIES: AllergySeverity[] = ['mild', 'moderate', 'severe'];

export function painType(value: unknown): PainType {
    const raw = str(value)?.toLowerCase();
    return raw && (PAIN_TYPES as string[]).includes(raw)
        ? (raw as PainType)
        : 'soreness';
}

export function sicknessType(value: unknown): SicknessType {
    const raw = str(value)?.toLowerCase();
    return raw && (SICKNESS_TYPES as string[]).includes(raw)
        ? (raw as SicknessType)
        : 'other';
}

export function allergyTrigger(value: unknown): AllergyTrigger {
    const raw = str(value)?.toLowerCase();
    return raw && (ALLERGY_TRIGGERS as string[]).includes(raw)
        ? (raw as AllergyTrigger)
        : 'other';
}

export function allergySeverity(value: unknown): AllergySeverity {
    const raw = str(value)?.toLowerCase();
    return raw && (ALLERGY_SEVERITIES as string[]).includes(raw)
        ? (raw as AllergySeverity)
        : 'mild';
}

export function temperatureUnit(value: unknown): TemperatureUnit {
    return str(value)?.toUpperCase() === 'C' ? 'C' : 'F';
}

export function lerpHex(from: string, to: string, t: number): string {
    const clamp = Math.max(0, Math.min(1, t));
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    return `rgb(${Math.round(a.r + (b.r - a.r) * clamp)}, ${Math.round(a.g + (b.g - a.g) * clamp)}, ${Math.round(a.b + (b.b - a.b) * clamp)})`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const clean = hex.replace('#', '');
    return {
        r: parseInt(clean.slice(0, 2), 16),
        g: parseInt(clean.slice(2, 4), 16),
        b: parseInt(clean.slice(4, 6), 16),
    };
}
