"use client";
import { useSession } from "next-auth/react";
import Dashboard from "@/components/Dashboard/DashboardView";
import SignInPage from "@/components/Auth/SignInPage";

// Main page component that conditionally renders either the dashboard or the sign-in page based on authentication status.
export default function Page() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    return session ? <Dashboard /> : <SignInPage />;
}