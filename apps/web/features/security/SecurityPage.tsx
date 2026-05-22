'use client';

import Header from '@/features/ui/components/Header';
import { ProductPageShell } from '@/features/ui/components/ProductPageShell';
import { ConsentRequestCard } from '@/features/security/components/ConsentRequestCard';
import { useConsentFoundation } from '@/features/security/hooks/useConsentFoundation';

export function SecurityPage() {
    const { categories } = useConsentFoundation();

    return (
        <>
            <Header />
            <ProductPageShell
                eyebrow="Consent and permissions"
                title="Security"
                description="Data category permissions, AI analysis consent, cross-category insights, imports, automation, sensitive tracking, finance data, and integration scopes."
            >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {categories.map((category) => (
                        <ConsentRequestCard
                            key={category}
                            scope={category.replaceAll('_', ' ')}
                            description="Permission boundary for safe widget assembly and automation."
                        />
                    ))}
                </div>
            </ProductPageShell>
        </>
    );
}
