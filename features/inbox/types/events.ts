export interface NormalizedEmailAttachment {
    filename: string;
    mimeType: string;
    size: number;
}

export interface NormalizedEmailEvent {
    provider: 'gmail';
    account_id: string;
    thread_id: string;
    message_id: string;
    history_id: string;
    timestamp: string;
    headers: Record<string, string>;
    body: string;
    attachments: NormalizedEmailAttachment[];
    dedupe_hash: string;
}
