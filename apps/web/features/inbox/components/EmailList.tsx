import {
    ClassifyHandler,
    Email,
    EmailAction,
} from '@/features/inbox/types/inbox';
import { EmailCard } from './EmailCard';

export function EmailList({
    emails,
    actions,
    extractingId,
    onClassify,
    onExtract,
    onConfirmAction,
    onConfirmAll,
    onRejectAction,
}: {
    emails: Email[];
    actions: EmailAction[];
    extractingId: string | null;
    onClassify: ClassifyHandler;
    onExtract: (email: Email) => void;
    onConfirmAction: (id: string) => void;
    onConfirmAll: (emailId: string) => void;
    onRejectAction: (id: string) => void;
}) {
    return (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {emails.map((mail) => (
                <EmailCard
                    key={mail.id}
                    mail={mail}
                    emailActions={actions.filter(
                        (a) =>
                            a.email_id === mail.id && !a.synced && !a.completed,
                    )}
                    extracting={extractingId === mail.id}
                    onClassify={(...args) => {
                        void onClassify(...args);
                    }}
                    onExtract={() => onExtract(mail)}
                    onConfirmAction={onConfirmAction}
                    onConfirmAll={() => onConfirmAll(mail.id)}
                    onRejectAction={onRejectAction}
                />
            ))}
        </div>
    );
}
