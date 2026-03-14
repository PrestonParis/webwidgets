import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    console.log("CLIENT ID:", process.env.GOOGLE_CLIENT_ID);
    console.log("REFRESH:", process.env.GOOGLE_REFRESH_TOKEN);

    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
    return NextResponse.json(
        { error: "Missing OAuth code" },
        { status: 400 }
    );
    }


    const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:3000/api/gmail/callback"
    );

    const { tokens } = await oauth2Client.getToken(code!);

    oauth2Client.setCredentials(tokens);

    return NextResponse.json(tokens);
}