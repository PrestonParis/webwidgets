"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";

export default function Page() {
    const [emails, setEmails] = useState([]);

    useEffect(() => {
    async function loadEmails() {
        const res = await fetch("/api/gmail/inbox");
        const data = await res.json();
        setEmails(data);
    }

    loadEmails();
    }, []);

    return (
    <>
        <Header />

        <a href="/api/gmail/login">Connect Gmail</a>

        {emails.map((mail, i) => (
        <div key={i}>
            <b>{mail.subject}</b>
            <p>{mail.sender}</p>
            <p>{mail.snippet}</p>
        </div>
        ))}
    </>
    );
}