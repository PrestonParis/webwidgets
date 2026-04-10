import { google } from "googleapis";
import { authOptions } from "@/app/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import he from "he"
import { supabase } from "@/app/lib/supabase";
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

    if (!token || !session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
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
                const dateHeader = headers.find((h) => h.name === "Date")?.value;
                const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";
                const sender = headers.find((h) => h.name === "From")?.value || "Unknown Sender";

                let category = "Uncategorized";

                // 1. Check Supabase for existing classification
                const { data: existingClass } = await supabase
                    .from('email_classifications')
                    .select('category')
                    .eq('user_email', session.user.email)
                    .or(`email_id.eq.${msg.id},sender.eq.${sender}`)
                    .maybeSingle(); // maybeSingle handles 0 results without error

                if (existingClass) {
                    category = existingClass.category;
                } else {
                    try {
                        // 2. Fallback to FastAPI service
                        const mlRes = await fetch("http://localhost:8080/predict", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ sender, subject })
                        });

                        if (mlRes.ok) {
                            const { category: predicted } = await mlRes.json();
                            category = predicted;

                            // 3. Save prediction to Supabase (Fire-and-forget)
                            supabase.from('email_classifications').insert({
                                email_id: msg.id,
                                user_email: session.user.email,
                                sender,
                                subject,
                                category: predicted
                            }).then();
                        }
                    } catch (mlError) {
                        console.error("ML Service unreachable:", mlError);
                        category = "Uncategorized";
                    }
                }

                return {
                    id: msg.id,
                    subject,
                    sender,
                    date: dateHeader ? cleanDate(dateHeader) : "No Date",
                    snippet: he.decode(email.data.snippet ?? ""),
                    category: category
                };
            })
        );
        
        return NextResponse.json({
            emails, 
            nextPageToken: messageList.data.nextPageToken || null
        });
    } catch (error) {
        console.error("Gmail Fetch Error", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}