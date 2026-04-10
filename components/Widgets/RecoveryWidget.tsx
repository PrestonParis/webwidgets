"use client";

import { supabase } from "@/app/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";
interface SoberWidgetProps {
    tracker: {
        id: string;
        addiction: string;
        start_time: string;
    };
    onReset: (id: string, newStart: string) => void;
}

function formatTime(seconds: number) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
}

export default function SoberWidget({ tracker, onReset }: SoberWidgetProps) {    
    const [secondsClean, setSecondsClean] = useState(0);
    const startTime = tracker.start_time;
    const addiction = tracker.addiction;
    const [trigger, setTrigger] = useState("");
    const [showUrgeForm, setShowUrgeForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!startTime) return;
        const start = new Date(startTime).getTime();
        const interval = setInterval(() => {
            setSecondsClean(Math.floor((Date.now() - start) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const handleLogUrge = async () => {
        if (!trigger.trim()) return;
        setIsSaving(true);
        await supabase.from("urges").insert({ trigger, intensity: 5 });
        setTrigger("");
        setShowUrgeForm(false);
        setIsSaving(false);
    };

    const handleReset = async () => {
        const confirmed = window.confirm("Reset your streak?");
        if (!confirmed) return;
        const now = new Date().toISOString();
        await supabase.from("relapses").insert({ relapsed_at: now });
        await supabase
            .from("recovery_profiles")
            .update({ start_time: now })
            .eq("id", tracker.id);
        onReset(tracker.id, now);
        setSecondsClean(0);
    };

    if (!startTime) return (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 transition-colors">
            <p className="text-xs text-gray-400 dark:text-zinc-500">No streak started. Visit the recovery page to begin.</p>
            <Link href="/recovery" className="block text-center text-xs text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors pt-1">
                    View full page →
            </Link>
        </div>
    );

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 space-y-3 transition-colors">
            {/* Header */}
            <div className="flex justify-between items-center">
                <p className="text-xs font-mono text-gray-400 dark:text-zinc-500">SOBER TIME</p>
                {addiction && (
                    <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold px-2 py-0.5 rounded-full">
                        {addiction}
                    </span>
                )}
            </div>

            {/* Timer */}
            <p className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
                {formatTime(secondsClean)}
            </p>

            {/* Urge form */}
            {showUrgeForm ? (
                <div className="space-y-2">
                    <textarea
                        placeholder="What triggered it?"
                        value={trigger}
                        onChange={(e) => setTrigger(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 text-gray-900 dark:text-zinc-100 resize-none h-16"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleLogUrge}
                            disabled={isSaving || !trigger.trim()}
                            className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 transition-colors"
                        >
                            {isSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                            onClick={() => { setShowUrgeForm(false); setTrigger(""); }}
                            className="flex-1 py-2 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowUrgeForm(true)}
                            className="flex-1 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                        >
                            Log urge
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        >
                            Reset Streak
                        </button>
                    </div>
                    <Link href="/recovery" className="block text-center text-xs text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors pt-1">
                        View full page →
                    </Link>
                </div>
            )}
        </div>
    );
}