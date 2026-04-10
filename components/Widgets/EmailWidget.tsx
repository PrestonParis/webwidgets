"use client"
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type Email = {
    id: string
    subject: string
    sender: string
    snippet: string
    date: string
}

export default function EmailWidget() {
    const { data: session } = useSession();
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(false);
    const loadEmails = useCallback(async (token?: string) => {
            if (!session) return;
            setLoading(true);
    
            try {
                const url = token 
                    ? `/api/gmail/inbox?pageToken=${token}`
                    : "/api/gmail/inbox"
                
                const res = await fetch(url)
                if (!res.ok) throw new Error("Inbox API Fail")
                
                const data = await res.json()
                setEmails((prev) => (token ? [...prev, ...data.emails]: data.emails))
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, [session]) // Only if session changes
        
        useEffect(() => {
            // Receive emails from /api/gmail/inbox/route.ts
            if (session) {
                loadEmails();
            }
        }, [session, loadEmails]);
    
    return (
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-800 dark:text-zinc-100 text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Notifications
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-xl text-xs font-bold">
                    Gmail
                </div>
            </div>

            <div className="grow space-y-3">
                {/* Top 3 snippets */}
                {emails.slice(0, 3).map(mail => (
                    <div key={mail.id} className="text-xs border-b border-gray-50 dark:border-zinc-900 pb-2 last:border-0">
                        <p className="font-semibold text-gray-700 dark:text-zinc-200 truncate">
                            {mail.subject}
                        </p>
                        <p className="text-gray-400 dark:text-zinc-500 truncate">
                            {mail.snippet}
                        </p>
                    </div>
                ))}
                {emails.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-zinc-600 italic text-center py-4">
                        Inbox is clear!
                    </p>
                )}
            </div>

            <Link 
                href="/inbox" 
                className="mt-4 block text-center py-2 bg-gray-50 dark:bg-zinc-900/50 text-gray-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl text-sm font-semibold transition-colors"
            >
                Open Full Inbox →
            </Link>
        </div>
    );
}