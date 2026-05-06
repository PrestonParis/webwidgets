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
    category?: string | undefined;
    is_manual?: boolean | undefined;
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
