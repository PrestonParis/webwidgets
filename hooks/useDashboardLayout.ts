import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { WidgetConfig } from "@/types/dashboard";
import { Tracker } from "@/types/recovery";

const STORAGE_KEY = "dashboard_layout";
const DEBOUNCE_MS = 1200;

function buildDefaultLayout(trackers: Tracker[]): WidgetConfig[] {
    const base: WidgetConfig[] = [
        { id: "widget-journal",   type: "journal",   visible: true, columnSpan: 1, containerId: "main", order: 0 },
        { id: "widget-email",     type: "email",     visible: true, columnSpan: 1, containerId: "main", order: 1 },
        { id: "widget-converter", type: "converter", visible: true, columnSpan: 1, containerId: "main", order: 2 },
    ];
    const recoveryWidgets: WidgetConfig[] = trackers.map((t, i) => ({
        id: `widget-recovery-${t.id}`,
        type: "recovery",
        visible: true,
        columnSpan: 1,
        containerId: "main",
        order: base.length + i,
        props: { tracker: t },
    }));
    return [...base, ...recoveryWidgets];
}

export function useDashboardLayout(trackers: Tracker[]) {
    const [userId, setUserId] = useState<string | undefined>();
    const [layout, setLayout] = useState<WidgetConfig[]>([]);
    const [ready, setReady] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


    useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
        setUserId(data.session?.user.id);
        });
    }, []);

    // Load layout on userId or trackers change (trackers needed to build default layout if no saved one)
    useEffect(() => {
        if (!userId || trackers === undefined) return;

        async function load() {
        // 1. Load cached layout immediately for snappy UI while we fetch remote
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
            try {
            setLayout(JSON.parse(cached));
            setReady(true);
            } catch {}
        }

    // 2. Fetch remote and reconcile (adds any new trackers not in saved layout)
    const { data } = await supabase
        .from("dashboard_layouts")
        .select("layout")
        .eq("user_id", userId)
        .maybeSingle();

    if (data?.layout) {
    const remote: WidgetConfig[] = data.layout;
    // Merge remote with defaults to ensure any new trackers are included, but keep remote visibility/order
    const remoteIds = new Set(remote.map((w) => w.id));
    const defaults = buildDefaultLayout(trackers);
    const merged = [
        ...remote,
        ...defaults.filter((w) => !remoteIds.has(w.id)),
    ];
    setLayout(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } else if (!cached) {
        // No remote, no cache — use defaults
        const defaults = buildDefaultLayout(trackers);
        setLayout(defaults);
    }
    setReady(true);
    }

    load();
    }, [userId, trackers]);

    const persistLayout = useCallback(
        (next: WidgetConfig[]) => {
        // Always update localStorage immediately for snappy reloads, but debounce the Supabase write
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

        // Debounce the Supabase write
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
            if (!userId) return;
            const { error } = await supabase.from("dashboard_layouts").upsert(
                { user_id: userId, layout: next, updated_at: new Date().toISOString() },
                { onConflict: "user_id" }
            );
            if (error) console.error("Error persisting layout:", error);
        }, DEBOUNCE_MS);
        },
        [userId]
    );

    const updateLayout = useCallback(
        (next: WidgetConfig[]) => {
            setLayout(next);
            persistLayout(next);
        },
        [persistLayout]
    );

    const toggleVisibility = useCallback(
        (id: string) => {
        setLayout((prev) => {
            const next = prev.map((w) =>
            w.id === id ? { ...w, visible: !w.visible } : w
            );
            persistLayout(next);
            return next;
        });
        },
        [persistLayout]
    );

    return { layout, updateLayout, toggleVisibility, ready };
}