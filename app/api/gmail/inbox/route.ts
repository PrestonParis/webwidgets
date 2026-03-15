import { google } from "googleapis";
import { authOptions } from "@/app/lib/auth";
import { getServerSession } from "next-auth";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
    return Response.json(
        { error: "No access token found" },
        { status: 401 }
        );
    }
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
        access_token: session?.accessToken,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const messageList = await gmail.users.messages.list({
        userId: "me",
        maxResults: 10,
    });

    const messages = messageList.data.messages || [];
    const emails = await Promise.all(
        messages.map(async (msg) => {
            const email = await gmail.users.messages.get({
                userId: "me",
                id: msg.id!,
                format: "metadata",
                metadataHeaders: ["Subject", "From", "Date"]
            });
        
            const headers = email.data.payload?.headers || [];
            const subject = headers.find((h) => h.name === "Subject")?.value
            const sender = headers.find((h) => h.name === "From")?.value
            const date = headers.find((h) => h.name === "Date")?.value

            return {
                id: msg.id,
                subject,
                sender,
                date,
                snippet: email.data.snippet,
            };
        })
    );


    return Response.json(emails);
}