'use client';

import { cn } from '@/lib/utils/utils';
import type { CalcControls } from '../../hooks/useCalculator';

interface BasicModeProps {
    calc: CalcControls;
    compact?: boolean;
}

interface Btn {
    label: string;
    action: () => void;
    span?: 2;
    variant?: 'primary' | 'op' | 'fn' | 'mem' | 'eq';
    title?: string;
}

export function BasicMode({ calc, compact = false }: BasicModeProps) {
    const { appendToExpression, clear, negate, calculate, memoryAction } = calc;

    const rows: Btn[][] = [
        [
            {
                label: 'MC',
                action: () => memoryAction('mc'),
                variant: 'mem',
                title: 'Memory clear',
            },
            {
                label: 'MR',
                action: () => memoryAction('mr'),
                variant: 'mem',
                title: 'Memory recall',
            },
            {
                label: 'M+',
                action: () => memoryAction('m+'),
                variant: 'mem',
                title: 'Memory add',
            },
            {
                label: 'M−',
                action: () => memoryAction('m-'),
                variant: 'mem',
                title: 'Memory subtract',
            },
        ],
        [
            {
                label: calc.expression ? 'C' : 'AC',
                action: clear,
                variant: 'fn',
                title: 'Clear',
            },
            { label: '±', action: negate, variant: 'fn', title: 'Toggle sign' },
            {
                label: '%',
                action: () => appendToExpression('%'),
                variant: 'fn',
                title: 'Percent (÷100)',
            },
            {
                label: '÷',
                action: () => appendToExpression('/'),
                variant: 'op',
                title: 'Divide',
            },
        ],
        [
            { label: '7', action: () => appendToExpression('7') },
            { label: '8', action: () => appendToExpression('8') },
            { label: '9', action: () => appendToExpression('9') },
            {
                label: '×',
                action: () => appendToExpression('*'),
                variant: 'op',
            },
        ],
        [
            { label: '4', action: () => appendToExpression('4') },
            { label: '5', action: () => appendToExpression('5') },
            { label: '6', action: () => appendToExpression('6') },
            {
                label: '−',
                action: () => appendToExpression('-'),
                variant: 'op',
            },
        ],
        [
            { label: '1', action: () => appendToExpression('1') },
            { label: '2', action: () => appendToExpression('2') },
            { label: '3', action: () => appendToExpression('3') },
            {
                label: '+',
                action: () => appendToExpression('+'),
                variant: 'op',
            },
        ],
        [
            { label: '0', action: () => appendToExpression('0'), span: 2 },
            { label: '.', action: () => appendToExpression('.') },
            { label: '=', action: calculate, variant: 'eq' },
        ],
    ];

    return (
        <div className="grid grid-cols-4 gap-1.5">
            {rows.flat().map((btn, i) => (
                <CalcButton key={i} btn={btn} compact={compact} />
            ))}
        </div>
    );
}

export function CalcButton({ btn, compact }: { btn: Btn; compact: boolean }) {
    const base = cn(
        'flex items-center justify-center rounded-2xl font-semibold transition-all active:scale-95 select-none',
        compact ? 'h-11 text-sm' : 'h-14 text-base',
        btn.span === 2 && 'col-span-2',
    );

    const variants: Record<string, string> = {
        fn: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600',
        mem: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs',
        op: 'bg-amber-500 text-white hover:bg-amber-400',
        eq: 'bg-blue-600 text-white hover:bg-blue-500',
        primary:
            'bg-zinc-300 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-400 dark:hover:bg-zinc-500',
    };

    return (
        <button
            onClick={btn.action}
            title={btn.title}
            className={cn(base, variants[btn.variant ?? 'primary'])}
        >
            {btn.label}
        </button>
    );
}
