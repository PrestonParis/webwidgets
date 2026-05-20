'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'webwidgets.finance.privacy';

export type FinancePrivacySettings = {
    hideBalances: boolean;
    lowProfileMode: boolean;
    blurAmounts: boolean;
};

const DEFAULT_SETTINGS: FinancePrivacySettings = {
    hideBalances: false,
    lowProfileMode: false,
    blurAmounts: false,
};

function loadSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw
            ? {
                  ...DEFAULT_SETTINGS,
                  ...(JSON.parse(raw) as Partial<FinancePrivacySettings>),
              }
            : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function useFinancePrivacy() {
    const [settings, setSettings] =
        useState<FinancePrivacySettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        setSettings(loadSettings());
    }, []);

    const update = (patch: Partial<FinancePrivacySettings>) => {
        setSettings((current) => {
            const next = { ...current, ...patch };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    };

    const formatAmount = (
        value: number,
        currency = 'USD',
        maximumFractionDigits = 0,
    ) => {
        if (settings.hideBalances || settings.lowProfileMode) return '••••';
        return value.toLocaleString('en-US', {
            style: 'currency',
            currency,
            maximumFractionDigits,
        });
    };

    const amountClassName =
        settings.blurAmounts &&
        !settings.hideBalances &&
        !settings.lowProfileMode
            ? 'blur-sm hover:blur-0 transition-[filter]'
            : '';

    return { settings, update, formatAmount, amountClassName };
}
