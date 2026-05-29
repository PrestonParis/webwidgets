import { google } from 'googleapis';

export function createGmailClient(tokens: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
}) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
    );

    oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: Number(tokens.expires_at),
    });

    return oauth2Client;
}
