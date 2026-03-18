"use client"

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

interface JournalEntry {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

export default function JournalForm() {
    const { data: session } = useSession()
    const [title, setTitle] = useState("")
    const [entries, setEntries] = useState([])
    const [content, setContent] = useState("")
    const [isSaving, setIsSaving] = useState(false)


    // 1. Fetch Journals
    const fetchEntries = useCallback( async () => {
        if (!session?.accessToken) return;
        try {
            const response = await fetch("http://localhost:8000/journal/", {
                headers: {
                    "Authorization": `Bearer ${session.accessToken}`,
                },
        });
            const data = await response.json()
            setEntries(data);
        } catch (error) {
            console.error("Failed to fetch entries: ", error)
        }
    }, [session?.accessToken]); // Only Recreates if token changes

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries])
    
    // 2. Saving Journals
    const handleSubmit = async (e: React.BaseSyntheticEvent) => {
        e.preventDefault()
        if (!session?.accessToken) {
            return;
        }

        setIsSaving(true)

        try {
            const response = await fetch("http://localhost:8000/journal/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": ` Bearer ${session.accessToken}`
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
    };
    
    return (
        <>
        <main className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <h1 className="text-gray-900 text-xl font-semibold tracking-tight">Journal</h1>
        {/*Journal Form: Left Column */}
        <section className="lg:col-span-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-8">
                <h2 className="text-lg font-bold mb-4">Create Entry</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input 
                        type="text" 
                        placeholder="Journal Title"
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        required
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                    <textarea 
                        placeholder="Write your entry here..." 
                        value={content}
                        onChange={(e) => setContent(e.target.value)} 
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 h-48 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
                        required
                    />
                    <button 
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:bg-gray-300"
                    >
                        {isSaving ? "Saving... ": "Save Journal Entry"}
                    </button>
                </form>
            </div>
        </section>
        <section className="lg:col-span-8 space-y-6">
            {/* 3. Display Journals */}
            <div className="flex justify-between items-end mb-2">
                <h2 className="text-2xl font-black tracking-tight">Recent Activity</h2>
                <span className="text-sm text-gray-500">{entries.length} Entries</span>
            </div>
            {entries.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                    <p className="text-gray-400">Your journal is empty. Start writing!</p>
                </div>
                ): (
                    entries.map((entry: JournalEntry) => (
                        <div key={entry.id} 
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold group-hover:text-blue-600 transition-colors">
                                    {entry.title}
                                </h3>
                                <time className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                                    {new Date(entry.created_at).toLocaleDateString()}
                                </time>
                            </div>
                        <p className="text-gray-700 leading-relaxed italic border-l-2 border-gray-100 pl-4">
                            {entry.content}
                        </p>
                        </div>
                    ))
                )}
        </section>
        </main>
    </>

);
}