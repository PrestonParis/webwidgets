import { MailTrayIcon } from '../Icons/MailTrayIcon';
import EmptyWidget from './EmptyWidget';

export default function EmptyRecovery() {
    return (
        <EmptyWidget
            color="purple"
            icon={<MailTrayIcon className="w-4 h-4" />}
            largeIcon={
                <MailTrayIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            }
            title="Recovery Trackers"
            badge="Empty"
            description="No recovery trackers yet."
            ctaLabel="Create Your First Tracker"
            ctaOnClick={() => {
                window.location.href = '/recovery';
            }}
        />
    );
}
