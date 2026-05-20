'use client';

import Header from '@/features/ui/components/Header';
import { FoundationCard } from '@/features/ui/components/FoundationCard';
import { ProductPageShell } from '@/features/ui/components/ProductPageShell';
import { useDeveloperTools } from '@/features/developer/hooks/useDeveloperTools';

export function DeveloperPage() {
    const { tools } = useDeveloperTools();

    return (
        <>
            <Header />
            <ProductPageShell
                eyebrow="Developer tools"
                title="Developer Workspace"
                description="API testing, logs, cron jobs, containers, schema visualization, resources, and network checks are registered as gated tools instead of unsafe direct integrations."
            >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {tools.map((tool) => (
                        <FoundationCard
                            key={tool.id}
                            title={tool.title}
                            description={tool.description}
                            status={tool.state.replace('_', ' ')}
                        />
                    ))}
                </div>
            </ProductPageShell>
        </>
    );
}
