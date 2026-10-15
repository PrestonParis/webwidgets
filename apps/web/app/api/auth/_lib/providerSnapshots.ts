import { getInboxSummary } from '@/features/inbox/server/inboxService';
import { getCalendarSnapshot } from '@/features/calendar/server/calendarService';
import { createCredentialClients } from './credentialClients';

export async function loadCredentialInboxSnapshot(
    userId: string,
    limit: number,
) {
    const { supabaseAdmin } = await createCredentialClients(userId);
    return getInboxSummary(supabaseAdmin, userId, limit);
}

export async function loadCredentialCalendarSnapshot(
    userId: string,
    days: number,
) {
    const { supabaseAdmin } = await createCredentialClients(userId);
    return getCalendarSnapshot(supabaseAdmin, userId, days);
}
