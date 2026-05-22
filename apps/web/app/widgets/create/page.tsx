import { Suspense } from 'react';
import { WidgetBuilderPage } from '@/features/widgets/builder/WidgetBuilderPage';
import { PageLoading } from '@/features/ui/loading';

export const metadata = { title: 'Widget Builder' };

export default function CreateWidgetPage() {
    return (
        <Suspense fallback={<PageLoading message="Loading widget builder" />}>
            <WidgetBuilderPage />
        </Suspense>
    );
}
