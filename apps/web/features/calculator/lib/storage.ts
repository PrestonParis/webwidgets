import type {
    CalcPersistedState,
    HistoryEntry,
    CalcSettings,
} from '../types/calculator';
import { DEFAULT_SETTINGS } from '../types/calculator';

const STORAGE_KEY = 'calculator_state';
const MAX_HISTORY = 200;

function key(widgetId?: string) {
    return widgetId ? `${STORAGE_KEY}_${widgetId}` : STORAGE_KEY;
}

export function loadCalcState(widgetId?: string): CalcPersistedState {
    if (typeof window === 'undefined') return empty();
    try {
        const raw = localStorage.getItem(key(widgetId));
        if (!raw) return empty();
        const parsed = JSON.parse(raw) as Partial<CalcPersistedState>;
        return {
            history: Array.isArray(parsed.history) ? parsed.history : [],
            memory: typeof parsed.memory === 'number' ? parsed.memory : 0,
            settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
        };
    } catch {
        return empty();
    }
}

export function saveCalcState(
    state: CalcPersistedState,
    widgetId?: string,
): void {
    if (typeof window === 'undefined') return;
    try {
        const trimmed: CalcPersistedState = {
            ...state,
            history: state.history.slice(0, MAX_HISTORY),
        };
        localStorage.setItem(key(widgetId), JSON.stringify(trimmed));
    } catch {
        // Quota exceeded — silently ignore
    }
}

export function saveHistory(history: HistoryEntry[], widgetId?: string): void {
    const state = loadCalcState(widgetId);
    saveCalcState({ ...state, history }, widgetId);
}

export function saveSettings(settings: CalcSettings, widgetId?: string): void {
    const state = loadCalcState(widgetId);
    saveCalcState({ ...state, settings }, widgetId);
}

export function saveMemory(memory: number, widgetId?: string): void {
    const state = loadCalcState(widgetId);
    saveCalcState({ ...state, memory }, widgetId);
}

export function clearCalcHistory(widgetId?: string): void {
    const state = loadCalcState(widgetId);
    // Keep pinned entries
    saveCalcState(
        { ...state, history: state.history.filter((e) => e.pinned) },
        widgetId,
    );
}

/** Export history as plain text. */
export function exportHistory(history: HistoryEntry[]): string {
    return history
        .map((e) => {
            const date = new Date(e.timestamp).toLocaleString();
            return `[${date}] ${e.expression} = ${e.result}${e.note ? `\n  Note: ${e.note}` : ''}`;
        })
        .join('\n');
}

function empty(): CalcPersistedState {
    return { history: [], memory: 0, settings: { ...DEFAULT_SETTINGS } };
}

// Debounce helper for writes
let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function debouncedSave(
    state: CalcPersistedState,
    widgetId?: string,
    delay = 600,
): void {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveCalcState(state, widgetId), delay);
}
