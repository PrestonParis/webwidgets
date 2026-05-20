'use client';

import Header from '@/features/ui/components/Header';
import { FoundationCard } from '@/features/ui/components/FoundationCard';
import { ProductPageShell } from '@/features/ui/components/ProductPageShell';
import { useAutomationFoundation } from '@/features/automation/hooks/useAutomationFoundation';

export function AutomationPage() {
    const { widgets } = useAutomationFoundation();

    return (
        <>
            <Header />
            <ProductPageShell
                eyebrow="Safe automation"
                title="Automation"
                description="Triggers, conditions, actions, schedules, event-based rules, approvals, service requirements, and consent requirements without unsafe autonomous execution."
            >
                <div className="grid gap-4 md:grid-cols-3">
                    {widgets.map((widget) => (
                        <FoundationCard
                            key={widget.id}
                            title={widget.title}
                            description={widget.description}
                            status={widget.status}
                        />
                    ))}
                </div>
            </ProductPageShell>
        </>
    );
}
