'use client';

import { useState } from 'react';
import { Copy, Check, RotateCcw, RotateCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { validateExpression } from '../lib/engine';
import type { AngleUnit } from '../types/calculator';

interface CalculatorDisplayProps {
    expression: string;
    result: string;
    error: string | null;
    isResultShown: boolean;
    angleUnit: AngleUnit;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    compact?: boolean;
}

export function CalculatorDisplay({
    expression,
    result,
    error,
    isResultShown,
    angleUnit,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    compact = false,
}: CalculatorDisplayProps) {
    const [copied, setCopied] = useState(false);

    const isValid =
        !expression || validateExpression(expression, angleUnit) === null;
    const showResult = result && (isResultShown || result !== expression);

    function copyResult() {
        const text = result || expression;
        if (!text) return;
        void navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }

    return (
        <div
            className={cn(
                'relative rounded-2xl bg-zinc-900 dark:bg-zinc-950 text-right select-none',
                compact ? 'px-4 py-3 min-h-[5rem]' : 'px-5 py-4 min-h-[7rem]',
            )}
        >
            {/* Undo / Redo */}
            <div className="absolute top-2 left-2 flex items-center gap-1">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                    className={cn(
                        'flex items-center justify-center w-6 h-6 rounded-lg text-zinc-500 transition-colors',
                        canUndo
                            ? 'hover:text-zinc-300 hover:bg-zinc-800'
                            : 'opacity-30 cursor-not-allowed',
                    )}
                >
                    <RotateCcw size={12} />
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="Redo (Ctrl+Shift+Z)"
                    className={cn(
                        'flex items-center justify-center w-6 h-6 rounded-lg text-zinc-500 transition-colors',
                        canRedo
                            ? 'hover:text-zinc-300 hover:bg-zinc-800'
                            : 'opacity-30 cursor-not-allowed',
                    )}
                >
                    <RotateCw size={12} />
                </button>
            </div>

            {/* Copy button */}
            {(result || expression) && (
                <button
                    onClick={copyResult}
                    title="Copy result"
                    className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                    {copied ? (
                        <Check size={12} className="text-green-400" />
                    ) : (
                        <Copy size={12} />
                    )}
                </button>
            )}

            {/* Expression */}
            <div
                className={cn(
                    'mt-4 font-mono truncate transition-colors',
                    compact ? 'text-sm' : 'text-base',
                    error
                        ? 'text-red-400'
                        : isValid
                          ? 'text-zinc-400'
                          : 'text-amber-400',
                )}
            >
                {error ? (
                    <span className="flex items-center justify-end gap-1.5 text-red-400">
                        <AlertCircle size={13} />
                        <span className="text-xs">{error}</span>
                    </span>
                ) : (
                    expression || <span className="text-zinc-600">0</span>
                )}
            </div>

            {/* Result */}
            <div
                className={cn(
                    'font-bold tabular-nums transition-all',
                    compact ? 'text-3xl' : 'text-4xl',
                    isResultShown
                        ? 'text-white'
                        : showResult
                          ? 'text-zinc-300'
                          : 'text-zinc-600',
                )}
            >
                {showResult ? result : expression ? '' : '0'}
            </div>
        </div>
    );
}
