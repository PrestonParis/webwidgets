import { EmptyProductState } from '@/features/ui/components/EmptyProductState';

export function ActivityFeedWidget() {
    return (
        <EmptyProductState
            title="No activity yet"
            description="Events from email actions, calendar, tracking, automation, finance, integrations, onboarding, and system alerts will appear here."
        />
    );
}
