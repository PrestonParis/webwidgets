"use client"
import { supabase } from "@/app/lib/supabase"; 
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useEffect, useState, useRef } from "react";
import { Email } from "@/types/inbox";
import Link from "next/link";

export default function Emails() {
    const { user } = useAuth();
    const [emails, setEmails] = useState<Email[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const hasFetched = useRef(false);

    const loadEmails = useCallback(async (token?: string) => {
        if (!user || isUnauthorized) return;
        setLoading(true);

        try {
            const url = token 
                ? `/api/gmail/inbox?pageToken=${token}`
                : "/api/gmail/inbox";
            
            const res = await fetch(url, {
                credentials: "include",
                cache: "no-store",
            });

            // Handle unauthorized state (Google not connected)
            if (res.status === 401 || res.status === 403) {
                setIsUnauthorized(true);
                setLoading(false);
                return;
            }

            if (!res.ok) throw new Error("Inbox API Fail");
            
            const data = await res.json();
            const newEmails = data.emails || [];
            setEmails((prev) => (token ? [...prev, ...newEmails] : newEmails));
            setNextPageToken(data.nextPageToken);
        } catch (err) {
            console.error("Email fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [user, isUnauthorized]);
    
    useEffect(() => {
        if (user && !hasFetched.current && !isUnauthorized) {
            hasFetched.current = true;
            loadEmails();
        }
        return () => {
            if (user) hasFetched.current = false;
        };
    }, [user, loadEmails, isUnauthorized]);

    // UI for when Google isn't connected
    if (isUnauthorized) {
        return (
            <div className="max-w-2xl mx-auto p-4 mt-10">
                <div className="bg-white dark:bg-zinc-950 p-8 rounded-3xl border-2 border-dashed border-gray-200 dark:border-zinc-800 flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connect your Gmail</h2>
                        <p className="text-gray-500 dark:text-zinc-400 mt-2">To view and classify your emails, you need to sync your account.</p>
                    </div>
                    <Link 
                        href="/settings" 
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20"
                    >
                        Go to Settings
                    </Link>
                </div>
            </div>
        );
    }

    // Analytics Logic
    const senderCounts = (emails || []).reduce((acc: Record<string, number>, mail) => {
        const senderName = mail.sender ? mail.sender.split('<')[0].trim() : "Unknown Sender";
        acc[senderName] = (acc[senderName] || 0) + 1;
        return acc;
    }, {});

    const topSenders = Object.entries(senderCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const handleManualClassify = async (email_id: string, category: string, sender: string, subject: string) => {
        setEmails((prev) => prev.map((mail) => 
            mail.id === email_id ? { ...mail, category } : mail
        ));

        await supabase.from('email_classifications').upsert({ 
            email_id, category, sender, subject, 
            user_email: user?.email, is_manual: true 
        }, { onConflict: 'email_id' });
    };

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Inbox</h2>
                {loading && <div className="flex items-center gap-2 text-blue-500 text-sm font-medium">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                    Syncing...
                </div>}
            </div>

            {topSenders.length > 0 && (
                <div className="p-5 bg-linear-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-zinc-900 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200 mb-4 uppercase tracking-wider">Top Senders</h3>
                    <div className="flex flex-wrap gap-2">
                        {topSenders.map(([sender, count]) => (
                            <div key={sender} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-blue-100 dark:border-zinc-700 rounded-full shadow-sm">
                                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{sender}</span>
                                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {emails.map((mail) => (
                    <div key={mail.id} className="group p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:border-blue-300 dark:hover:border-blue-800 transition-all shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] uppercase px-2.5 py-1 rounded-lg font-bold ${
                                mail.category === 'work' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 
                                mail.category === 'promotions' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 
                                'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}>
                                {mail.category || "Uncategorized"}
                            </span>
                            <span className="text-[10px] font-medium text-gray-400">{mail.date}</span>
                        </div>

                        <div className="space-y-1">
                            <h4 className="text-gray-900 dark:text-zinc-100 font-bold truncate leading-tight">{mail.subject}</h4>
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{mail.sender}</div>
                            <p className="text-gray-500 dark:text-zinc-400 text-sm line-clamp-2 leading-relaxed mt-2 italic">&quot;{mail.snippet}&quot;</p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-zinc-800 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {['work', 'personal', 'notifications'].map((cat) => (
                                <button 
                                    key={cat}
                                    onClick={() => handleManualClassify(mail.id, cat, mail.sender, mail.subject)}
                                    className="text-[10px] bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-blue-600 hover:text-white px-3 py-1 rounded-lg transition-colors font-bold uppercase"
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {nextPageToken && (
                <button 
                    onClick={() => loadEmails(nextPageToken)}
                    disabled={loading}
                    className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-zinc-800 text-gray-500 hover:text-blue-600 hover:border-blue-400 rounded-2xl font-bold transition-all disabled:opacity-50"
                >
                    {loading ? "Loading..." : "Load Older Messages"}
                </button>
            )}
        </div>
    );
}