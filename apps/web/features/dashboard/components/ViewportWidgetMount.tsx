'use client';

import { useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import {
    useDashboardRuntime,
    useDashboardRuntimeWidget,
} from '@/features/dashboard/runtime/DashboardRuntimeProvider';
import { WidgetErrorBoundary } from '@/features/dashboard/runtime/WidgetErrorBoundary';
import { getWidgetRuntimeMetadata } from '@/features/dashboard/runtime/widgetRuntimeMetadata';

interface ViewportWidgetMountProps {
    widgetId: string;
    config: WidgetConfig;
    render: () => ReactNode;
    label: string;
    emoji: string;
    eager?: boolean;
}

export function ViewportWidgetMount({
    widgetId,
    config,
    render,
    label,
    emoji,
    eager = false,
}: ViewportWidgetMountProps) {
    const metadata = useMemo(() => getWidgetRuntimeMetadata(config), [config]);
    const { markWidgetFailed } = useDashboardRuntime();
    const { ref, loaded, visible, canHydrate, status, retry } =
        useDashboardRuntimeWidget({ metadata, eager });

    // Once a widget has been hydrated, keep it mounted even when scrolled out of
    // view. Toggling canHydrate causes unmount → remount which re-runs all hooks
    // and triggers fresh API fetches. Use CSS visibility instead.
    const everHydratedRef = useRef(false);
    if (canHydrate) everHydratedRef.current = true;
    const keepMounted = everHydratedRef.current;

    const unavailable =
        status === 'failed' || status === 'cooldown' || status === 'disabled';

    // Progressive loading states with meaningful messages
    const getShellMessage = () => {
        if (unavailable) {
            return status === 'disabled'
                ? 'Disabled after repeated failures'
                : 'Temporarily unavailable';
        }
        if (!loaded) {
            if (metadata.defaultLoad === 'manual') {
                return 'Load when needed';
            }
            if (metadata.weight === 'heavy') {
                return 'Loading when visible';
            }
            return 'Loading...';
        }
        if (!visible) {
            return 'Offscreen - will load when visible';
        }
        return 'Preparing widget...';
    };

    return (
        <div
            ref={ref}
            data-widget-body-active={canHydrate ? 'true' : 'false'}
            data-widget-runtime-status={status}
        >
            {keepMounted && !unavailable ? (
                // Keep widget mounted once hydrated; hide via CSS when offscreen
                // to avoid unmount → remount cycles that re-trigger all fetch hooks.
                // visibility:hidden keeps layout dimensions so recharts can measure its container;
                // display:none collapses to 0x0 and breaks ResponsiveContainer.
                <div
                    style={
                        canHydrate
                            ? undefined
                            : {
                                  visibility: 'hidden',
                                  pointerEvents: 'none',
                                  height: 0,
                                  overflow: 'hidden',
                              }
                    }
                >
                    <WidgetErrorBoundary
                        widgetId={widgetId}
                        label={label}
                        emoji={emoji}
                        onFailure={markWidgetFailed}
                        onRetry={retry}
                    >
                        {render()}
                    </WidgetErrorBoundary>
                </div>
            ) : canHydrate ? (
                <WidgetErrorBoundary
                    widgetId={widgetId}
                    label={label}
                    emoji={emoji}
                    onFailure={markWidgetFailed}
                    onRetry={retry}
                >
                    {render()}
                </WidgetErrorBoundary>
            ) : (
                <div className="flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 bg-white/70 p-4 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400">
                    <span className="text-2xl" aria-hidden="true">
                        {emoji}
                    </span>
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {getShellMessage()}
                    </span>
                    {unavailable && (
                        <button
                            type="button"
                            onClick={retry}
                            className="mt-1 rounded-lg border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                        >
                            Retry
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
