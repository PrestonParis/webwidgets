import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";

interface GoogleToken {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    };
}

interface GoogleRefreshResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
    refresh_token?: string; // if changed
}

// Refresh Access Token Helper
async function refreshAccessToken(token: GoogleToken) {
    try {
        const url = "https://oauth2.googleapis.com/token";
        const response = await fetch(url, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            method: "POST",
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
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

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline", // get refresh token
                    response_type: "code",
                    scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly", // Provide access
                },
            },
        }),
    ],

    callbacks: {
        async jwt({ token, account }) {
            // 1. Initial Sign In: save access, refresh, expiry
            if (account) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    accessTokenExpires: (account.expires_at ?? 0) * 1000,
                }
            }
            // 2. Return previous token if access token hasn't expired
            if (Date.now() < (token.accessTokenExpires as number)) {
                return token;
            }

            // 3. Access Token Expired: Update
            return refreshAccessToken(token as unknown as GoogleToken)
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string;
            // session.error = token.error
            return session;
        },
    },
};