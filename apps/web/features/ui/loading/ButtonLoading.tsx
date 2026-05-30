import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '@/lib/utils/utils';

interface ButtonLoadingProps {
    isLoading: boolean;
    children: React.ReactNode;
    spinnerSize?: 'xs' | 'sm' | 'md';
    spinnerTone?:
        | 'default'
        | 'muted'
        | 'accent'
        | 'success'
        | 'warning'
        | 'destructive';
    spinnerOnly?: boolean;
    className?: string;
}

export function ButtonLoading({
    isLoading,
    children,
    spinnerSize = 'sm',
    spinnerTone = 'default',
    spinnerOnly = false,
    className,
}: ButtonLoadingProps) {
    if (isLoading) {
        return (
            <span className={cn('inline-flex items-center gap-2', className)}>
                <LoadingSpinner size={spinnerSize} tone={spinnerTone} />
                {!spinnerOnly && children}
            </span>
        );
    }

    return <>{children}</>;
}
