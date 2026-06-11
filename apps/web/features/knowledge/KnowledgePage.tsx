'use client';

import Header from '@/features/ui/components/Header';
import { FoundationCard } from '@/features/ui/components/FoundationCard';
import { ProductPageShell } from '@/features/ui/components/ProductPageShell';
import { useKnowledgeFoundation } from '@/features/knowledge/hooks/useKnowledgeFoundation';
import { OnThisDayPanel } from '@/features/knowledge/components/OnThisDayPanel';

export function KnowledgePage() {
    const { widgets } = useKnowledgeFoundation();

    return (
        <>
            <Header />
            <ProductPageShell
                eyebrow="Knowledge foundation"
                title="Knowledge and Writing"
                description="Notes, journal, long-form writing, transcription, audio dumps, archive review, source collection, and research queues share one knowledge item model."
            >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {widgets.map((widget) => (
                        <FoundationCard
                            key={widget.id}
                            title={widget.title}
                            description={widget.description}
                            status={widget.status}
                        >
                            {widget.id === 'on-this-day' ? (
                                <OnThisDayPanel />
                            ) : undefined}
                        </FoundationCard>
                    ))}
                </div>
            </ProductPageShell>
        </>
    );
}
