import MailIcon from '../../icons/MailIcon';
import EmptyWidget from './EmptyWidget';

export default function EmptyInbox() {
    return (
        <EmptyWidget
            color="blue"
            icon={<MailIcon size="sm" />}
            largeIcon={
                <MailIcon
                    size="lg"
                    className="text-blue-600 dark:text-blue-400"
                />
            }
            title="Gmail"
            badge="Not Connected"
            description="Sync your notifications to see them here."
            ctaLabel="Go to Settings"
            ctaHref="/settings"
        />
    );
}
