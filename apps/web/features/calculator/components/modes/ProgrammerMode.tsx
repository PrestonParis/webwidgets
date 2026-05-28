'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils/utils';
import type { CalcControls } from '../../hooks/useCalculator';
import type { ProgrammerBase } from '../../types/calculator';
import { evaluate } from '../../lib/engine';

interface ProgrammerModeProps {
    calc: CalcControls;
}

const BASE_LABELS: Record<ProgrammerBase, string> = {
    2: 'BIN',
    8: 'OCT',
    10: 'DEC',
    16: 'HEX',
};

function toBase(n: number, base: ProgrammerBase): string {
    if (!Number.isInteger(n) || !isFinite(n)) return '—';
    const i = Math.trunc(n);
    switch (base) {
        case 2:
            return i.toString(2).toUpperCase();
        case 8:
            return i.toString(8).toUpperCase();
        case 10:
            return i.toString(10);
        case 16:
            return i.toString(16).toUpperCase();
    }
}

function parseInput(s: string, base: ProgrammerBase): number | null {
    if (!s) return null;
    const n = parseInt(s.replace(/\s/g, ''), base);
    return isNaN(n) ? null : n;
}

export function ProgrammerMode({ calc }: ProgrammerModeProps) {
    const [inputBase, setInputBase] = useState<ProgrammerBase>(10);
    const [inputValue, setInputValue] = useState('');
    const [bitwiseA, setBitwiseA] = useState('');
    const [bitwiseB, setBitwiseB] = useState('');
    const [bitwiseOp, setBitwiseOp] = useState<
        'AND' | 'OR' | 'XOR' | 'NOT' | 'LSHIFT' | 'RSHIFT'
    >('AND');
    const [bitwiseResult, setBitwiseResult] = useState<string | null>(null);

    // Try to evaluate the expression from calc
    const evalNum = useMemo(() => {
        if (!calc.expression) return null;
        try {
            const v = evaluate(calc.expression);
            return Number.isInteger(v) ? v : null;
        } catch {
            return null;
        }
    }, [calc.expression]);

    const displayNum = evalNum ?? parseInput(inputValue, inputBase);

    const bases: ProgrammerBase[] = [10, 16, 8, 2];

    function applyBitwise() {
        const a = parseInt(bitwiseA, 10);
        const b = parseInt(bitwiseB, 10);
        if (isNaN(a)) return;
        let res: number;
        switch (bitwiseOp) {
            case 'AND':
                res = a & b;
                break;
            case 'OR':
                res = a | b;
                break;
            case 'XOR':
                res = a ^ b;
                break;
            case 'NOT':
                res = ~a;
                break;
            case 'LSHIFT':
                res = a << b;
                break;
            case 'RSHIFT':
                res = a >> b;
                break;
        }
        setBitwiseResult(res.toString());
        calc.pushExpr(res.toString());
    }

    const hexDigits = ['A', 'B', 'C', 'D', 'E', 'F'];
    const allowedChars: Record<ProgrammerBase, RegExp> = {
        2: /^[01]*$/,
        8: /^[0-7]*$/,
        10: /^-?[0-9]*$/,
        16: /^[0-9a-fA-F]*$/,
    };

    return (
        <div className="space-y-4">
            {/* Base conversion display */}
            <div className="rounded-2xl bg-zinc-900 dark:bg-zinc-950 p-4 space-y-2">
                {bases.map((base) => (
                    <div key={base} className="flex items-center gap-3">
                        <span
                            className={cn(
                                'text-[10px] font-bold w-7 text-right shrink-0',
                                inputBase === base
                                    ? 'text-blue-400'
                                    : 'text-zinc-500',
                            )}
                        >
                            {BASE_LABELS[base]}
                        </span>
                        <span
                            className={cn(
                                'flex-1 font-mono text-sm text-right',
                                displayNum !== null
                                    ? 'text-zinc-100'
                                    : 'text-zinc-600',
                            )}
                        >
                            {displayNum !== null
                                ? toBase(displayNum, base)
                                : '—'}
                        </span>
                        <button
                            onClick={() => {
                                if (displayNum !== null) {
                                    setInputValue(toBase(displayNum, base));
                                    setInputBase(base);
                                    calc.pushExpr(displayNum.toString());
                                }
                            }}
                            className="text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors"
                        >
                            Use
                        </button>
                    </div>
                ))}
            </div>

            {/* Manual base entry */}
            <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Enter in base
                </p>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        {bases.map((b) => (
                            <button
                                key={b}
                                onClick={() => {
                                    setInputBase(b);
                                    setInputValue('');
                                }}
                                className={cn(
                                    'px-3 py-1.5 text-xs font-semibold transition-colors',
                                    inputBase === b
                                        ? 'bg-blue-600 text-white'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
                                )}
                            >
                                {BASE_LABELS[b]}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            const v = e.target.value.toUpperCase();
                            if (allowedChars[inputBase].test(v)) {
                                setInputValue(v);
                                const n = parseInput(v, inputBase);
                                if (n !== null) calc.pushExpr(n.toString());
                            }
                        }}
                        placeholder={`Enter ${BASE_LABELS[inputBase]}`}
                        className="flex-1 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm font-mono outline-none text-zinc-800 dark:text-zinc-200"
                    />
                </div>
                {/* Hex digit buttons */}
                {inputBase === 16 && (
                    <div className="grid grid-cols-6 gap-1">
                        {hexDigits.map((d) => (
                            <button
                                key={d}
                                onClick={() =>
                                    setInputValue((v) => {
                                        const next = v + d;
                                        const n = parseInput(next, 16);
                                        if (n !== null)
                                            calc.pushExpr(n.toString());
                                        return next;
                                    })
                                }
                                className="py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm font-mono font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Bitwise operations */}
            <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Bitwise Operations
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {(
                        ['AND', 'OR', 'XOR', 'NOT', 'LSHIFT', 'RSHIFT'] as const
                    ).map((op) => (
                        <button
                            key={op}
                            onClick={() => setBitwiseOp(op)}
                            className={cn(
                                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
                                bitwiseOp === op
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                            )}
                        >
                            {op}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={bitwiseA}
                        onChange={(e) => setBitwiseA(e.target.value)}
                        placeholder="A (integer)"
                        className="flex-1 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm font-mono outline-none text-zinc-800 dark:text-zinc-200"
                    />
                    {bitwiseOp !== 'NOT' && (
                        <input
                            type="number"
                            value={bitwiseB}
                            onChange={(e) => setBitwiseB(e.target.value)}
                            placeholder="B"
                            className="flex-1 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm font-mono outline-none text-zinc-800 dark:text-zinc-200"
                        />
                    )}
                    <button
                        onClick={applyBitwise}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors"
                    >
                        =
                    </button>
                </div>
                {bitwiseResult !== null && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-950">
                        <span className="text-zinc-400 text-xs">Result:</span>
                        <span className="font-mono text-white font-bold">
                            {bitwiseResult}
                        </span>
                        <span className="text-zinc-500 text-xs ml-auto">
                            0x
                            {parseInt(bitwiseResult).toString(16).toUpperCase()}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
