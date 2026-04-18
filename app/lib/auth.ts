import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { refreshAccessToken } from "./oauth";


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
        async jwt({ token, account, user }) {
            // 1. Initial Sign In: save access, refresh, expiry
            if (account && user) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    accessTokenExpires: (account.expires_at ?? 0) * 1000,
                    id: user.id
                }
            }
            // 2. Return previous token if access token hasn't expired
            if (Date.now() < (token.accessTokenExpires as number)) {
                return token;
            }

            // 3. Access Token Expired: Update
            return refreshAccessToken(token);
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string;
            session.error = token.error as string | undefined;
            if (session.user) {
                // Attach the ID so session.user.id exists in component
                session.user.id = token.id as string; 
            }
            return session;
        },
    },
};