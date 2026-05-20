'use client';

import { MetricsDateRangePicker } from './MetricsDateRangePicker';
import { useMetricsFilter } from '../hooks/useMetricsFilter';

const SEGMENTS = ['', 'new', 'returning', 'power'];
const ENVS = ['', 'production', 'staging', 'development'];
const CATEGORIES = [
    '',
    'productivity',
    'finance',
    'tracking',
    'chess',
    'calendar',
    'communication',
];

function FilterSelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
            aria-label={label}
        >
            {options.map((o) => (
                <option key={o} value={o}>
                    {o || label}
                </option>
            ))}
        </select>
    );
}

export function MetricsFilterBar() {
    const {
        userSegment,
        widgetCategory,
        environment,
        setUserSegment,
        setWidgetCategory,
        setEnvironment,
        reset,
    } = useMetricsFilter();

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <MetricsDateRangePicker />
            <FilterSelect
                label="Segment"
                value={userSegment}
                options={SEGMENTS}
                onChange={setUserSegment}
            />
            <FilterSelect
                label="Category"
                value={widgetCategory}
                options={CATEGORIES}
                onChange={setWidgetCategory}
            />
            <FilterSelect
                label="Env"
                value={environment}
                options={ENVS}
                onChange={setEnvironment}
            />
            {(userSegment || widgetCategory || environment) && (
                <button
                    onClick={reset}
                    className="text-xs text-gray-400 dark:text-zinc-600 hover:text-red-500 transition-colors"
                >
                    Clear filters
                </button>
            )}
        </div>
    );
}
