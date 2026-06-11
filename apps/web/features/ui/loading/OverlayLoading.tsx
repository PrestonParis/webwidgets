import { cn } from '@/lib/utils/utils';
import { LoadingSpinner } from './LoadingSpinner';

type OverlayMode = 'transparent' | 'dim' | 'blur' | 'solid';

interface OverlayLoadingProps {
    isLoading: boolean;
    mode?: OverlayMode;
    message?: string;
    className?: string;
}

const modeMap: Record<OverlayMode, string> = {
    transparent: 'bg-transparent',
    dim: 'bg-black/20 dark:bg-black/40',
    blur: 'bg-white/10 dark:bg-black/30 backdrop-blur-sm',
    solid: 'bg-white dark:bg-zinc-950',
};

export function OverlayLoading({
    isLoading,
    mode = 'dim',
    message = 'Loading',
    className,
}: OverlayLoadingProps) {
    if (!isLoading) return null;

    return (
        <div
            className={cn(
                'absolute inset-0 flex items-center justify-center z-50 rounded-lg',
                modeMap[mode],
                className,
            )}
            role="status"
            aria-live="polite"
        >
            <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size="lg" tone="accent" />
                {message && (
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
