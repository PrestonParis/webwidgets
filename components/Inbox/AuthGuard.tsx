"use client";
import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.error === "RefreshAccessTokenError") {
            signIn("google"); // Kicks them to Google consent screen, gets fresh tokens
        }
    }, [session]);

    return <>{children}</>;
}