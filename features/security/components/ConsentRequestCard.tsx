import { FoundationCard } from '@/features/ui/components/FoundationCard';

interface ConsentRequestCardProps {
    scope: string;
    description: string;
}

export function ConsentRequestCard({
    scope,
    description,
}: ConsentRequestCardProps) {
    return (
        <FoundationCard
            title={scope}
            description={description}
            status="Requires consent"
        />
    );
}
