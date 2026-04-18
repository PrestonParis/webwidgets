"use client"
import Header from "@/components/Global/Header";
import Emails from "@/components/Global/Emails";
import { AuthGuard } from "@/components/Inbox/AuthGuard"; // adjust path to wherever you created it

export default function Page() {    
    return (
        <AuthGuard>
        <Header />
        <Emails />
        </AuthGuard>
    );
}