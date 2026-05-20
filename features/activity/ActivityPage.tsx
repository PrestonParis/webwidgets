'use client';

import Header from '@/features/ui/components/Header';
import { FoundationCard } from '@/features/ui/components/FoundationCard';
import { ProductPageShell } from '@/features/ui/components/ProductPageShell';
import { ActivityFeedWidget } from '@/features/activity/components/ActivityFeedWidget';
import { useActivityFoundation } from '@/features/activity/hooks/useActivityFoundation';

export function ActivityPage() {
    const { sources } = useActivityFoundation();

    return (
        <>
            <Header />
            <ProductPageShell
                eyebrow="Event infrastructure"
                title="Activity Feed"
                description="A central event stream for product systems, notification center, and widget surfaces."
            >
                <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
                    <ActivityFeedWidget />
                    <FoundationCard
                        title="Registered sources"
                        description={sources.join(', ')}
                        status="Ready"
                    />
                </div>
            </ProductPageShell>
        </>
    );
}
