"use client"
import { useAuth } from "@/hooks/useAuth";
import Link from 'next/link';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Email } from '@/types/inbox';
import EmptyInbox from "../Dashboard/EmptyInbox";

export default function EmailWidget() {
    const { user } = useAuth();
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(false);
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const hasFetched = useRef(false); // Add this to prevent double-fetching

    const loadEmails = useCallback(async (token?: string) => {
        if (!user) return;
        
        // Don't fetch if already unauthorized
        if (isUnauthorized) return;
        
        setLoading(true);

        try {
            const url = token 
                ? `/api/gmail/inbox?pageToken=${token}`
                : "/api/gmail/inbox";
            
            const res = await fetch(url, {
                credentials: "include",
                cache: "no-store",
            });

            // Handle unauthorized/not connected state
            if (res.status === 401 || res.status === 403) {
                setIsUnauthorized(true);
                setLoading(false);
                return;
            }

            if (!res.ok) throw new Error("Inbox API Fail");
            
            const data = await res.json();
            setEmails((prev) => (token ? [...prev, ...data.emails] : data.emails));
        } catch (err) {
            console.error("Email fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [user, isUnauthorized]); // Add isUnauthorized dependency
    
    useEffect(() => {
        // Only fetch once when user is available and not yet fetched
        if (user && !hasFetched.current && !isUnauthorized) {
            hasFetched.current = true;
            loadEmails();
        }
        
        // Reset fetch flag when user changes
        return () => {
            if (user) hasFetched.current = false;
        };
    }, [user, loadEmails, isUnauthorized]); // Add isUnauthorized

    // 1. Connection Prompt State
    if (isUnauthorized) {
        return (
            <EmptyInbox />
        );
    }

    return (
        <div className="group relative bg-white dark:bg-zinc-950 p-6 rounded-3xl border-2 border-transparent hover:border-blue-500/50 shadow-sm hover:shadow-xl hover:scale-[1.02] hover:bg-white dark:hover:bg-zinc-900/80 transition-all duration-300 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-zinc-100 text-lg">
                        Notifications
                    </h3>
                </div>
                
                <div className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                    Gmail
                </div>
            </div>

            <div className="grow space-y-3">
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-10 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
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
                        {emails.length === 0 && !loading && (
                            <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-zinc-500 text-center">
                                    Inbox is clear!
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Link 
                href="/inbox" 
                className="mt-6 block text-center py-2.5 bg-gray-50 dark:bg-zinc-900/50 text-gray-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl text-sm font-semibold transition-colors"
            >
                Open Full Inbox →
            </Link>
        </div>
    );
}