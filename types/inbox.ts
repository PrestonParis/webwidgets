export type Email = {
    id: string
    subject: string
    sender: string
    snippet: string
    date: string
    category?: string
}

export type TokenUpdate = {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
};