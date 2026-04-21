"use client"

import { supabase } from "@/app/lib/supabase";
import { signIn } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Email } from "@/types/inbox";
import { useAuth } from "@/hooks/useAuth";

export default function Emails() {
    const { user } = useAuth();
    const [emails, setEmails] = useState<Email[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(false);

    // Fetch function for initial load and load more
    const loadEmails = useCallback(async (token?: string) => {
        if (!user) return;
        setLoading(true);

        try {
            const url = token 
                ? `/api/gmail/inbox?pageToken=${token}`
                : "/api/gmail/inbox"
            
            const res = await fetch(url)
            if (!res.ok) throw new Error("Inbox API Fail")
            
            const data = await res.json()
            
            // Append if there's a token or start fresh
            const newEmails = data.emails || [];
            setEmails((prev) => (token ? [...prev, ...newEmails] : newEmails));
            setNextPageToken(data.nextPageToken);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user]) // Only if user changes
    
    useEffect(() => {
        // Receive emails from /api/gmail/inbox/route.ts
        if (user) {
            loadEmails();
        }
    }, [user, loadEmails]);

    // Handler for manual classification from the UI
    const senderCounts = (emails || []).reduce((acc: Record<string, number>, mail) => {
        const senderName = mail.sender ? mail.sender.split('<')[0].trim() : "Unknown Sender";
        acc[senderName] = (acc[senderName] || 0) + 1;
        return acc
    }, {})

    // Get top 5 senders by count
    const topSenders = Object.entries(senderCounts)
    .sort((a ,b) => b[1] - a[1])
    .slice(0, 5)
    
    // Function to handle manual classification from the UI
    const handleManualClassify = async (email_id: string, category: string, sender: string, subject: string) => {
        // Optimistic UI update
        setEmails((prev) => prev.map((mail) => 
            mail.id === email_id ? { ...mail, category } : mail
        ));

        // Write to Supabase instead of Django
        const { error } = await supabase
            .from('email_classifications')
            .upsert({ 
                email_id, 
                category, 
                sender, 
                subject, 
                user_email: user?.email,
                is_manual: true 
            }, { onConflict: 'email_id' });

        if (error) console.error("Failed to save classification:", error);
    };

    return (
        <>
        <div className="max-w-2xl mx-auto p-4">
            {!user ? (
                <button 
                    onClick={() => signIn("google")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                    Connect Gmail
                </button>
            ) : (
                <>  
                    {/* Header with title and syncing status */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-gray-900 text-xl font-semibold tracking-tight">Inbox</h2>
                        {loading && <span className="text-sm text-blue-500 animate-pulse">Syncing...</span>}
                    </div>

                    {/* Display top senders with counts */}
                    {topSenders.length > 0 && (
                        <div className="mb-8 p-4 bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                            <h3 className="text-gray-900 font-semibold mb-3">Top Senders</h3>
                            <div className="space-y-2">
                                {topSenders.map(([sender, count]) => (
                                    <div key={sender} className="flex items-center justify-between p-2 bg-white rounded-lg">
                                        <span className="text-gray-700 font-medium">{sender}</span>
                                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{count} emails</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Email list with sender, subject, snippet and date */}
                    <div className="space-y-4">
                        {Array.isArray(emails) && emails.map((mail) => (
                            <div key={mail.id} className="group p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all relative">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                                            mail.category === 'work' ? 'bg-purple-100 text-purple-600' : 
                                            mail.category === 'promotions' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {mail.category || "Uncategorized"}
                                        </span>

                                        {/* 2. Buttons are now siblings to the span, inside the group */}
                                        <div className="flex gap-1 animate-in fade-in slide-in-from-left-2">
                                            {['work', 'personal', 'notifications'].map((cat) => (
                                                <button 
                                                    key={cat}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleManualClassify(mail.id, cat, mail.sender, mail.subject);
                                                    }}
                                                    className="text-[9px] bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-2 py-0.5 rounded transition-colors font-bold"
                                                >
                                                    + {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <small className="text-gray-400 font-mono text-[10px]">{mail.date}</small>
                                </div>

                                <div className="space-y-1">
                                    <strong className="text-gray-900 block truncate max-w-[90%]">{mail.subject}</strong>
                                    <div className="text-sm text-blue-600 font-medium">{mail.sender}</div>
                                    <div className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{mail.snippet}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Load more button if there's a nextPageToken */}
                    {nextPageToken && (
                        <button 
                            onClick={() => loadEmails(nextPageToken)}
                            disabled={loading}
                            className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all disabled:opacity-50"
                        >
                            {loading ? "Loading..." : "View More Notifications"}
                        </button>
                    )}
                </>
        
            )}
        </div>
        </>
    );
}
