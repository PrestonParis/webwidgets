import { google } from "googleapis";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import he from "he"
import { cleanDate } from "@/app/lib/utils/time";
import { TokenUpdate } from "@/types/inbox";

// Fetch all the emails
export async function GET(req: Request) {
    const cookieStore = await cookies();

    const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use Service Role Key here
    {
        cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) =>
                    cookieStore.set(name, value, options)
                );
            },
        },
    }
    );
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
                );
            },
            },
        }
    );

    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the user's Google tokens from Supabase
    const { data: tokenRow } = await supabaseAdmin
        .from("user_tokens")
        .select("access_token, refresh_token, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!tokenRow?.access_token) {
        return NextResponse.json({ error: "No Google token found" }, { status: 401 });
    }

    const userEmail = user.email;
    const { searchParams } = new URL(req.url);
    const pageToken = searchParams.get("pageToken") || undefined;

    // Set up Google OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    // Set the credentials for the OAuth2 client
    oauth2Client.setCredentials({
        access_token: tokenRow.access_token,
        refresh_token: tokenRow.refresh_token,
        expiry_date: Number(tokenRow.expires_at),
    });

    // Listen for token refresh events and update Supabase with new tokens
    oauth2Client.on('tokens', async (tokens) => {
        const updateData: TokenUpdate = {
            ...(tokens.access_token && { access_token: tokens.access_token }),
            ...(tokens.expiry_date && { expires_at: tokens.expiry_date }),
            ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
        };
        
        await supabaseAdmin
            .from("user_tokens")
            .update(updateData)
            .eq("user_id", user.id);
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    
    try {
        const messageList = await gmail.users.messages.list({
        userId: "me",
        maxResults: 10,
        pageToken,
        });

        const messages = messageList.data.messages || [];

        const rawEmails = await Promise.all(
        messages.map((msg) =>
            gmail.users.messages.get({
            userId: "me",
            id: msg.id!,
            format: "metadata",
            metadataHeaders: ["Subject", "From", "Date"],
            })
        )
        );

        const parsed = rawEmails.map((email, i) => {
        const headers = email.data.payload?.headers || [];
        const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";
        const sender  = headers.find((h) => h.name === "From")?.value || "Unknown Sender";
        const date    = headers.find((h) => h.name === "Date")?.value;
        return {
            id:      messages[i].id!,
            subject,
            sender,
            date:    date ? cleanDate(date) : "No Date",
            snippet: he.decode(email.data.snippet ?? ""),
        };
        });

        const emailIds = parsed.map((e) => e.id);
        const senders  = parsed.map((e) => e.sender);

        const { data: existingClasses } = await supabase
        .from("email_classifications")
        .select("email_id, sender, category")
        .eq("user_email", userEmail)
        .or(
            `email_id.in.(${emailIds.map(id => `"${id}"`).join(",")}),` +
            `sender.in.(${senders.map(s => `"${s}"`).join(",")})`
            );

        const classByEmailId = new Map(existingClasses?.map((c) => [c.email_id, c.category]) ?? []);
        const classBySender  = new Map(existingClasses?.map((c) => [c.sender,   c.category]) ?? []);

        const needsPrediction: typeof parsed = [];
        const categoryMap = new Map<string, string>();

        for (const email of parsed) {
        const cached = classByEmailId.get(email.id) ?? classBySender.get(email.sender);
        if (cached) {
            categoryMap.set(email.id, cached);
        } else {
            needsPrediction.push(email);
        }
        }

        if (needsPrediction.length > 0) {
            try {
                const mlRes = await fetch(`${process.env.ML_SERVICE_URL}/predict/batch`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        emails: needsPrediction.map((e) => ({
                        id:      e.id,
                        sender:  e.sender,
                        subject: e.subject,
                        })),
                    }),
                });

                if (mlRes.ok) {
                const predictions: { id: string; category: string }[] = await mlRes.json();

                supabase.from("email_classifications").insert(
                    predictions.map(({ id, category }) => {
                        const email = needsPrediction.find((e) => e.id === id)!;
                        return {
                            email_id:   id,
                            user_email: userEmail,
                            sender:     email.sender,
                            subject:    email.subject,
                            category,
                        };
                    })
                ).then();

                for (const { id, category } of predictions) {
                    categoryMap.set(id, category);
                }
                }
            } catch (mlError) {
                console.error("ML Service unreachable:", mlError);
            }
        }

        const emails = parsed.map((e) => ({
        ...e,
        category: categoryMap.get(e.id) ?? "Uncategorized",
        }));

        return NextResponse.json({
            emails,
            nextPageToken: messageList.data.nextPageToken || null,
        });

    } catch (error) {
        console.error("Gmail Fetch Error", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}