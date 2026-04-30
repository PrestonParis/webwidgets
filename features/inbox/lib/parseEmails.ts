import he from 'he';
import { cleanDate } from '@/lib/utils/time';
import { GmailMessage } from '@/types/inbox';

export function parseEmails(batch: GmailMessage[], ids: string[]) {
    return batch.map((email, i) => {
        const headers = email.payload?.headers || [];
        return {
            id: ids[i],
            subject:
                headers.find((h) => h.name === 'Subject')?.value ||
                'No Subject',
            sender:
                headers.find((h) => h.name === 'From')?.value ||
                'Unknown Sender',
            date:
                cleanDate(
                    headers.find((h) => h.name === 'Date')?.value || '',
                ) || 'No Date',
            snippet: he.decode(email.snippet ?? ''),
        };
    });
}
