'use client';

import Header from '@/features/ui/components/Header';
import { FoundationCard } from '@/features/ui/components/FoundationCard';
import { ProductPageShell } from '@/features/ui/components/ProductPageShell';
import { useImportExportFoundation } from '@/features/import-export/hooks/useImportExportFoundation';

export function ImportExportPage() {
    const { formats, duplicateStrategies } = useImportExportFoundation();

    return (
        <>
            <Header />
            <ProductPageShell
                eyebrow="Data mobility"
                title="Import and Export"
                description="Reusable jobs, previews, mappings, validation, duplicate strategy, category mapping, CSV, Excel, Google Sheets, and JSON export."
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <FoundationCard
                        title="Supported formats"
                        description={formats.join(', ')}
                        status="Scaffold"
                    />
                    <FoundationCard
                        title="Duplicate strategies"
                        description={duplicateStrategies.join(', ')}
                        status="Ready model"
                    />
                </div>
            </ProductPageShell>
        </>
    );
}
