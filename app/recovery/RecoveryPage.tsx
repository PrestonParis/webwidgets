"use client";

import { supabase } from "@/app/lib/supabase";
import { useEffect, useState } from "react";
import { ADDICTION_CATEGORIES, CATEGORY_COLORS } from "./constants";
import { Tracker } from "@/types/recovery";
import TrackerCard from "@/components/Recovery/TrackerCard";

export default function RecoveryPage() {
    // State variables for trackers, loading state, add form visibility, selected addiction, and active category
    const [trackers, setTrackers] = useState<Tracker[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedAddiction, setSelectedAddiction] = useState("");
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    // Function to fetch trackers for the current user from the database
    const fetchTrackers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch trackers for the current user with an explicit filter on user_id
    const { data, error } = await supabase
        .from("recovery_profiles")
        .select("*")
        .eq("user_id", user.id) // Explicit filter
        .order("created_at", { ascending: true });
            if (!error) {
                setTrackers(data || []);
            }
            setLoading(false);
        };
    
    // Initial fetch of trackers on component mount
    useEffect(() => {
        let cancelled = false;

        const fetchTrackers = async () => {
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setTrackers([]);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("recovery_profiles")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: true });

            if (!cancelled) {
                if (!error) {
                    setTrackers(data || []);
                } else {
                    setTrackers([]);
                }
                setLoading(false);
            }
        };

        fetchTrackers();

        return () => {
            cancelled = true;
        };
    }, []);

    // Handler for adding a new tracker
    const handleAddTracker = async () => {
        if (!selectedAddiction) return;
        const now = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase.from("recovery_profiles").insert({
            start_time: now,
            addiction: selectedAddiction,
            user_id: user.id,
        });
        if (!error) {
            setSelectedAddiction("");
            setShowAddForm(false);
            setActiveCategory(null);
            await fetchTrackers();
        }
    };
    
    // Handler for resetting a tracker (logging a relapse)
    const handleReset = async (id: string) => {
        const confirmed = window.confirm("Reset this streak?");
        if (!confirmed) return;
        const now = new Date().toISOString();
        await supabase.from("relapses").insert({ relapsed_at: now, tracker_id: id });
        await supabase.from("recovery_profiles").update({ start_time: now }).eq("id", id);
        await fetchTrackers();
    };

    // Handler for updating the start time of a tracker (for editing purposes)
    const handleUpdateStart = (id: string, newStart: string) => {
        setTrackers((prev) => prev.map((t) => t.id === id ? { ...t, start_time: newStart } : t));
    };

    // Handler for deleting a tracker permanently
    const handleDelete = async (id: string) => {
        const confirmed = window.confirm("Delete this tracker permanently?");
        if (!confirmed) return;
        await supabase.from("recovery_profiles").delete().eq("id", id);
        setTrackers((prev) => prev.filter((t) => t.id !== id));
    };

    // Show loading state while fetching trackers
    if (loading) return (
        <div className="p-6">
            <p className="text-sm text-gray-400">Loading...</p>
        </div>
    );

    // Main content of the recovery page
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">Recovery</h1>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="text-sm bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700"
                >
                    + Add tracker
                </button>
            </div>

            {/* Add tracker drawer */}
            {showAddForm && (
                <div className="fixed inset-0 z-40 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/20"
                        onClick={() => { setShowAddForm(false); setSelectedAddiction(""); setActiveCategory(null); }}
                    />

                    {/* Drawer */}
                    <div className="relative z-50 w-full max-w-md bg-white h-full shadow-xl flex flex-col">
                        {/* Drawer header */}
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                            <div>
                                <h2 className="font-bold text-gray-900">Add a tracker</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Pick a category then choose what to track</p>
                            </div>
                            <button
                                onClick={() => { setShowAddForm(false); setSelectedAddiction(""); setActiveCategory(null); }}
                                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                            {/* Categories */}
                            <div>
                                <p className="text-xs font-mono text-gray-400 mb-3">CATEGORIES</p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(ADDICTION_CATEGORIES).map((cat) => {
                                        const c = CATEGORY_COLORS[cat];
                                        const isActive = activeCategory === cat;
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => { setActiveCategory(isActive ? null : cat); setSelectedAddiction(""); }}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                                    isActive ? `${c.activeBg} ${c.activeText}` : `${c.bg} ${c.text}`
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Addiction list for active category */}
                            {activeCategory && (
                                <div>
                                    <p className="text-xs font-mono text-gray-400 mb-3">{activeCategory.toUpperCase()}</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {ADDICTION_CATEGORIES[activeCategory]
                                            .filter((a) => !trackers.find((t) => t.addiction === a))
                                            .map((a) => (
                                                <button
                                                    key={a}
                                                    onClick={() => setSelectedAddiction(a)}
                                                    className={`p-3 rounded-xl border text-sm font-semibold text-left transition-all ${
                                                        selectedAddiction === a
                                                            ? "border-purple-500 bg-purple-50 text-purple-700"
                                                            : "border-gray-100 text-gray-600 hover:border-purple-200 bg-gray-50"
                                                    }`}
                                                >
                                                    {a}
                                                </button>
                                            ))}
                                    </div>
                                    {ADDICTION_CATEGORIES[activeCategory].filter((a) => !trackers.find((t) => t.addiction === a)).length === 0 && (
                                        <p className="text-xs text-gray-400 text-center py-4">All items in this category are already tracked.</p>
                                    )}
                                </div>
                            )}

                            {!activeCategory && (
                                <div className="text-center py-8 text-gray-300 text-sm">
                                    Select a category above to see options
                                </div>
                            )}
                        </div>

                        {/* Drawer footer */}
                        <div className="px-6 py-5 border-t border-gray-100">
                            {selectedAddiction && (
                                <p className="text-xs text-gray-500 mb-3 text-center">
                                    Selected: <span className="font-bold text-purple-600">{selectedAddiction}</span>
                                </p>
                            )}
                            <button
                                onClick={handleAddTracker}
                                disabled={!selectedAddiction}
                                className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all"
                            >
                                {selectedAddiction ? `Start tracking ${selectedAddiction}` : "Choose something to track"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tracker grid */}
            {trackers.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                    <p className="text-gray-400 dark:text-gray-500 mb-4">No trackers yet.</p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="text-sm bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700"
                    >
                        Add your first tracker
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {trackers.map((tracker) => (
                        <div key={tracker.id} className="relative">
                            <TrackerCard
                                tracker={tracker}
                                onReset={handleReset}
                                onUpdateStart={handleUpdateStart}
                            />
                            <button
                                onClick={() => handleDelete(tracker.id)}
                                className="absolute top-4 right-14 text-xs text-gray-300 hover:text-red-400 transition-colors"
                            >
                                delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}