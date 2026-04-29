import he from 'he';
import { cleanDate } from '@/lib/utils/time';

export function parseEmails(batch: any[], ids: string[]) {
    return batch.map((email, i) => {
        const headers = email.data.payload?.headers || [];

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
            snippet: he.decode(email.data.snippet ?? ''),
        };
    });
}
