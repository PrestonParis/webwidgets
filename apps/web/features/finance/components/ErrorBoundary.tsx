'use client';

import React, { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: (error: Error) => ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                return this.props.fallback(this.state.error);
            }
            return (
                <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4">
                    <div className="flex gap-3">
                        <AlertCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="text-sm font-medium text-red-900 dark:text-red-200">
                                Something went wrong
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                {this.state.error.message}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
