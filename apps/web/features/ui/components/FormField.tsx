'use client';

import type {
    InputHTMLAttributes,
    SelectHTMLAttributes,
    TextareaHTMLAttributes,
    ReactNode,
} from 'react';
import { cn } from '@/lib/utils/utils';

interface FormFieldProps {
    label?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
    className?: string;
    htmlFor?: string;
}

export function FormField({
    label,
    hint,
    error,
    required,
    children,
    className,
    htmlFor,
}: FormFieldProps) {
    return (
        <div className={cn('space-y-1.5', className)}>
            {label && (
                <label
                    htmlFor={htmlFor}
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                    {label}
                    {required && (
                        <span className="ml-0.5 text-red-500" aria-hidden>
                            *
                        </span>
                    )}
                </label>
            )}
            {children}
            {hint && !error && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {hint}
                </p>
            )}
            {error && (
                <p
                    className="text-xs text-red-600 dark:text-red-400"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
}

const inputBase = [
    'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-900',
    'border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100',
    'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
    'focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

const inputError = 'border-red-500 focus:ring-red-500';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

export function TextInput({ error, className, ...props }: TextInputProps) {
    return (
        <input
            className={cn(inputBase, error && inputError, className)}
            {...props}
        />
    );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
    rows?: number;
}

export function TextArea({
    error,
    className,
    rows = 4,
    ...props
}: TextAreaProps) {
    return (
        <textarea
            rows={rows}
            className={cn(
                inputBase,
                'resize-none',
                error && inputError,
                className,
            )}
            {...props}
        />
    );
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
    error?: boolean;
    options: Array<{ value: string; label: string }>;
    placeholder?: string;
}

export function SelectInput({
    error,
    options,
    placeholder,
    className,
    ...props
}: SelectInputProps) {
    return (
        <select
            className={cn(inputBase, error && inputError, className)}
            {...props}
        >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}
