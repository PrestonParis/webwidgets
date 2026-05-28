'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils/utils';
import type { CalcControls } from '../hooks/useCalculator';

type FinancialTab = 'compound' | 'loan' | 'percent';

interface FinancialModeProps {
    calc: CalcControls;
}

function n(s: string): number {
    return parseFloat(s.replace(/,/g, '')) || 0;
}

function formatMoney(x: number): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(x);
}

export function FinancialMode({ calc }: FinancialModeProps) {
    const [tab, setTab] = useState<FinancialTab>('compound');
    const fi = calc.financialInputs;
    const set = calc.updateFinancialInputs;

    // ── Compound Interest ──────────────────────────────────────────────────────
    const compoundResult = useMemo(() => {
        const P = n(fi.principal);
        const r = n(fi.rate) / 100;
        const t = n(fi.periods);
        const k = parseInt(fi.compoundFreq);
        if (!P || !r || !t) return null;
        const A = P * Math.pow(1 + r / k, k * t);
        return { futureValue: A, interest: A - P };
    }, [fi.principal, fi.rate, fi.periods, fi.compoundFreq]);

    // ── Loan / Payment ─────────────────────────────────────────────────────────
    const loanResult = useMemo(() => {
        const P = n(fi.loanAmount);
        const r = n(fi.loanRate) / 100 / 12;
        const nPay = n(fi.loanTerm) * 12;
        if (!P || !r || !nPay) return null;
        const M =
            (P * (r * Math.pow(1 + r, nPay))) / (Math.pow(1 + r, nPay) - 1);
        return { monthly: M, total: M * nPay, interest: M * nPay - P };
    }, [fi.loanAmount, fi.loanRate, fi.loanTerm]);

    // ── Percentage Change ─────────────────────────────────────────────────────
    const percentResult = useMemo(() => {
        const from = n(fi.fromValue);
        const to = n(fi.toValue);
        if (!from) return null;
        const change = ((to - from) / Math.abs(from)) * 100;
        return { change, absolute: to - from };
    }, [fi.fromValue, fi.toValue]);

    const TABS: { id: FinancialTab; label: string }[] = [
        { id: 'compound', label: 'Compound Interest' },
        { id: 'loan', label: 'Loan / Payment' },
        { id: 'percent', label: '% Change' },
    ];

    return (
        <div className="space-y-4">
            {/* Tab selector */}
            <div className="flex gap-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-1">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            'flex-1 py-1.5 text-xs font-semibold rounded-xl transition-colors',
                            tab === t.id
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'compound' && (
                <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        Compound Interest: A = P(1 + r/n)^(nt)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <Field
                            label="Principal (P)"
                            value={fi.principal}
                            onChange={(v) => set({ principal: v })}
                            prefix="$"
                        />
                        <Field
                            label="Annual rate (%)"
                            value={fi.rate}
                            onChange={(v) => set({ rate: v })}
                            suffix="%"
                        />
                        <Field
                            label="Time (years)"
                            value={fi.periods}
                            onChange={(v) => set({ periods: v })}
                        />
                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                                Compound freq.
                            </span>
                            <select
                                value={fi.compoundFreq}
                                onChange={(e) =>
                                    set({
                                        compoundFreq: e.target
                                            .value as typeof fi.compoundFreq,
                                    })
                                }
                                className="h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 text-sm text-zinc-700 dark:text-zinc-200 px-3 outline-none"
                            >
                                <option value="1">Annually</option>
                                <option value="4">Quarterly</option>
                                <option value="12">Monthly</option>
                                <option value="365">Daily</option>
                            </select>
                        </label>
                    </div>
                    {compoundResult && (
                        <ResultBox
                            items={[
                                {
                                    label: 'Future Value',
                                    value: `$${formatMoney(compoundResult.futureValue)}`,
                                },
                                {
                                    label: 'Interest Earned',
                                    value: `$${formatMoney(compoundResult.interest)}`,
                                },
                            ]}
                            onSend={() =>
                                calc.pushExpr(
                                    compoundResult.futureValue.toFixed(2),
                                )
                            }
                        />
                    )}
                </div>
            )}

            {tab === 'loan' && (
                <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        Loan Payment: M = P[r(1+r)^n] / [(1+r)^n−1]
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <Field
                            label="Loan amount"
                            value={fi.loanAmount}
                            onChange={(v) => set({ loanAmount: v })}
                            prefix="$"
                        />
                        <Field
                            label="Annual rate (%)"
                            value={fi.loanRate}
                            onChange={(v) => set({ loanRate: v })}
                            suffix="%"
                        />
                        <Field
                            label="Term (years)"
                            value={fi.loanTerm}
                            onChange={(v) => set({ loanTerm: v })}
                        />
                    </div>
                    {loanResult && (
                        <ResultBox
                            items={[
                                {
                                    label: 'Monthly Payment',
                                    value: `$${formatMoney(loanResult.monthly)}`,
                                },
                                {
                                    label: 'Total Payment',
                                    value: `$${formatMoney(loanResult.total)}`,
                                },
                                {
                                    label: 'Total Interest',
                                    value: `$${formatMoney(loanResult.interest)}`,
                                },
                            ]}
                            onSend={() =>
                                calc.pushExpr(loanResult.monthly.toFixed(2))
                            }
                        />
                    )}
                </div>
            )}

            {tab === 'percent' && (
                <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        Percentage Change: ((new − old) / |old|) × 100
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <Field
                            label="From value"
                            value={fi.fromValue}
                            onChange={(v) => set({ fromValue: v })}
                        />
                        <Field
                            label="To value"
                            value={fi.toValue}
                            onChange={(v) => set({ toValue: v })}
                        />
                    </div>
                    {percentResult && (
                        <ResultBox
                            items={[
                                {
                                    label: 'Change',
                                    value: `${percentResult.change >= 0 ? '+' : ''}${percentResult.change.toFixed(4)}%`,
                                    accent:
                                        percentResult.change >= 0
                                            ? 'green'
                                            : 'red',
                                },
                                {
                                    label: 'Absolute Diff',
                                    value:
                                        (percentResult.absolute >= 0
                                            ? '+'
                                            : '') +
                                        percentResult.absolute.toFixed(4),
                                },
                            ]}
                            onSend={() =>
                                calc.pushExpr(percentResult.change.toFixed(4))
                            }
                        />
                    )}
                </div>
            )}
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    prefix,
    suffix,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    prefix?: string;
    suffix?: string;
}) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                {label}
            </span>
            <div className="flex items-center gap-1 px-3 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                {prefix && (
                    <span className="text-zinc-400 text-sm">{prefix}</span>
                )}
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none tabular-nums"
                />
                {suffix && (
                    <span className="text-zinc-400 text-sm">{suffix}</span>
                )}
            </div>
        </label>
    );
}

function ResultBox({
    items,
    onSend,
}: {
    items: { label: string; value: string; accent?: 'green' | 'red' }[];
    onSend: () => void;
}) {
    return (
        <div className="rounded-2xl bg-zinc-900 dark:bg-zinc-950 p-4">
            <div className="space-y-2">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400">
                            {item.label}
                        </span>
                        <span
                            className={cn(
                                'font-bold tabular-nums',
                                item.accent === 'green'
                                    ? 'text-green-400'
                                    : item.accent === 'red'
                                      ? 'text-red-400'
                                      : 'text-white',
                            )}
                        >
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
            <button
                onClick={onSend}
                className="mt-3 w-full py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors"
            >
                Send to Calculator
            </button>
        </div>
    );
}
