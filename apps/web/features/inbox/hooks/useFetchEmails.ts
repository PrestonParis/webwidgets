import { gmail_v1 } from 'googleapis';
import type { MethodOptions } from 'googleapis-common';

const METHOD_OPTIONS: MethodOptions = {};

export async function fetchEmailBatch(
    gmail: gmail_v1.Gmail,
    pageToken?: string,
) {
    const params: gmail_v1.Params$Resource$Users$Messages$List = {
        userId: 'me',
        maxResults: 10,
        ...(pageToken !== undefined && { pageToken }),
    };

    const listRes = await gmail.users.messages.list(params, METHOD_OPTIONS);

    const ids = (listRes.data.messages ?? [])
        .map((m) => m.id)
        .filter((id): id is string => id != null);

    return { ids, nextPageToken: listRes.data.nextPageToken };
}
