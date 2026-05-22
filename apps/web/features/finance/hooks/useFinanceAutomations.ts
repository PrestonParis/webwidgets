'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FinanceAutomationRule } from '@/features/finance/types/finance';

const STORAGE_KEY = 'finance-automation-disabled-rules';

export function useFinanceAutomations(baseRules: FinanceAutomationRule[]) {
    const [disabledRules, setDisabledRules] = useState<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setDisabledRules(new Set(JSON.parse(stored)));
            } catch {
                setDisabledRules(new Set());
            }
        }
        setMounted(true);
    }, []);

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
