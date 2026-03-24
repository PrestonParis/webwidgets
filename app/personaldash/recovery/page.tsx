"use client";

import { supabase } from "@/app/lib/supabase";
import { useEffect, useState } from "react";

function formatTime(seconds: number) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
}

export default function RecoveryPage({ startTime }: { startTime: string | null }) {
    const [secondsClean, setSecondsClean] = useState(0);
    const [profile, setProfile] = useState<any>(null);
    const [urges, setUrges] = useState<any[]>([]);

    // Fetch data
    useEffect(() => {
        async function loadData() {
            const { data: profileData } = await supabase
                .from("recovery_profiles")
                .select("*")
                .maybeSingle();

            const { data: urgesData } = await supabase
                .from("urges")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(10);

            setProfile(profileData);
            setUrges(urgesData || []);
        }

        loadData();
    }, []);

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel("urges")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "urges" },
                (payload) => {
                    console.log("New urge:", payload);
                    setUrges((prev) => [payload.new, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Timer
    useEffect(() => {
        if (!startTime) return;

        const start = new Date(startTime).getTime();

        const interval = setInterval(() => {
            const now = Date.now();
            setSecondsClean(Math.floor((now - start) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <h1 className="text-xl font-bold">Recovery</h1>

            <p className="text-sm text-gray-500">
                Clean time: {secondsClean}s
            </p>

            <div className="mt-4">
                <h2 className="font-bold">Recent Urges</h2>
                {urges.map((u, i) => (
                    <div key={i} className="text-sm text-gray-600">
                        {u.trigger || "No trigger"} — {u.intensity || "?"}
                    </div>
                ))}
            </div>
            
            {/* Current Streak */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center space-y-4">
                <p className="text-xs font-mono text-gray-400">CURRENT STREAK</p>

                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    {startTime ? formatTime(secondsClean) : "0d 0h 0m 0s"}
                </h1>

                <p className="text-sm text-gray-500 italic">
                    {startTime ? `Since ${new Date(startTime).toLocaleDateString()}` : "Start your recovery today"}
                </p>

                {/* Milestones */}
                <div className="flex justify-center gap-2 flex-wrap pt-2">
                    {["1 Day", "7 Days", "30 Days", "90 Days"].map((m) => (
                        <span key={m} className="px-3 py-1 text-xs font-bold bg-purple-50 text-purple-600 rounded-full">
                            {m}
                        </span>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Log Urge */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-800 text-lg">Log an Urge</h3>

                    <textarea
                        placeholder="What triggered it?"
                        className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                    />

                    <button className="w-full py-3 bg-purple-600 text-white rounded-2xl text-sm font-bold hover:bg-purple-700 active:scale-[0.98]">
                        Record Urge
                    </button>
                </div>

                {/* Relapse */}
                <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-red-600 text-lg">Reset / Relapse</h3>

                    <p className="text-xs text-gray-500">
                        Be honest. This resets your streak but keeps your data.
                    </p>

                    <button className="w-full py-3 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600 active:scale-[0.98]">
                        Reset Streak
                    </button>
                </div>
            </div>

            {/* Progress */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-lg">Progress</h3>
                    <span className="text-xs text-gray-400 font-mono">Last 30 Days</span>
                </div>

                {/* Placeholder Graph */}
                <div className="h-40 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                    Graph coming soon
                </div>
            </div>

            {/* History */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 text-lg">Recent Activity</h3>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                        <span>Urge logged</span>
                        <span className="text-xs text-gray-400">2h ago</span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                        <span>7 day milestone reached</span>
                        <span className="text-xs text-gray-400">Yesterday</span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                        <span>Streak started</span>
                        <span className="text-xs text-gray-400">March 10</span>
                    </div>
                </div>
            </div>

        </div>
    );
}