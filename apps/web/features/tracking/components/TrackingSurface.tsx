'use client';

import type { ReactNode } from 'react';

type Tone = 'orange' | 'blue' | 'green' | 'purple' | 'pink' | 'indigo';

const toneText: Record<Tone, string> = {
    orange: 'text-orange-500 dark:text-orange-300',
    blue: 'text-blue-500 dark:text-blue-300',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-300',
    pink: 'text-pink-600 dark:text-pink-300',
    indigo: 'text-indigo-600 dark:text-indigo-300',
};

const toneButton: Record<Tone, string> = {
    orange: 'bg-orange-500 hover:bg-orange-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    pink: 'bg-pink-600 hover:bg-pink-700',
    indigo: 'bg-indigo-500 hover:bg-indigo-600',
};

const toneBar: Record<Tone, string> = {
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-600',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
};

export const trackingSectionClass =
    'rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

export function TrackingSection({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={`${trackingSectionClass} ${className}`}>
            {children}
        </section>
    );
}

export function TrackingKpi({
    label,
    value,
    sub,
}: {
    label: string;
    value: string;
    sub?: string | undefined;
}) {
    return (
        <div className="rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/70">
            <p className="text-[10px] font-semibold uppercase text-gray-400 dark:text-zinc-500">
                {label}
            </p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-zinc-100">
                {value}
            </p>
            {sub && (
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                    {sub}
                </p>
            )}
        </div>
    );
}

export function WidgetStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-gray-50 p-2 dark:bg-zinc-800/70">
            <p className="text-[10px] font-medium text-gray-400 dark:text-zinc-500">
                {label}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                {value}
            </p>
        </div>
    );
}

export function WidgetModeSwitcher<T extends string>({
    items,
    active,
    onChange,
    ariaLabel,
}: {
    items: Array<{ id: T; label: string }>;
    active: T;
    onChange: (id: T) => void;
    ariaLabel: string;
}) {
    return (
        <div
            className="flex overflow-x-auto rounded-lg bg-gray-100 p-0.5 dark:bg-zinc-800"
            role="tablist"
            aria-label={ariaLabel}
        >
            {items.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active === item.id}
                    onClick={() => onChange(item.id)}
                    className={`shrink-0 flex-1 rounded-md px-2 py-1 text-[10px] font-medium ${
                        active === item.id
                            ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                            : 'text-gray-500 dark:text-zinc-400'
                    }`}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}

export function SurfaceTabs<T extends string>({
    items,
    active,
    onChange,
    tone = 'orange',
}: {
    items: Array<{ id: T; label: string }>;
    active: T;
    onChange: (id: T) => void;
    tone?: Tone;
}) {
    return (
        <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 dark:bg-zinc-800">
            {items.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    onClick={() => onChange(item.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        active === item.id
                            ? `bg-white shadow-sm dark:bg-zinc-700 ${toneText[tone]}`
                            : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}

export function QuickActionButton({
    children,
    onClick,
    primary = false,
    tone = 'orange',
    disabled = false,
    ariaLabel,
}: {
    children: ReactNode;
    onClick?: () => void;
    primary?: boolean;
    tone?: Tone;
    disabled?: boolean;
    ariaLabel?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                primary
                    ? `${toneButton[tone]} text-white`
                    : 'border border-gray-200 text-gray-600 hover:border-gray-300 dark:border-zinc-700 dark:text-zinc-300'
            }`}
        >
            {children}
        </button>
    );
}

export function TrackingHero({
    eyebrow,
    title,
    subtitle,
    tone = 'orange',
    actions,
    kpis,
    progress,
}: {
    eyebrow: string;
    title: string;
    subtitle: string;
    tone?: Tone;
    actions?: ReactNode;
    kpis: ReactNode;
    progress?: { label: string; valueLabel: string; ratio: number } | undefined;
}) {
    const width = Math.max(
        0,
        Math.min(100, progress ? progress.ratio * 100 : 0),
    );
    return (
        <TrackingSection>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p
                        className={`text-xs font-semibold uppercase ${toneText[tone]}`}
                    >
                        {eyebrow}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-zinc-100">
                        {title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                        {subtitle}
                    </p>
                </div>
                {actions && (
                    <div className="flex flex-wrap gap-2">{actions}</div>
                )}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-5">{kpis}</div>
            {progress && (
                <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400">
                        <span>{progress.label}</span>
                        <span>{progress.valueLabel}</span>
                    </div>
                    <div
                        className="mt-1 h-2 rounded-full bg-gray-100 dark:bg-zinc-800"
                        aria-label={`${progress.label} ${Math.round(width)} percent`}
                    >
                        <div
                            className={`h-2 rounded-full ${toneBar[tone]}`}
                            style={{ width: `${width}%` }}
                        />
                    </div>
                </div>
            )}
        </TrackingSection>
    );
}
