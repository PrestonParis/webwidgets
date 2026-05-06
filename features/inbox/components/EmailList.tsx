import { ClassifyHandler, Email } from '@/features/inbox/types/inbox';
import { EmailCard } from './EmailCard';

export function EmailList({
    emails,
    onClassify,
}: {
    emails: Email[];
    onClassify: ClassifyHandler;
}) {
    return (
        <div className="space-y-3">
            {emails.map((mail) => (
                <EmailCard
                    key={mail.id}
                    mail={mail}
                    onClassify={(...args) => {
                        void onClassify(...args);
                    }}
                />
            ))}
        </div>
    );
}
