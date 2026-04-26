import { Email } from '@/types/inbox';

type Props = {
    mail: Email;
    onClassify: (
        id: string,
        cat: string,
        sender: string,
        subject: string,
    ) => void;
};

export function EmailCard({ mail, onClassify }: Props) {
    return (
        <div className="group p-5 bg-white dark:bg-zinc-900 border rounded-2xl">
            <div className="flex justify-between mb-2">
                <span className="text-[10px] uppercase font-bold">
                    {mail.category || 'Uncategorized'}
                </span>
                <span className="text-[10px] text-gray-400">{mail.date}</span>
            </div>

            <h4 className="font-bold truncate">{mail.subject}</h4>

            <div className="text-xs text-blue-600">{mail.sender}</div>

            <p className="text-sm text-gray-500 line-clamp-2 mt-2 italic">
                &quot;{mail.snippet}&quot;
            </p>

            <div className="mt-4 pt-3 border-t flex gap-2 opacity-0 group-hover:opacity-100">
                {['work', 'personal', 'notifications'].map((cat) => (
                    <button
                        key={cat}
                        onClick={() =>
                            onClassify(mail.id, cat, mail.sender, mail.subject)
                        }
                        className="text-[10px] px-3 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800"
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
    );
}
