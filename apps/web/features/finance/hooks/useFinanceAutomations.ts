'use client';

import { useCallback, useState } from 'react';
import type { FinanceAutomationRule } from '@/features/finance/types/finance';

const STORAGE_KEY = 'finance-automation-disabled-rules';

export function useFinanceAutomations(baseRules: FinanceAutomationRule[]) {
    const [disabledRules, setDisabledRules] = useState<Set<string>>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed: unknown = JSON.parse(stored);
                if (
                    Array.isArray(parsed) &&
                    parsed.every((item) => typeof item === 'string')
                ) {
                    return new Set(parsed);
                }
            } catch {
                return new Set();
            }
        }
        return new Set();
    });
    const mounted = true;

    const toggleRule = useCallback((ruleId: string) => {
        setDisabledRules((prev) => {
            const next = new Set(prev);
            if (next.has(ruleId)) {
                next.delete(ruleId);
            } else {
                next.add(ruleId);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
            return next;
        });
    }, []);

    const rules = baseRules.map((rule) => ({
        ...rule,
        enabled: rule.enabled && !disabledRules.has(rule.id),
    }));

    return { rules, toggleRule, mounted };
}
