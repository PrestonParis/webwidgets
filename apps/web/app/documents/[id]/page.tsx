import DocumentsPage from '@/features/documents/components/DocumentsPage';

export default async function DocumentDetailRoute({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <div className="container mx-auto px-4 py-8">
            <DocumentsPage initialId={id} />
        </div>
    );
}
