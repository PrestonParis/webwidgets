'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    evaluate,
    formatResult,
    validateExpression,
    backspaceExpression,
    autoClose,
} from '../lib/engine';
import {
    loadCalcState,
    debouncedSave,
    clearCalcHistory,
    exportHistory,
} from '../lib/storage';
import type {
    CalcMode,
    CalcState,
    HistoryEntry,
    AngleUnit,
    ProgrammerBase,
    FinancialInputs,
    DateTimeInputs,
    ProgrammerInputs,
} from '../types';
import {
    DEFAULT_FINANCIAL_INPUTS,
    DEFAULT_DATETIME_INPUTS,
    DEFAULT_PROGRAMMER_INPUTS,
} from '../types';

function nanoid() {
    return Math.random().toString(36).slice(2, 10);
}

function buildInitialState(widgetId?: string): CalcState {
    const persisted = loadCalcState(widgetId);
    return {
        expression: '',
        result: '',
        error: null,
        isResultShown: false,
        memory: persisted.memory,
        memoryHasValue: persisted.memory !== 0,
        settings: persisted.settings,
        history: persisted.history,
        exprStack: [],
        redoStack: [],
        financialInputs: { ...DEFAULT_FINANCIAL_INPUTS },
        dateTimeInputs: { ...DEFAULT_DATETIME_INPUTS },
        programmerInputs: { ...DEFAULT_PROGRAMMER_INPUTS },
    };
}

