'use client';

import type { FinancePrivacySettings } from '@/features/finance/hooks/useFinancePrivacy';

interface FinancePrivacyToggleProps {
    settings: FinancePrivacySettings;
    onChange: (patch: Partial<FinancePrivacySettings>) => void;
}

export function FinancePrivacyToggle({
    settings,
    onChange,
}: FinancePrivacyToggleProps) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        Privacy
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                        Keep finance details low-profile on shared screens.
                    </p>
                </div>
                <span className="text-[10px] rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 px-2 py-1">
                    Local
                </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <PrivacyButton
                    label="Hide balances"
                    active={settings.hideBalances}
                    onClick={() =>
                        onChange({ hideBalances: !settings.hideBalances })
                    }
                />
                <PrivacyButton
                    label="Low-profile mode"
                    active={settings.lowProfileMode}
                    onClick={() =>
                        onChange({ lowProfileMode: !settings.lowProfileMode })
                    }
                />
                <PrivacyButton
                    label="Blur until hover"
                    active={settings.blurAmounts}
                    onClick={() =>
                        onChange({ blurAmounts: !settings.blurAmounts })
                    }
                />
            </div>
        </div>
    );
}

function PrivacyButton({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                active
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700'
            }`}
        >
            {label}
        </button>
    );
}
