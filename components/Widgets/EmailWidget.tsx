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
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">Notifications</h3>
                <div className="bg-blue-50 text-blue-600 p-2 rounded-xl text-xs font-bold">Gmail</div>
            </div>

            <div className="grow space-y-3">
                {/* Just show the top 3 snippets for a quick glance */}
                {emails.slice(0, 3).map(mail => (
                    <div key={mail.id} className="text-xs border-b border-gray-50 pb-2 last:border-0">
                        <p className="font-semibold text-gray-700 truncate">{mail.subject}</p>
                        <p className="text-gray-400 truncate">{mail.snippet}</p>
                    </div>
                ))}
            </div>

            <Link 
                href="/personaldash/inbox" 
                className="mt-4 block text-center py-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-sm font-semibold transition-colors"
            >
                Open Full Inbox →
            </Link>
        </div>
    );
}