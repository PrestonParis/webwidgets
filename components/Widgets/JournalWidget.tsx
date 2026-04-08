"use client"

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ExtendedSession } from "@/app/api/gmail/inbox/route";

export interface JournalEntry {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

export default function JournalWidget() {
    const { data: session } = useSession() as { data: ExtendedSession };
    const [latestEntry, setLatestEntry] = useState<JournalEntry | null>(null);
    const [count, setCount] = useState(0);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            const token = session?.accessToken;
            if (!token) return;
            
            try {
                const response = await fetch("http://localhost:8000/journal/", {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                
                if (response.ok && isMounted) {
                    const data: JournalEntry[] = await response.json();
                    setLatestEntry(data[0] || null);
                    setCount(data.length);
                }
            } catch (error) {
                console.error("Journal Widget fetch failed:", error);
            }
        };

        load();

        return () => { isMounted = false; };
    }, [session?.accessToken]); // Triggers only when the login token is ready

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">Journal</h3>
                <div className="bg-green-50 text-green-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {count} Total
                </div>
            </div>

            <div className="grow">
                {latestEntry ? (
                    <div className="space-y-2">
                        <p className="text-xs font-mono text-gray-400">
                            LAST ENTRY • {new Date(latestEntry.created_at).toLocaleDateString()}
                        </p>
                        <h4 className="font-bold text-gray-900 line-clamp-1">{latestEntry.title}</h4>
                        <p className="text-gray-500 text-xs italic line-clamp-3 border-l-2 border-gray-100 pl-3">
                            {latestEntry.content}
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm italic py-4 text-center">No entries yet...</p>
                )}
            </div>

            <Link 
                href="/journal" 
                className="mt-6 block text-center py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
                + New Entry
            </Link>
        </div>
    );
}