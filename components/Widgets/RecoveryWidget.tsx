"use client";

import { supabase } from "@/app/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";

function formatTime(seconds: number) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
}

export default function SoberWidget() {
    const [secondsClean, setSecondsClean] = useState(0);
    const [startTime, setStartTime] = useState<string | null>(null);
    const [addiction, setAddiction] = useState<string | null>(null);
    const [trigger, setTrigger] = useState("");
    const [showUrgeForm, setShowUrgeForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            const { data } = await supabase
                .from("recovery_profiles")
                .select("start_time, addiction")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            setStartTime(data?.start_time ?? null);
            setAddiction(data?.addiction ?? null);
            setLoading(false);
        }
        loadProfile();
    }, []);

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
            .order("created_at", { ascending: false })
            .limit(1);
        setStartTime(now);
        setSecondsClean(0);
    };

    if (loading) return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400">Loading...</p>
        </div>
    );

    if (!startTime) return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400">No streak started. Visit the recovery page to begin.</p>
            <Link href="/recovery" className="block text-center text-xs text-gray-400 hover:text-purple-600 transition-colors pt-1">
                    View full page →
            </Link>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            {/* Header */}
            <div className="flex justify-between items-center">
                <p className="text-xs font-mono text-gray-400">SOBER TIME</p>
                {addiction && (
                    <span className="text-xs bg-purple-50 text-purple-600 font-bold px-2 py-0.5 rounded-full">
                        {addiction}
                    </span>
                )}
            </div>

            {/* Timer */}
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {formatTime(secondsClean)}
            </p>

            {/* Urge form */}
            {showUrgeForm ? (
                <div className="space-y-2">
                    <textarea
                        placeholder="What triggered it?"
                        value={trigger}
                        onChange={(e) => setTrigger(e.target.value)}
                        className="w-full border rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-purple-200 resize-none h-16"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleLogUrge}
                            disabled={isSaving || !trigger.trim()}
                            className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:bg-gray-300"
                        >
                            {isSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                            onClick={() => { setShowUrgeForm(false); setTrigger(""); }}
                            className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowUrgeForm(true)}
                        className="flex-1 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold hover:bg-purple-100"
                    >
                        Log urge
                    </button>
                    <Link href="/recovery" className="block text-center text-xs text-gray-400 hover:text-purple-600 transition-colors pt-1">
                        View full page →
                    </Link>
                </div>
            )}
        </div>
    );
}