import ArtifactsPage from '@/features/artifacts/components/ArtifactsPage';

export default async function ArtifactDetailRoute({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <div className="container mx-auto px-4 py-8">
            <ArtifactsPage initialId={id} />
        </div>
    );
}