export function useCalculator(widgetId?: string) {
    const [state, setState] = useState<CalcState>(() =>
        buildInitialState(widgetId),
    );

    // Persist on state changes (debounced)
    useEffect(() => {
        debouncedSave(
            {
                history: state.history,
                memory: state.memory,
                settings: state.settings,
            },
            widgetId,
        );
    }, [state.history, state.memory, state.settings, widgetId]);

    // ── Live result ────────────────────────────────────────────────────────────
    const liveResult = useMemo(() => {
        if (!state.settings.liveMode || !state.expression) return '';
        const error = validateExpression(
            state.expression,
            state.settings.angleUnit,
        );
        if (error) return '';
        try {
            const val = evaluate(state.expression, state.settings.angleUnit);
            return formatResult(val, state.settings.precision);
        } catch {
            return '';
        }
    }, [
        state.expression,
        state.settings.liveMode,
        state.settings.angleUnit,
        state.settings.precision,
    ]);

    const displayResult = state.isResultShown ? state.result : liveResult;

    // ── Expression manipulation ────────────────────────────────────────────────

    const pushExpr = useCallback((next: string) => {
        setState((prev) => ({
            ...prev,
            exprStack: [...prev.exprStack.slice(-49), prev.expression],
            redoStack: [],
            expression: next,
            error: null,
        }));
    }, []);

    const appendToExpression = useCallback((char: string) => {
        setState((prev) => {
            const base = prev.isResultShown
                ? isOperatorChar(char)
                    ? prev.result
                    : ''
                : prev.expression;
            return {
                ...prev,
                exprStack: [...prev.exprStack.slice(-49), prev.expression],
                redoStack: [],
                expression: base + char,
                isResultShown: false,
                error: null,
            };
        });
    }, []);

    const clear = useCallback(() => {
        setState((prev) => ({
            ...prev,
            expression: '',
            result: '',
            error: null,
            isResultShown: false,
            exprStack: [],
            redoStack: [],
        }));
    }, []);

    const clearEntry = useCallback(() => {
        setState((prev) => ({
            ...prev,
            exprStack: [...prev.exprStack.slice(-49), prev.expression],
            redoStack: [],
            expression: backspaceExpression(prev.expression),
            isResultShown: false,
            error: null,
        }));
    }, []);

    const undo = useCallback(() => {
        setState((prev) => {
            if (prev.exprStack.length === 0) return prev;
            const top = prev.exprStack[prev.exprStack.length - 1]!;
            return {
                ...prev,
                expression: top,
                exprStack: prev.exprStack.slice(0, -1),
                redoStack: [prev.expression, ...prev.redoStack.slice(0, 49)],
                error: null,
                isResultShown: false,
            };
        });
    }, []);

    const redo = useCallback(() => {
        setState((prev) => {
            if (prev.redoStack.length === 0) return prev;
            const top = prev.redoStack[0]!;
            return {
                ...prev,
                expression: top,
                redoStack: prev.redoStack.slice(1),
                exprStack: [...prev.exprStack.slice(-49), prev.expression],
                error: null,
                isResultShown: false,
            };
        });
    }, []);

    // ── Calculate ─────────────────────────────────────────────────────────────

    const calculate = useCallback(() => {
        setState((prev) => {
            if (!prev.expression.trim()) return prev;
            const closed = autoClose(prev.expression);
            try {
                const val = evaluate(closed, prev.settings.angleUnit);
                const resultStr = formatResult(val, prev.settings.precision);
                const entry: HistoryEntry = {
                    id: nanoid(),
                    expression: prev.expression,
                    result: resultStr,
                    timestamp: Date.now(),
                    mode: prev.settings.mode,
                    pinned: false,
                };
                return {
                    ...prev,
                    result: resultStr,
                    error: null,
                    isResultShown: true,
                    history: [entry, ...prev.history].slice(0, 200),
                    exprStack: [...prev.exprStack.slice(-49), prev.expression],
                    redoStack: [],
                };
            } catch (e) {
                return {
                    ...prev,
                    error: e instanceof Error ? e.message : 'Error',
                    isResultShown: false,
                };
            }
        });
    }, []);

    // ── Negate / percentage ────────────────────────────────────────────────────

    const negate = useCallback(() => {
        setState((prev) => {
            const expr = prev.isResultShown ? prev.result : prev.expression;
            if (!expr) return prev;
            const toggled = expr.startsWith('-') ? expr.slice(1) : '-' + expr;
            return {
                ...prev,
                expression: toggled,
                exprStack: [...prev.exprStack.slice(-49), prev.expression],
                redoStack: [],
                isResultShown: false,
            };
        });
    }, []);

    // ── Memory ────────────────────────────────────────────────────────────────

    const memoryAction = useCallback((op: 'mc' | 'mr' | 'm+' | 'm-') => {
        setState((prev) => {
            const current =
                parseFloat(
                    prev.isResultShown ? prev.result : prev.expression,
                ) || 0;
            switch (op) {
                case 'mc':
                    return { ...prev, memory: 0, memoryHasValue: false };
                case 'mr':
                    return {
                        ...prev,
                        expression: formatResult(
                            prev.memory,
                            prev.settings.precision,
                        ),
                        isResultShown: false,
                    };
                case 'm+':
                    return {
                        ...prev,
                        memory: prev.memory + current,
                        memoryHasValue: true,
                    };
                case 'm-':
                    return {
                        ...prev,
                        memory: prev.memory - current,
                        memoryHasValue: true,
                    };
            }
        });
    }, []);

    // ── History ────────────────────────────────────────────────────────────────

    const loadFromHistory = useCallback(
        (expression: string, result: string) => {
            setState((prev) => ({
                ...prev,
                expression,
                result,
                isResultShown: true,
                error: null,
            }));
        },
        [],
    );

    const pinEntry = useCallback((id: string) => {
        setState((prev) => ({
            ...prev,
            history: prev.history.map((e) =>
                e.id === id ? { ...e, pinned: !e.pinned } : e,
            ),
        }));
    }, []);

    const deleteEntry = useCallback((id: string) => {
        setState((prev) => ({
            ...prev,
            history: prev.history.filter((e) => e.id !== id),
        }));
    }, []);

    const addNoteToEntry = useCallback((id: string, note: string) => {
        setState((prev) => ({
            ...prev,
            history: prev.history.map((e) =>
                e.id === id ? { ...e, note } : e,
            ),
        }));
    }, []);

    const clearHistoryAction = useCallback(() => {
        setState((prev) => {
            clearCalcHistory(widgetId);
            return { ...prev, history: prev.history.filter((e) => e.pinned) };
        });
    }, [widgetId]);

    const getExportText = useCallback(() => {
        return exportHistory(state.history);
    }, [state.history]);

    // ── Settings ──────────────────────────────────────────────────────────────

    const setMode = useCallback((mode: CalcMode) => {
        setState((prev) => ({ ...prev, settings: { ...prev.settings, mode } }));
    }, []);

    const setAngleUnit = useCallback((angleUnit: AngleUnit) => {
        setState((prev) => ({
            ...prev,
            settings: { ...prev.settings, angleUnit },
        }));
    }, []);

    const setPrecision = useCallback((precision: number) => {
        setState((prev) => ({
            ...prev,
            settings: { ...prev.settings, precision },
        }));
    }, []);

    const toggleLiveMode = useCallback(() => {
        setState((prev) => ({
            ...prev,
            settings: { ...prev.settings, liveMode: !prev.settings.liveMode },
        }));
    }, []);

    const setProgrammerBase = useCallback((base: ProgrammerBase) => {
        setState((prev) => ({
            ...prev,
            settings: { ...prev.settings, programmerBase: base },
        }));
    }, []);

    // ── Mode-specific inputs ───────────────────────────────────────────────────

    const updateFinancialInputs = useCallback(
        (patch: Partial<FinancialInputs>) => {
            setState((prev) => ({
                ...prev,
                financialInputs: { ...prev.financialInputs, ...patch },
            }));
        },
        [],
    );

    const updateDateTimeInputs = useCallback(
        (patch: Partial<DateTimeInputs>) => {
            setState((prev) => ({
                ...prev,
                dateTimeInputs: { ...prev.dateTimeInputs, ...patch },
            }));
        },
        [],
    );

    const updateProgrammerInputs = useCallback(
        (patch: Partial<ProgrammerInputs>) => {
            setState((prev) => ({
                ...prev,
                programmerInputs: { ...prev.programmerInputs, ...patch },
            }));
        },
        [],
    );

    // ── Keyboard handler (to be attached externally) ───────────────────────────

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;

            if (e.key === 'Escape') {
                e.preventDefault();
                clear();
                return;
            }
            if (e.key === 'Enter' || e.key === '=') {
                e.preventDefault();
                calculate();
                return;
            }
            if (e.key === 'Backspace') {
                e.preventDefault();
                clearEntry();
                return;
            }
            if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
                e.preventDefault();
                redo();
                return;
            }
            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                undo();
                return;
            }

            const allowed = '0123456789.+-*/^%()!,';
            if (
                allowed.includes(e.key) &&
                !e.ctrlKey &&
                !e.metaKey &&
                !e.altKey
            ) {
                e.preventDefault();
                appendToExpression(e.key);
            }
        },
        [clear, calculate, clearEntry, undo, redo, appendToExpression],
    );

    return {
        // State
        expression: state.expression,
        result: displayResult,
        rawResult: state.result,
        error: state.error,
        isResultShown: state.isResultShown,
        memory: state.memory,
        memoryHasValue: state.memoryHasValue,
        history: state.history,
        settings: state.settings,
        canUndo: state.exprStack.length > 0,
        canRedo: state.redoStack.length > 0,
        financialInputs: state.financialInputs,
        dateTimeInputs: state.dateTimeInputs,
        programmerInputs: state.programmerInputs,
        // Actions
        appendToExpression,
        pushExpr,
        clear,
        clearEntry,
        undo,
        redo,
        calculate,
        negate,
        memoryAction,
        loadFromHistory,
        pinEntry,
        deleteEntry,
        addNoteToEntry,
        clearHistory: clearHistoryAction,
        getExportText,
        setMode,
        setAngleUnit,
        setPrecision,
        toggleLiveMode,
        setProgrammerBase,
        updateFinancialInputs,
        updateDateTimeInputs,
        updateProgrammerInputs,
        handleKeyDown,
    };
}

export type CalcControls = ReturnType<typeof useCalculator>;

function isOperatorChar(ch: string): boolean {
    return '+-*/^%'.includes(ch);
}
