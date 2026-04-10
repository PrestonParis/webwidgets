"use client"

import Header from "@/components/Global/Header";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
interface JournalEntry {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

export function JournalForm() {
    const { data: session } = useSession()
    const [title, setTitle] = useState("")
    const [entries, setEntries] = useState<JournalEntry[]>([])
    const [content, setContent] = useState("")
    const [isSaving, setIsSaving] = useState(false)


    // 1. Fetch Journals
    const fetchEntries = useCallback(async () => {
        if (!session?.user?.id) return;
        
        const { data, error } = await supabase
            .from('journals')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Fetch error:", error.message);
        } else {
            setEntries(data || []);
        }
    }, [session, supabase]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries])
    
    // 2. Saving Journals
    const handleSubmit = async (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        if (!session?.user?.id) return;

        setIsSaving(true);

        const { error } = await supabase
            .from('journals')
            .insert([
                { 
                    title, 
                    content, 
                    user_id: session.user.id
                }
            ]);

        if (!error) {
            setTitle("");
            setContent("");
            fetchEntries();
        } else {
            console.error("Save error:", error.message);
        }
        setIsSaving(false);
    };
    
    return (
    <>
        <main className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 py-8">
            <h1 className="text-gray-900 dark:text-zinc-100 text-xl font-semibold tracking-tight lg:col-span-12">
                Journal
            </h1>
            
            {/* Journal Form: Left Column */}
            <section className="lg:col-span-4">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 sticky top-8 transition-colors">
                    <h2 className="text-lg font-bold mb-4 dark:text-white">Create Entry</h2>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <input 
                            spellCheck="true"
                            type="text" 
                            placeholder="Journal Title"
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            required
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-transparent dark:text-zinc-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                        />
                        <textarea 
                            spellCheck="true"
                            placeholder="Write your entry here..." 
                            value={content}
                            onChange={(e) => setContent(e.target.value)} 
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-transparent dark:text-zinc-100 h-48 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all outline-none resize-none placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                            required
                        />
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-blue-600 dark:bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all disabled:bg-gray-300 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                        >
                            {isSaving ? "Saving... " : "Save Journal Entry"}
                        </button>
                    </form>
                </div>
            </section>

            <section className="lg:col-span-8 space-y-6">
                {/* 3. Display Journals */}
                <div className="flex justify-between items-end mb-2">
                    <h2 className="text-2xl font-black tracking-tight dark:text-white">Recent Activity</h2>
                    <span className="text-sm text-gray-500 dark:text-zinc-400">{entries.length} Entries</span>
                </div>

                {entries.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900/50 p-12 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 text-center">
                        <p className="text-gray-400 dark:text-zinc-500">Your journal is empty. Start writing!</p>
                    </div>
                ) : (
                    entries.map((entry: JournalEntry) => (
                        <div key={entry.id} 
                            className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-900 transition-colors group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors dark:text-zinc-100">
                                    {entry.title}
                                </h3>
                                <time className="text-xs font-medium text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-800 px-2 py-1 rounded-md">
                                    {new Date(entry.created_at).toLocaleDateString()}
                                </time>
                            </div>
                            <p className="text-gray-700 dark:text-zinc-300 leading-relaxed italic border-l-2 border-gray-100 dark:border-zinc-800 pl-4">
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
export default function Page() {
    return (
        <>  
            <Header />
            <JournalForm />
        </>
    );
}