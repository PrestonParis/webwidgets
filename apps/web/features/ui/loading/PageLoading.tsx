import { cn } from '@/lib/utils/utils';
import { LoadingSpinner } from './LoadingSpinner';

interface PageLoadingProps {
    message?: string;
    subMessage?: string;
    fullscreen?: boolean;
    minHeight?: string;
    className?: string;
}

export function PageLoading({
    message = 'Loading',
    subMessage,
    fullscreen = true,
    minHeight = 'min-h-screen',
    className,
}: PageLoadingProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center',
                fullscreen && minHeight,
                'bg-white dark:bg-zinc-950',
                className,
            )}
        >
            <LoadingSpinner size="lg" tone="accent" />
            {message && (
                <p className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {message}
                </p>
            )}
            {subMessage && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    {subMessage}
                </p>
            )}
        </div>
    );
}
