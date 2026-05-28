'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { WidgetFailureReason } from './widgetRuntimeTypes';

type WidgetErrorBoundaryProps = {
    widgetId: string;
    label: string;
    emoji: string;
    onFailure: (id: string, reason: WidgetFailureReason) => void;
    onRetry: () => void;
    children: ReactNode;
};

type WidgetErrorBoundaryState = {
    error: Error | null;
};

export class WidgetErrorBoundary extends Component<
    WidgetErrorBoundaryProps,
    WidgetErrorBoundaryState
> {
    state: WidgetErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        this.props.onFailure(this.props.widgetId, {
            message: error.message,
            resourceKey: info.componentStack,
        });
    }

    componentDidUpdate(previous: WidgetErrorBoundaryProps) {
        if (previous.widgetId !== this.props.widgetId && this.state.error) {
            this.setState({ error: null });
        }
    }

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-center text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-200">
                <span className="text-2xl" aria-hidden="true">
                    {this.props.emoji}
                </span>
                <span className="text-sm font-semibold">
                    {this.props.label} is temporarily unavailable
                </span>
                <button
                    type="button"
                    className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
                    onClick={() => {
                        this.props.onRetry();
                        this.setState({ error: null });
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }
}
