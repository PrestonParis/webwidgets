export type EmailProvider = 'gmail' | 'outlook';

/** Row shape for `email_snapshots` — matches the DB schema. */
export interface EmailSnapshotRow {
    id: string; // "gmail:<msgId>" or "outlook:<msgId>"
    user_id: string;
    account_email: string;
    provider: EmailProvider;
    subject: string;
    sender_email: string;
    sender_name: string;
    snippet: string;
    received_at: string;
    raw_date: string;
    synced_at: string;
    /** Full decoded body text. NULL until populated by the processing pipeline. */
    body_text: string | null;
}

export type ActionType = 'action' | 'event' | 'deadline';

export interface EmailAction {
    id: string;
    email_id: string;
    type: ActionType;
    title: string;
    description: string | null;
    due_date: string | null;
    action_url: string | null;
    completed: boolean;
    synced: boolean;
    created_at: string;
}

export const EMAIL_CATEGORIES = [
    'work',
    'personal',
    'finance',
    'promotions',
    'social',
    'notifications',
    'shopping',
    'other',
] as const;

export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];

export type Email = {
    id: string;
    subject: string;
    sender: string;
    snippet: string;
    date: string;
    provider?: 'gmail' | 'outlook';
    /** Set by mergeEmails when the same message appears in both providers. */
    providers?: ('gmail' | 'outlook')[];
    category?: string | undefined;
    is_manual?: boolean | undefined;
    /** Which account inbox this email belongs to (e.g. user@gmail.com). */
    account_email?: string | undefined;
};

export type TokenUpdate = {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
};

export type ClassifyHandler = (
    emailId: string,
    category: string,
    sender: string,
    subject: string,
) => void | Promise<void>;

export interface EmailCardProps {
    mail: Email;
    onClassify: ClassifyHandler;
}

export type EmailInput = { idx: number; sender: string; subject: string };

export interface EmailHeader {
    name: string;
    value: string;
}

export interface GmailMessage {
    id: string;
    snippet?: string;
    payload?: {
        headers: {
            name: string;
            value: string;
        }[];
    };
}

export interface EmailConnectPromptProps {
    /** Full empty-state UI when nothing is connected */
    compact?: boolean;
    /** Small strip of add-account buttons shown alongside existing content */
    inline?: boolean;
    /** Restrict to a single provider — omit to show both */
    provider?: 'gmail' | 'outlook';
}
