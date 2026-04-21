"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { User } from "@supabase/supabase-js";

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data }) => {
            setUser(data.session?.user ?? null);
            setStatus(data.session ? "authenticated" : "unauthenticated");
        });

    // Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        setUser(session?.user ?? null);
        setStatus(session ? "authenticated" : "unauthenticated");
        // Store Google tokens when signing in
        if (event === "SIGNED_IN" && session?.provider_token) {
            await supabase.from("user_tokens").upsert({
                user_id: session.user.id,
                access_token: session.provider_token,
                refresh_token: session.provider_refresh_token ?? null,
                updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });
        }
    });

    return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                scopes: "https://www.googleapis.com/auth/gmail.readonly",
                queryParams: {
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        });
        };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return {
        user,
        status,
        loading: status === "loading",
        signInWithGoogle,
        signOut,
        firstName: user?.user_metadata?.full_name?.split(" ")[0] ?? "there",
        userId: user?.id,
    };
}