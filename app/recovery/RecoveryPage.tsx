"use client";

import { supabase } from "@/app/lib/supabase";
import DatePicker from "@/components/DatePicker";
import Header from "@/components/Global/Header";
import { useEffect, useState } from "react";

const ADDICTION_CATEGORIES: Record<string, string[]> = {
    "Substances": [
        "Alcohol",
        "Nicotine",
        "Cannabis",
        "Cocaine",
        "Crack cocaine",
        "Heroin",
        "Opioids (prescription)",
        "Opioids (illicit)",
        "Fentanyl",
        "Methamphetamine",
        "Amphetamines (Adderall misuse)",
        "Benzodiazepines",
        "Barbiturates",
        "MDMA (Ecstasy)",
        "LSD",
        "Psilocybin mushrooms",
        "DMT",
        "Ketamine",
        "Inhalants",
        "Steroids",
        "Synthetic cannabinoids",
        "Synthetic cathinones (bath salts)"
    ],

    "Digital & Media": [
        "Social media",
        "Short-form video (TikTok, Reels)",
        "Streaming (YouTube, Twitch, Netflix bingeing)",
        "Online browsing",
        "Doomscrolling",
        "Gaming",
        "Mobile phone use",
        "Pornography",
        "Online forums (Reddit, etc.)",
        "News consumption",
        "Messaging apps",
        "AI/chat dependency"
    ],

    "Behavioral": [
        "Gambling",
        "Shopping",
        "Impulse buying",
        "Video games (competitive addiction)",
        "Sex",
        "Masturbation",
        "Workaholism",
        "Exercise addiction",
        "Skin picking (dermatillomania)",
        "Hair pulling (trichotillomania)",
        "Nail biting",
        "Compulsive checking (locks, stove, etc.)",
        "Risk-taking behaviors",
        "Thrill seeking"
    ],

    "Food & Eating": [
        "Binge eating",
        "Emotional eating",
        "Sugar",
        "Ultra-processed food",
        "Fast food",
        "Caffeine",
        "Energy drinks",
        "Restrictive eating",
        "Purging (vomiting/laxatives)",
        "Orthorexia",
        "Night eating syndrome",
        "Food restriction cycles"
    ],

    "Relationship & Social": [
        "Codependency",
        "Love addiction",
        "Toxic relationships",
        "People pleasing",
        "Approval seeking",
        "Fear of abandonment",
        "Obsessive attachment",
        "Jealousy dependency",
        "Rebound dependency",
        "Social validation seeking"
    ],

    "Mental & Emotional Patterns": [
        "Rage",
        "Anger cycles",
        "Anxiety loops",
        "Overthinking",
        "Rumination",
        "Avoidance",
        "Procrastination",
        "Self-harm",
        "Suicidal ideation patterns",
        "Intrusive thoughts",
        "Catastrophizing",
        "Control obsession",
        "Perfectionism",
        "Guilt cycles",
        "Shame spirals"
    ],

    "Compulsive Habits": [
        "Lying",
        "Stealing",
        "Hoarding",
        "Clutter accumulation",
        "Constant multitasking",
        "Overplanning",
        "Reassurance seeking",
        "Apology compulsion",
        "Rechecking messages/emails",
        "Tab switching / digital hopping"
    ],

    "Other": [
        "Unclassified behavioral addiction"
    ]
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; activeBg: string; activeText: string }> = {
    "Substances":       { bg: "bg-red-50",    text: "text-red-600",    activeBg: "bg-red-500",    activeText: "text-white" },
    "Digital & Media":  { bg: "bg-indigo-50", text: "text-indigo-600", activeBg: "bg-indigo-500", activeText: "text-white" },
    "Behavioral":       { bg: "bg-purple-50", text: "text-purple-600", activeBg: "bg-purple-500", activeText: "text-white" },
    "Food & Eating":    { bg: "bg-amber-50",  text: "text-amber-600",  activeBg: "bg-amber-500",  activeText: "text-white" },
    "Relationship & Social": { bg: "bg-pink-50", text: "text-pink-600", activeBg: "bg-pink-500", activeText: "text-white" },
    "Mental & Emotional Patterns": { bg: "bg-blue-50", text: "text-blue-600", activeBg: "bg-blue-500", activeText: "text-white" },
    "Compulsive Habits": { bg: "bg-emerald-50", text: "text-emerald-600", activeBg: "bg-emerald-500", activeText: "text-white" },
    "Other":            { bg: "bg-gray-50",   text: "text-gray-600",   activeBg: "bg-gray-500",   activeText: "text-white" }
};

function formatTime(seconds: number) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
}

