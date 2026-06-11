import { cn } from '@/lib/utils/utils';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type SpinnerTone =
    | 'default'
    | 'muted'
    | 'accent'
    | 'success'
    | 'warning'
    | 'destructive';

const sizeMap: Record<SpinnerSize, string> = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
};

const toneMap: Record<SpinnerTone, string> = {
    default:
        'border-zinc-300 dark:border-zinc-600 border-t-zinc-900 dark:border-t-zinc-200',
    muted: 'border-zinc-200 dark:border-zinc-700 border-t-zinc-400 dark:border-t-zinc-500',
    accent: 'border-blue-200 dark:border-blue-900 border-t-blue-500 dark:border-t-blue-400',
    success:
        'border-emerald-200 dark:border-emerald-900 border-t-emerald-500 dark:border-t-emerald-400',
    warning:
        'border-amber-200 dark:border-amber-900 border-t-amber-500 dark:border-t-amber-400',
    destructive:
        'border-red-200 dark:border-red-900 border-t-red-500 dark:border-t-red-400',
};

interface LoadingSpinnerProps {
    size?: SpinnerSize;
    tone?: SpinnerTone;
    className?: string;
    ariaLabel?: string;
}

export function LoadingSpinner({
    size = 'md',
    tone = 'default',
    className,
    ariaLabel = 'Loading',
}: LoadingSpinnerProps) {
    return (
        <div
            className={cn(
                'rounded-full border-2 animate-spin',
                sizeMap[size],
                toneMap[tone],
                'motion-safe:animate-spin motion-reduce:animate-none',
                className,
            )}
            role="status"
            aria-label={ariaLabel}
        >
            <span className="sr-only">{ariaLabel}</span>
        </div>
    );
}
