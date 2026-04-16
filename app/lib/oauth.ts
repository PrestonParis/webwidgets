import { GoogleRefreshResponse } from "@/types/next-auth";
import { JWT } from "next-auth/jwt";

// Refresh Access Token Helper
export async function refreshAccessToken(token: JWT): Promise<JWT> {
    try {
        const url = "https://oauth2.googleapis.com/token";
        const response = await fetch(url, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            method: "POST",
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken ?? "",
            })
        });

        const refreshedTokens: GoogleRefreshResponse = await response.json()

        if (!response.ok) throw refreshedTokens;

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        };
    } catch (error) {
        console.error("RefreshAccessTokenError", error);
        return {
            ...token,
            error: "RefreshAccessTokenError"
        }
    }
}