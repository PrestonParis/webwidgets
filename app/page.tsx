"use client";

import Header from "@/components/Global/Header";
import LogoutButton from "@/components/Global/SignOut";
import EmailWidget from "@/components/Widgets/EmailWidget";
import JournalWidget from "@/components/Widgets/JournalWidget";
import SoberWidget from "@/components/Widgets/RecoveryWidget";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import UnitConverterWidget from "@/components/Widgets/UnitConvertWidget";

export interface Tracker {
    id: string;
    addiction: string;
    start_time: string;
}

export default function Page() {
    const [trackers, setTrackers] = useState<Tracker[]>([]);
    const handleUpdateStart = (id: string, newStart: string) => {
        setTrackers((prev) =>
            prev.map((t) =>
                t.id === id ? { ...t, start_time: newStart } : t
            )
        );
    };

    useEffect(() => {
    const fetchTrackers = async () => {
        const { data } = await supabase
            .from("recovery_profiles")
            .select("*")
            .order("created_at", { ascending: true });
        setTrackers(data || []);
    };
    fetchTrackers();
}, []);
    return (
    <>
        <Header />
        {/* Changed bg-gray-50 to dark:bg-zinc-900 or dark:bg-black */}
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
            <main className="max-w-7xl mx-auto p-6 lg:p-12">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">
                            Command Center
                        </h1>
                        <p className="text-gray-500 dark:text-zinc-400">
                            Welcome back, Preston.
                        </p>
                    </div>
                    <LogoutButton />
                </div>

                {/* The Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    
                    <JournalWidget />

                    <EmailWidget />

                    {trackers.map((t) => (
                        <SoberWidget
                            key={t.id}
                            tracker={t}
                            onReset={handleUpdateStart}
                        />
                    ))}
                    
                    <UnitConverterWidget />
                </div>
            </main>
        </div>
    </>
);
}