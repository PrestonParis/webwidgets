import { google } from "googleapis";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import he from "he";
import { cleanDate } from "@/app/lib/utils/time";

export async function GET(req: Request) {
    const cookieStore = await cookies();

    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
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
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: tokenRow } = await supabaseAdmin
        .from("user_tokens")
        .select("access_token, refresh_token, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!tokenRow?.access_token) {
        return NextResponse.json({ error: "No Google token found" }, { status: 401 });
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
        access_token: tokenRow.access_token,
        refresh_token: tokenRow.refresh_token,
        expiry_date: Number(tokenRow.expires_at),
    });

    try {
        await oauth2Client.getAccessToken();
    } catch (e) {
        console.error("OAuth token refresh failed:", e);
        return NextResponse.json({ error: "Gmail auth expired" }, { status: 401 });
    }

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const { searchParams } = new URL(req.url);
    const pageToken = searchParams.get("pageToken") || undefined;

    try {
        // 1. ONLY fetch message IDs first
        const listRes = await gmail.users.messages.list({
            userId: "me",
            maxResults: 10,
            pageToken,
        });

        const messages = listRes.data.messages || [];
        const ids = messages.map((m) => m.id!).filter(Boolean);

        if (ids.length === 0) {
            return NextResponse.json({ emails: [], nextPageToken: null });
        }

        // 2. Batch fetch message details (IMPORTANT OPTIMIZATION)
        const batch = await Promise.all(
            ids.map((id) =>
                gmail.users.messages.get({
                    userId: "me",
                    id,
                    format: "metadata",
                    metadataHeaders: ["Subject", "From", "Date"],
                })
            )
        );

        const parsed = batch.map((email, i) => {
            const headers = email.data.payload?.headers || [];

            const subject =
                headers.find((h) => h.name === "Subject")?.value || "No Subject";
            const sender =
                headers.find((h) => h.name === "From")?.value || "Unknown Sender";
            const date =
                headers.find((h) => h.name === "Date")?.value || null;

            return {
                id: ids[i],
                subject,
                sender,
                date: date ? cleanDate(date) : "No Date",
                snippet: he.decode(email.data.snippet ?? ""),
            };
        });

        // 3. Classification lookup
        const emailIds = parsed.map((e) => e.id);
        const senders = parsed.map((e) => e.sender);

        const { data: existing } = await supabase
            .from("email_classifications")
            .select("email_id, sender, category")
            .eq("user_email", user.email)
            .or(
                `email_id.in.(${emailIds.map((id) => `"${id}"`).join(",")}),` +
                `sender.in.(${senders.map((s) => `"${s}"`).join(",")})`
            );

        const byId = new Map(existing?.map((c) => [c.email_id, c.category]) ?? []);
        const bySender = new Map(existing?.map((c) => [c.sender, c.category]) ?? []);

        const categoryMap = new Map<string, string>();
        const needsML: typeof parsed = [];

        for (const email of parsed) {
            const cached = byId.get(email.id) ?? bySender.get(email.sender);

            if (cached) {
                categoryMap.set(email.id, cached);
            } else {
                needsML.push(email);
            }
        }

        // 4. ML prediction batch
        if (needsML.length > 0) {
            const mlRes = await fetch(
                `${process.env.ML_SERVICE_URL}/predict/batch`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        emails: needsML.map(({ id, sender, subject }) => ({
                            id,
                            sender,
                            subject,
                        })),
                    }),
                }
            );

            if (mlRes.ok) {
                const predictions: { id: string; category: string }[] =
                    await mlRes.json();

                await supabase.from("email_classifications").insert(
                    predictions.map(({ id, category }) => {
                        const email = needsML.find((e) => e.id === id)!;

                        return {
                            email_id: id,
                            user_email: user.email,
                            sender: email.sender,
                            subject: email.subject,
                            category,
                        };
                    })
                );

                for (const p of predictions) {
                    categoryMap.set(p.id, p.category);
                }
            }
        }

        // 5. Final response
        const emails = parsed.map((e) => ({
            ...e,
            category: categoryMap.get(e.id) ?? "Uncategorized",
        }));

        return NextResponse.json({
            emails,
            nextPageToken: listRes.data.nextPageToken || null,
        });
    } catch (err) {
        console.error("Gmail Fetch Error", err);
        return NextResponse.json(
            { error: "Failed to fetch" },
            { status: 500 }
        );
    }
}