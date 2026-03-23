import { google } from "googleapis";
import { authOptions } from "@/app/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import he from "he"
export interface ExtendedSession {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    accessToken?: string;
}

function cleanDate(date: string) {
    // Wed, 18 Mar 2026 21:24:20 +0000 -> Wed, Mar 18, 2026, 05:24 PM
    return new Date(date).toLocaleString("en-US", {
        timeZone: "America/New_York",
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })
}

/* Fetch all the emails */

export async function GET(req: Request) {
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    const token = session?.accessToken;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // Extract token from URL (/api/gmail/inbox?pageToken=abc)
    const { searchParams } = new URL(req.url);
    const pageToken = searchParams.get("pageToken") || undefined;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    try {
        const messageList = await gmail.users.messages.list({
            userId: "me",
            maxResults: 10,
            pageToken: pageToken,
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
                const dateHeader = headers.find((h) => h.name === "Date")?.value
                const subject = headers.find((h) => h.name === "Subject")?.value
                const sender = headers.find((h) => h.name === "From")?.value

                // Use the sender, subject and email to classify the email into a category (work, personal, spam, etc.)
                
                const classifyRes = await fetch("http://localhost:8000/api/classify/predict/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        sender: sender,
                        subject: subject,
                        email: email.data.snippet,
                        email_id: msg.id,
                        user_email: session?.user?.email
                    })
                });
                // const { category } = await classifyRes.json();
                let category = "Uncategorized";
                if (classifyRes.ok) {
                    try {
                        const data = await classifyRes.json();
                        category = data.category || "Uncategorized";
                    } catch (err) {
                        console.error("Django returned but invalid response", err);
                    }
                } else {
                    const errorText = await classifyRes.text();
                    console.error("Classification API error", classifyRes.status);
                }

                return {
                    id: msg.id,
                    subject: subject,
                    sender: sender,
                    date: dateHeader ? cleanDate(dateHeader) : "No Date",
                    snippet: he.decode(email.data.snippet ?? ""),
                    category: category || "Uncategorized"
                    };
            })
        );
        
        return NextResponse.json({
            emails, 
            nextPageToken: messageList.data.nextPageToken || null
        });
    } catch (error) {
        console.error("Gmail Fetch Error", error)
        return NextResponse.json({error: "Failed to fetch"});
    }
}