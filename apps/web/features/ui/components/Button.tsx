'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    children?: ReactNode;
    fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90',
    secondary: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700',
    ghost: 'bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'bg-transparent border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
};

const sizeStyles: Record<ButtonSize, string> = {
    xs: 'h-6 px-2 text-xs gap-1 rounded-md',
    sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-lg',
    md: 'h-8 px-3 text-sm gap-2 rounded-lg',
    lg: 'h-10 px-4 text-sm gap-2 rounded-xl',
};

const iconSizes: Record<ButtonSize, number> = { xs: 12, sm: 12, md: 14, lg: 16 };

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon: Icon,
    iconPosition = 'left',
    children,
    fullWidth = false,
    className,
    disabled,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;
    const iconSize = iconSizes[size];

    return (
        <button
            type="button"
            disabled={isDisabled}
            className={cn(
                'inline-flex items-center justify-center font-medium transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variantStyles[variant],
                sizeStyles[size],
                fullWidth && 'w-full',
                className,
            )}
            {...props}
        >
            {loading && (
                <span
                    className="shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
                    style={{ width: iconSize, height: iconSize }}
                    aria-hidden
                />
            )}
            {!loading && Icon && iconPosition === 'left' && (
                <Icon size={iconSize} className="shrink-0" aria-hidden />
            )}
            {children}
            {!loading && Icon && iconPosition === 'right' && (
                <Icon size={iconSize} className="shrink-0" aria-hidden />
            )}
        </button>
    );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon;
    label: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
}

export function IconButton({
    icon: Icon,
    label,
    variant = 'ghost',
    size = 'md',
    className,
    ...props
}: IconButtonProps) {
    const iconSize = iconSizes[size];
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className={cn(
                'inline-flex items-center justify-center rounded-lg transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variantStyles[variant],
                sizeStyles[size],
                'px-0',
                {
                    xs: 'w-6',
                    sm: 'w-7',
                    md: 'w-8',
                    lg: 'w-10',
                }[size],
                className,
            )}
            {...props}
        >
            <Icon size={iconSize} aria-hidden />
        </button>
    );
}
