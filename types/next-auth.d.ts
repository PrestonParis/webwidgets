import { DefaultSession } from "next-auth";
declare module "next-auth" {
    interface Session {
        accessToken?: string;
        error?: string;
        user: {
        id: string;
        } & DefaultSession["user"];
    }
}

    declare module "next-auth/jwt" {
        interface JWT {
            accessToken?: string;
            refreshToken?: string;
            accessTokenExpires?: number;
            id?: string;
            }
}

export interface ExtendedSession {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    accessToken?: string;
}

interface GoogleRefreshResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
    refresh_token?: string; // if changed
}

/* 
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
*/