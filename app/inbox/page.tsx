"use client"
import Header from "@/components/Global/Header";
import Emails from "@/components/Global/Emails";
import { AuthGuard } from "@/components/Inbox/AuthGuard"; 

export default function Page() {    
    return (
        <AuthGuard>
            <Header />
            <Emails />
        </AuthGuard>
    );
}