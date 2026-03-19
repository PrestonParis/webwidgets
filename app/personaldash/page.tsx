"use client";

import Header from "@/components/Header";
import LogoutButton from "@/components/SignOut";
import JournalForm from "@/components/JournalForm";
import EmailList from "@/components/EmailList";

export default function Page() {
    return (
    <>
        <Header />
        <JournalForm />
        <EmailList />
        <LogoutButton/>
        
    </>
    );
}