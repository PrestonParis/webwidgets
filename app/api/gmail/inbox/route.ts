import { google } from "googleapis";
import { authOptions } from "@/app/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import he from "he"
import { supabase } from "@/app/lib/supabase";
import { cleanDate } from "@/app/lib/utils/time";
import { ExtendedSession } from "@../../../types/next-auth";

/* Fetch all the emails */
export async function GET(req: Request) {
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    const token = session?.accessToken;

    if (!token || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { searchParams } = new URL(req.url);
    const pageToken = searchParams.get("pageToken") || undefined;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    try {
    const messageList = await gmail.users.messages.list({
        userId: "me",
        maxResults: 10,
        pageToken,
    });

    const messages = messageList.data.messages || [];

    // ── 1. Fetch all Gmail metadata in parallel (was serial) ──────────
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

    // ── 2. Parse headers ───────────────────────────────────────────────
    const parsed = rawEmails.map((email, i) => {
        const headers  = email.data.payload?.headers || [];
        const subject  = headers.find((h) => h.name === "Subject")?.value || "No Subject";
        const sender   = headers.find((h) => h.name === "From")?.value || "Unknown Sender";
        const date     = headers.find((h) => h.name === "Date")?.value;
        return {
        id:      messages[i].id!,
        subject,
        sender,
        date:    date ? cleanDate(date) : "No Date",
        snippet: he.decode(email.data.snippet ?? ""),
        };
    });

    // ── 3. ONE Supabase query for all email IDs at once (was N queries) ─
    const emailIds = parsed.map((e) => e.id);
    const senders  = parsed.map((e) => e.sender);

    const { data: existingClasses } = await supabase
        .from("email_classifications")
        .select("email_id, sender, category")
        .eq("user_email", userEmail)
        .or(`email_id.in.(${emailIds.join(",")}),sender.in.(${senders.join(",")})`);

    const classByEmailId = new Map(existingClasses?.map((c) => [c.email_id, c.category]) ?? []);
    const classBySender  = new Map(existingClasses?.map((c) => [c.sender,   c.category]) ?? []);

    // ── 4. Split into cached vs needs prediction ───────────────────────
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

    // ── 5. ONE batch FastAPI call instead of N individual calls ─────────
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
            // Expects: [{ id, category }, ...]
            const predictions: { id: string; category: string }[] = await mlRes.json();

            // Fire-and-forget bulk insert
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

    // ── 6. Assemble final response ─────────────────────────────────────
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