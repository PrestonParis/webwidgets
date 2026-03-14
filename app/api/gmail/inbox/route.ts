import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
    console.log("CLIENT ID:", process.env.GOOGLE_CLIENT_ID);
    console.log("REFRESH:", process.env.GOOGLE_REFRESH_TOKEN);
    const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const messageList = await gmail.users.messages.list({
    userId: "me",
    maxResults: 10,
    //q: "newer_than:1d"
    });
    console.log(messageList.data);

    const messages = messageList.data.messages || [];

    const results = [];

    for (const msg of messages) {
    const full = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!
    });

    const headers = full.data.payload?.headers || [];

    const subject = headers.find(h => h.name === "Subject")?.value;
    const sender = headers.find(h => h.name === "From")?.value;

    results.push({
        subject,
        sender,
        snippet: full.data.snippet
    });
    }
    console.log("REFRESH:", process.env.GOOGLE_REFRESH_TOKEN);

    return NextResponse.json(results);
}