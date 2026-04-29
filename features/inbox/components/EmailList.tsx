import { ClassifyHandler, Email } from '@/types/inbox';
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
                <EmailCard key={mail.id} mail={mail} onClassify={onClassify} />
            ))}
        </div>
    );
}
