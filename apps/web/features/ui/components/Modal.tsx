'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
};

interface ModalProps {
    open: boolean;
    onClose: () => void;
    size?: ModalSize;
    children: ReactNode;
    className?: string;
    'aria-labelledby'?: string;
}

export function Modal({
    open,
    onClose,
    size = 'md',
    children,
    className,
    'aria-labelledby': labelledBy,
}: ModalProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                aria-hidden
                onClick={onClose}
            />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                className={cn(
                    'relative z-10 w-full flex flex-col max-h-[90vh]',
                    'rounded-2xl bg-white dark:bg-zinc-900',
                    'border border-gray-200 dark:border-zinc-700 shadow-xl',
                    sizeClasses[size],
                    className,
                )}
            >
                {children}
            </div>
        </div>
    );
}

interface ModalHeaderProps {
    id?: string;
    title: string;
    description?: string;
    onClose: () => void;
}

export function ModalHeader({
    id,
    title,
    description,
    onClose,
}: ModalHeaderProps) {
    return (
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
            <div>
                <h2
                    id={id}
                    className="text-sm font-semibold text-gray-900 dark:text-zinc-100"
                >
                    {title}
                </h2>
                {description && (
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                        {description}
                    </p>
                )}
            </div>
            <button
                onClick={onClose}
                aria-label="Close dialog"
                className="ml-3 p-1 shrink-0 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
}

interface ModalBodyProps {
    children: ReactNode;
    className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
    return (
        <div className={cn('overflow-y-auto px-5 py-4 flex-1', className)}>
            {children}
        </div>
    );
}

interface ModalFooterProps {
    children: ReactNode;
    className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
    return (
        <div
            className={cn(
                'px-5 py-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-2 shrink-0',
                className,
            )}
        >
            {children}
        </div>
    );
}
