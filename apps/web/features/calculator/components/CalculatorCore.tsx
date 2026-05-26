'use client';

import { useEffect, useRef, useState } from 'react';
import { History, Settings2, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useCalculator, type CalcControls } from '../hooks/useCalculator';
import { CalculatorDisplay } from './CalculatorDisplay';
import { CalculatorHistory } from './CalculatorHistory';
import { BasicMode } from './modes/BasicMode';
import { ScientificMode } from './modes/ScientificMode';
import { ProgrammerMode } from './modes/ProgrammerMode';
import { FinancialMode } from './modes/FinancialMode';
import { DateTimeMode } from './modes/DateTimeMode';
import { exportHistory } from '../lib/storage';
import type { CalcMode } from '../types';

const MODE_LABELS: Record<CalcMode, string> = {
    basic: 'Basic',
    scientific: 'Scientific',
    programmer: 'Programmer',
    financial: 'Financial',
    datetime: 'Date & Time',
};

interface CalculatorCoreProps {
    widgetId?: string;
    compact?: boolean;
    /** If true, shows the full-page expanded layout with sidebar history */
    expanded?: boolean;
}

export function CalculatorCore({
    widgetId,
    compact = false,
    expanded = false,
}: CalculatorCoreProps) {
    const calc = useCalculator(widgetId);
    const [showHistory, setShowHistory] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [modeOpen, setModeOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Keyboard support
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Only intercept if focus is within the calculator or no input is focused
            const active = document.activeElement as HTMLElement | null;
            const inInput =
                active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';
            if (inInput && !containerRef.current?.contains(active)) return;
            calc.handleKeyDown(e);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [calc.handleKeyDown]);

    function handleExport() {
        const text = exportHistory(calc.history);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'calculator-history.txt';
        a.click();
        URL.revokeObjectURL(url);
    }

    const modeContent = (
        <>
            {calc.settings.mode === 'basic' && (
                <BasicMode calc={calc} compact={compact} />
            )}
            {calc.settings.mode === 'scientific' && (
                <ScientificMode calc={calc} compact={compact} />
            )}
            {calc.settings.mode === 'programmer' && (
                <ProgrammerMode calc={calc} />
            )}
            {calc.settings.mode === 'financial' && (
                <FinancialMode calc={calc} />
            )}
            {calc.settings.mode === 'datetime' && <DateTimeMode calc={calc} />}
        </>
    );

    const historyPanel = (
        <CalculatorHistory
            entries={calc.history}
            onUse={(expr, result) => {
                calc.loadFromHistory(expr, result);
                setShowHistory(false);
            }}
            onPin={calc.pinEntry}
            onDelete={calc.deleteEntry}
            onClear={calc.clearHistory}
            onExport={handleExport}
            onAddNote={calc.addNoteToEntry}
            compact={compact}
        />
    );

    if (expanded) {
        // Full-page layout: two-column with history sidebar
        return (
            <div ref={containerRef} className="flex gap-6">
                {/* Left: Calculator */}
                <div className="flex-1 min-w-0 space-y-3">
                    <ModeSelector
                        mode={calc.settings.mode}
                        onSelect={calc.setMode}
                        open={modeOpen}
                        setOpen={setModeOpen}
                    />
                    <CalculatorDisplay
                        expression={calc.expression}
                        result={calc.result}
                        error={calc.error}
                        isResultShown={calc.isResultShown}
                        angleUnit={calc.settings.angleUnit}
                        canUndo={calc.canUndo}
                        canRedo={calc.canRedo}
                        onUndo={calc.undo}
                        onRedo={calc.redo}
                    />
                    {modeContent}
                    <SettingsPanel calc={calc} show={true} />
                </div>

                {/* Right: History */}
                <div className="w-72 shrink-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
                        History
                    </p>
                    {historyPanel}
                </div>
            </div>
        );
    }

    // Compact / widget layout
    return (
        <div ref={containerRef} className="space-y-2">
            {/* Mode + toolbar row */}
            <div className="flex items-center justify-between gap-2">
                <div className="relative">
                    <button
                        onClick={() => setModeOpen(!modeOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        {MODE_LABELS[calc.settings.mode]}
                        <ChevronDown size={11} />
                    </button>
                    {modeOpen && (
                        <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 min-w-40">
                            {(Object.keys(MODE_LABELS) as CalcMode[]).map(
                                (m) => (
                                    <button
                                        key={m}
                                        onClick={() => {
                                            calc.setMode(m);
                                            setModeOpen(false);
                                        }}
                                        className={cn(
                                            'w-full text-left px-4 py-2 text-xs font-semibold transition-colors',
                                            calc.settings.mode === m
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800',
                                        )}
                                    >
                                        {MODE_LABELS[m]}
                                    </button>
                                ),
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        title="Settings"
                        className={cn(
                            'flex items-center justify-center w-7 h-7 rounded-xl transition-colors',
                            showSettings
                                ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100'
                                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200',
                        )}
                    >
                        <Settings2 size={13} />
                    </button>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        title="History"
                        className={cn(
                            'flex items-center justify-center w-7 h-7 rounded-xl transition-colors',
                            showHistory
                                ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100'
                                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200',
                        )}
                    >
                        <History size={13} />
                    </button>
                    {(showHistory || showSettings) && (
                        <button
                            onClick={() => {
                                setShowHistory(false);
                                setShowSettings(false);
                            }}
                            className="flex items-center justify-center w-7 h-7 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>
            </div>

            {/* Settings panel */}
            {showSettings && <SettingsPanel calc={calc} show />}

            {/* Display */}
            <CalculatorDisplay
                expression={calc.expression}
                result={calc.result}
                error={calc.error}
                isResultShown={calc.isResultShown}
                angleUnit={calc.settings.angleUnit}
                canUndo={calc.canUndo}
                canRedo={calc.canRedo}
                onUndo={calc.undo}
                onRedo={calc.redo}
                compact={compact}
            />

            {/* History panel (replaces keypad when open) */}
            {showHistory ? historyPanel : modeContent}
        </div>
    );
}

function ModeSelector({
    mode,
    onSelect,
    open,
    setOpen,
}: {
    mode: CalcMode;
    onSelect: (m: CalcMode) => void;
    open: boolean;
    setOpen: (v: boolean) => void;
}) {
    return (
        <div className="flex gap-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-1">
            {(Object.keys(MODE_LABELS) as CalcMode[]).map((m) => (
                <button
                    key={m}
                    onClick={() => onSelect(m)}
                    className={cn(
                        'flex-1 py-1.5 text-xs font-semibold rounded-xl transition-colors',
                        mode === m
                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
                    )}
                >
                    {MODE_LABELS[m]}
                </button>
            ))}
        </div>
    );
}

function SettingsPanel({ calc, show }: { calc: CalcControls; show: boolean }) {
    if (!show) return null;
    return (
        <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-3 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Calculator Settings
            </p>
            <div className="grid grid-cols-2 gap-3">
                {/* Precision */}
                <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        Decimal places ({calc.settings.precision})
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={15}
                        value={calc.settings.precision}
                        onChange={(e) =>
                            calc.setPrecision(parseInt(e.target.value))
                        }
                        className="accent-blue-600"
                    />
                </label>

                {/* Live mode */}
                <label className="flex items-start gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={calc.settings.liveMode}
                        onChange={calc.toggleLiveMode}
                        className="mt-0.5 accent-blue-600"
                    />
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 leading-tight">
                        Live calculate while typing
                    </span>
                </label>
            </div>
        </div>
    );
}
