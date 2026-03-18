"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import LogoutButton from "@/components/SignOut";
import JournalForm from "@/components/JournalForm";

type Email = {
    id: string
    subject: string
    sender: string
    snippet: string
    date: string
}

export default function Page() {
    const { data: session } = useSession()
    const [emails, setEmails] = useState<Email[]>([]);

    useEffect(() => {
        if (!session) return;

        async function loadEmails() {
            const res = await fetch("/api/gmail/inbox");

            if (!res.ok) {
                console.error("Inbox API Failed");
                return
            }
            const data = await res.json();
            setEmails(data);
        }

        loadEmails();
    }, [session]);

    
    return (
    <>
        <Header />
        <h2>Journal</h2>
        <JournalForm />
        
        <LogoutButton/>
        {!session && 
            (<button onClick={() => signIn("google")}>Connect Gmail</button>
        )}

        <h2>Inbox</h2>

        {emails.map((mail) => (
            <div key={mail.id} style={{ marginBottom: "15px"}}>
                <strong>{mail.subject}</strong>
                <div>{mail.sender}</div>
                <div>{mail.snippet}</div>
                <small>{mail.date}</small>
            </div>
        ))}
    </>
    );
}