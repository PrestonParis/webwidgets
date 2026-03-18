"use client"

import { useSession } from "next-auth/react";
import { useState } from "react";


export default function JournalForm() {
    const { data: session } = useSession()
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const handleSubmit = async (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        
        if (!session?.accessToken) {
            console.error("No Access Token");
            return;
        }
        setIsSaving(true)

    try {
        // POST to Django for Journals
        const response = await fetch("http://localhost:8000/journal/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify({ title, content }),
        });

        if (response.ok) {
            console.log("Entry Saved")
            setTitle("") // Clear for next entry
            setContent("")
        };
        } catch (error) {
            console.error("Failed to save entry:", error)
        } finally {
            setIsSaving(false);
    }
    }
    return (
        <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Journal Title"
            value={title} onChange={(e) => setTitle(e.target.value)} required></input>
            <textarea placeholder="Write your entry here..." value={content}
            onChange={(e) => setContent(e.target.value)} required></textarea>
            <button type="submit" disabled={isSaving}>
                {isSaving ? "Saving... ": "Save Journal Entry"}
            </button>
        </form>
    )
};