function CalendarView({ startTime, relapses }: { startTime: string | null, relapses: string[] }) {
    const [viewDate, setViewDate] = useState(new Date());
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date()

    type DayStatus = "clean" | "relapse" | "future" | "before";

    const getDayStatus = (day: number): DayStatus => {
        const date = new Date(year, month, day);
        if (date > today) return "future";
        if (!startTime || date < new Date(startTime)) return "before";
        const dateStr = date.toISOString().split("T")[0];
        if (relapses.includes(dateStr)) return "relapse";
        return "clean";
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold">
                    {viewDate.toLocaleString("default", { month: "long", year: "numeric" })}
                </span>
                <div className="flex gap-2">
                    <button onClick={() => setViewDate(new Date(year, month - 1))} className="text-xs px-3 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">‹</button>
                    <button onClick={() => setViewDate(new Date(year, month + 1))} className="text-xs px-3 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">›</button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {["S","M","T","W","T","F","S"].map((d, i) => (
                    <div key={i} className="text-xs text-gray-400 py-1">{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const status = getDayStatus(day);
                    const statusClasses = {
                        clean: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
                        relapse: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
                        future: "text-gray-300 dark:text-zinc-700",
                        before: "text-gray-200 dark:text-zinc-800 opacity-40",
                    };
                    return (
                        <div key={day} className={`w-8 h-8 flex items-center justify-center rounded-full text-[10px] ${statusClasses[status]}`}>
                            {day}
                        </div>
                    );
                })}
            </div>
            <div className="flex gap-4 mt-3">
                {[["#C0DD97","#3B6D11","Clean"],["#F7C1C1","#A32D2D","Relapse"]].map(([bg, color, label]) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span style={{ background: bg, color: color, width: 10, height: 10, borderRadius: "50%", display: "inline-block" }} />
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );
}

interface Tracker {
    id: string;
    addiction: string;
    start_time: string;
    created_at: string;
}

function TrackerCard({ tracker, onReset, onUpdateStart }: {
    tracker: Tracker;
    onReset: (id: string) => void;
    onUpdateStart: (id: string, newStart: string) => void;
}) {
    const [secondsClean, setSecondsClean] = useState(0);
    const [editingStart, setEditingStart] = useState(false);
    const [showUrgeForm, setShowUrgeForm] = useState(false);
    const [trigger, setTrigger] = useState("");
    const [intensity, setIntensity] = useState(5);
    const [isSaving, setIsSaving] = useState(false);
    const [relapses, setRelapses] = useState<string[]>([]);
    const [expanded, setExpanded] = useState(false);

    
    type RelapseRow = {
        relapsed_at: string;
    };
    useEffect(() => {
        supabase.from("relapses").select("relapsed_at").eq("tracker_id", tracker.id)
            .then(({ data }) =>
            setRelapses((data as RelapseRow[] || []).map(r => r.relapsed_at.split("T")[0]))
        );
    }, [tracker.id]);

    useEffect(() => {
        const start = new Date(tracker.start_time).getTime();
        const interval = setInterval(() => {
            setSecondsClean(Math.floor((Date.now() - start) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [tracker.start_time]);

    const handleLogUrge = async () => {
        if (!trigger.trim()) return;
        setIsSaving(true);
        await supabase.from("urges").insert({ trigger, intensity, tracker_id: tracker.id });
        setTrigger("");
        setShowUrgeForm(false);
        setIsSaving(false);
    };

    const milestones = [
        { label: "1 Day", s: 86400 },
        { label: "7 Days", s: 604800 },
        { label: "30 Days", s: 2592000 },
        { label: "90 Days", s: 7776000 },
    ];

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
    {/* Header */}
    <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
            <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold px-3 py-1 rounded-full">
                {tracker.addiction}
            </span>
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                {expanded ? "collapse ↑" : "expand ↓"}
            </button>
        </div>

        <div className="text-center space-y-2">
            <p className="text-xs font-mono text-gray-400 dark:text-zinc-500">CURRENT STREAK</p>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
                {formatTime(secondsClean)}
            </h2>

            {editingStart ? (
                <div className="flex justify-center">
                    <DatePicker
                        value={tracker.start_time ?? ""}
                        onChange={async (iso) => {
                            await supabase.from("recovery_profiles").update({ start_time: iso }).eq("id", tracker.id);
                            onUpdateStart(tracker.id, iso);
                            setEditingStart(false);
                        }}
                        onCancel={() => setEditingStart(false)}
                    />
                </div>
            ) : (
                <p onClick={() => setEditingStart(true)}
                    className="text-sm text-gray-500 dark:text-zinc-400 italic cursor-pointer hover:text-purple-500 transition-colors">
                    Since {new Date(tracker.start_time).toLocaleDateString()} · {new Date(tracker.start_time).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})} · edit
                </p>
            )}

            <div className="flex justify-center gap-2 flex-wrap">
                {milestones.map((m) => (
                    <span key={m.label} 
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                            secondsClean >= m.s 
                            ? "bg-purple-600 text-white" 
                            : "bg-purple-50 dark:bg-zinc-900 text-purple-600 dark:text-purple-400"
                        }`}>
                        {m.label}
                    </span>
                ))}
            </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowUrgeForm(!showUrgeForm)}
                className="py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl text-sm font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                Log urge
            </button>
            <button onClick={() => onReset(tracker.id)}
                className="py-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-2xl text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                Reset
            </button>
        </div>

        {showUrgeForm && (
            <div className="space-y-3">
                <textarea placeholder="What triggered it?" value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 text-gray-900 dark:text-zinc-100 resize-none h-20"
                />
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 dark:text-zinc-400">Intensity: {intensity}/10</label>
                    <input type="range" min={1} max={10} value={intensity}
                        onChange={(e) => setIntensity(Number(e.target.value))}
                        className="w-full accent-purple-600"
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={handleLogUrge} disabled={isSaving || !trigger.trim()}
                        className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold disabled:bg-gray-300 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600">
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => { setShowUrgeForm(false); setTrigger(""); }}
                        className="flex-1 py-2 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900">
                        Cancel
                    </button>
                </div>
            </div>
        )}
    </div>

    {/* Expanded calendar */}
    {expanded && (
        <div className="border-t border-gray-100 dark:border-zinc-800 p-6">
            <CalendarView startTime={tracker.start_time} relapses={relapses} />
        </div>
    )}
</div>
    );
}

export default function RecoveryPage() {
    const [trackers, setTrackers] = useState<Tracker[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedAddiction, setSelectedAddiction] = useState("");
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    


    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            const { data } = await supabase
                .from("recovery_profiles")
                .select("*")
                .order("created_at", { ascending: true });

            if (!cancelled) {
                setTrackers(data || []);
                setLoading(false);
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleAddTracker = async () => {
        if (!selectedAddiction) return;
        const now = new Date().toISOString();
        const { error } = await supabase.from("recovery_profiles").insert({
            start_time: now,
            addiction: selectedAddiction,
        });
        if (!error) {
            setSelectedAddiction("");
            setShowAddForm(false);
            const { data } = await supabase
                .from("recovery_profiles")
                .select("*")
                .order("created_at", { ascending: true });

            setTrackers(data || []);
                    }
    };

    const handleReset = async (id: string) => {
        const confirmed = window.confirm("Reset this streak?");
        if (!confirmed) return;
        const now = new Date().toISOString();
        await supabase.from("relapses").insert({ relapsed_at: now, tracker_id: id });
        await supabase.from("recovery_profiles").update({ start_time: now }).eq("id", id);
        const { data } = await supabase
            .from("recovery_profiles")
            .select("*")
            .order("created_at", { ascending: true });

        setTrackers(data || []);
    };

    const handleUpdateStart = (id: string, newStart: string) => {
        setTrackers((prev) => prev.map((t) => t.id === id ? { ...t, start_time: newStart } : t));
    };

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm("Delete this tracker permanently?");
        if (!confirmed) return;
        await supabase.from("recovery_profiles").delete().eq("id", id);
        setTrackers((prev) => prev.filter((t) => t.id !== id));
    };

    if (loading) return (
        <>
        <Header />
        <div className="p-6"><p className="text-sm text-gray-400">Loading...</p></div>
        </>
    );

    return (
        <>
        <Header />
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">Recovery</h1>
                <button onClick={() => setShowAddForm(!showAddForm)}
                    className="text-sm bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700">
                    + Add tracker
                </button>
            </div>

            {/* Add tracker form */}
            {/* Drawer overlay */}
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
                                .filter(a => !trackers.find(t => t.addiction === a))
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
                                ))
                            }
                        </div>
                        {ADDICTION_CATEGORIES[activeCategory].filter(a => !trackers.find(t => t.addiction === a)).length === 0 && (
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
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                    <p className="text-gray-400 mb-4">No trackers yet.</p>
                    <button onClick={() => setShowAddForm(true)}
                        className="text-sm bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700">
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
                            <button onClick={() => handleDelete(tracker.id)}
                                className="absolute top-4 right-14 text-xs text-gray-300 hover:text-red-400 transition-colors">
                                delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
        </>
    );
}