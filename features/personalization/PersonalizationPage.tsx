'use client';

import Header from '@/features/ui/components/Header';
import { FoundationCard } from '@/features/ui/components/FoundationCard';
import { ProductPageShell } from '@/features/ui/components/ProductPageShell';
import { usePersonalizationFoundation } from '@/features/personalization/hooks/usePersonalizationFoundation';

export function PersonalizationPage() {
    const { settings } = usePersonalizationFoundation();

    return (
        <>
            <Header />
            <ProductPageShell
                eyebrow="Preference system"
                title="Personalization"
                description="Workspace defaults, layout mode, density, privacy mode, AI assistance, categories, hidden widgets, starter workspace, and notifications."
            >
                <div className="grid gap-4 md:grid-cols-2">
                    {settings.map((setting) => (
                        <FoundationCard
                            key={setting}
                            title={setting}
                            description="Persisted preference boundary for onboarding, settings, and widget assembly."
                            status="Model ready"
                        />
                    ))}
                </div>
            </ProductPageShell>
        </>
    );
}
