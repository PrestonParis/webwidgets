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
    category?: EmailCategory | string;
    is_manual?: boolean;
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

export type EmailInput = { idx: number; sender: string; subject: string };
