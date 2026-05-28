'use client';

import Header from '@/features/ui/components/Header';
import { ProductPageShell } from '@/features/ui/components/ProductPageShell';
import { IntegrationCatalogCard } from '@/features/integrations/components/IntegrationCatalogCard';
import { useIntegrationCatalog } from '@/features/integrations/hooks/useIntegrationCatalog';

export function IntegrationsPage() {
    const { providers } = useIntegrationCatalog();

    return (
        <>
            <Header />
            <ProductPageShell
                eyebrow="Provider registry"
                title="Integrations"
                description="Connection states, provider requirements, scopes, onboarding cards, and settings-ready service boundaries."
            >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {providers.map((provider) => (
                        <IntegrationCatalogCard
                            key={provider.id}
                            name={provider.name}
                            summary={provider.summary}
                            state={provider.state}
                        />
                    ))}
                </div>
            </ProductPageShell>
        </>
    );
}
