import { google } from 'googleapis';

export async function fetchEmailBatch(
    gmail: ReturnType<typeof google.gmail>,
    pageToken?: string,
) {
    const listRes = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
        pageToken,
    });

    const ids = (listRes.data.messages || []).map((m) => m.id!).filter(Boolean);

    return { ids, nextPageToken: listRes.data.nextPageToken };
}
