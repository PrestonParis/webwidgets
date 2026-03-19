import { signIn, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

type Email = {
    id: string
    subject: string
    sender: string
    snippet: string
    date: string
}

export default function EmailList() {
    const { data: session } = useSession();
    const [emails, setEmails] = useState<Email[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(false);

    // Fetch function for initial load and load more
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
            
            // Append if there's a token or start fresh
            setEmails((prev) => (token ? [...prev, ...data.emails]: data.emails))
            setNextPageToken(data.nextPageToken);
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
        <div className="max-w-2xl mx-auto p-4">
            {!session ? (
                <button 
                    onClick={() => signIn("google")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                    Connect Gmail
                </button>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-gray-900 text-xl font-semibold tracking-tight">Inbox</h2>
                        {loading && <span className="text-sm text-blue-500 animate-pulse">Syncing...</span>}
                    </div>
                    <div className="space-y-4">
                        {emails.map((mail) => (
                            <div key={mail.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <strong className="text-gray-900 block truncate max-w-[70%]">{mail.subject}</strong>
                                    <small className="text-gray-400 font-mono whitespace-nowrap ml-2">{mail.date}</small>
                                </div>
                                <div className="text-sm text-blue-600 font-medium mb-1">{mail.sender}</div>
                                <div className="text-gray-500 text-sm line-clamp-2">{mail.snippet}</div>
                            </div>
                        ))}
                    </div>

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
    );
}
