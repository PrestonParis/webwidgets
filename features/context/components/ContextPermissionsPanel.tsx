'use client';

import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import type { ContextPermissions } from '@/features/context/types/context';

const STORAGE_KEY = 'context_permissions';

const DEFAULTS: ContextPermissions = {
    captureWidgetInteractions: true,
    includeQueryGists: true,
    aiPersonalization: true,
};

function loadPermissions(): ContextPermissions {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as ContextPermissions) : DEFAULTS;
    } catch {
        return DEFAULTS;
    }
}

interface ToggleRowProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                    {label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-[#4f6ef7]' : 'bg-gray-200 dark:bg-zinc-700'}`}
            >
                <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
            </button>
        </div>
    );
}

export function ContextPermissionsPanel() {
    const [perms, setPerms] = useState<ContextPermissions>(DEFAULTS);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setPerms(loadPermissions());
        setLoaded(true);
    }, []);

    const update = (key: keyof ContextPermissions, value: boolean) => {
        const next = { ...perms, [key]: value };
        setPerms(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    };

    if (!loaded) return null;

    return (
        <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
            <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#4f6ef7]" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                    Context Permissions
                </h3>
            </div>
            <ToggleRow
                label="Widget interactions"
                description="Track which widgets you use and when, to improve AI responses."
                checked={perms.captureWidgetInteractions}
                onChange={(v) => update('captureWidgetInteractions', v)}
            />
            <ToggleRow
                label="Chat memory"
                description="Store gists of your AI conversations to provide continuity."
                checked={perms.includeQueryGists}
                onChange={(v) => update('includeQueryGists', v)}
            />
            <ToggleRow
                label="AI personalization"
                description="Include context graph data in every AI query system prompt."
                checked={perms.aiPersonalization}
                onChange={(v) => update('aiPersonalization', v)}
            />
        </div>
    );
}
