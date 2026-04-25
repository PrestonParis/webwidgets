import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "@/app/lib/supabase";
import { WidgetConfig } from "@/types/dashboard";
import { Tracker } from "@/types/recovery";

const DEBOUNCE_MS = 1200;

function hydrateTrackers(layout: WidgetConfig[], trackers: Tracker[]): WidgetConfig[] {
    return layout.map((w) => {
        if (w.type !== "recovery") return w;
        
        // Extract tracker ID from the widget ID (format: "widget-recovery-{trackerId}")
        const trackerId = w.id.replace("widget-recovery-", "");
        const fresh = trackers.find((t) => t.id === trackerId);
        
        if (fresh) {
            return { 
                ...w, 
                props: { ...w.props, tracker: fresh } 
            };
        }
        
        // If tracker no longer exists, mark as recovery-empty or filter out
        return { 
            ...w, 
            type: "recovery-empty", 
            props: {} 
        };
    });
}

function buildDefaultLayout(trackers: Tracker[]): WidgetConfig[] {
    const base: WidgetConfig[] = [
        { id: "widget-journal",   type: "journal",   visible: true, columnSpan: 1, containerId: "main", order: 0 },
        { id: "widget-email",     type: "email",     visible: true, columnSpan: 1, containerId: "main", order: 1 },
        { id: "widget-converter", type: "converter", visible: true, columnSpan: 1, containerId: "main", order: 2 },
    ];

    if (trackers.length === 0) {
        base.push({ 
            id: "widget-recovery-none", 
            type: "recovery-empty", 
            visible: true, 
            columnSpan: 1, 
            containerId: "main", 
            order: 3 
        });
        return base;
    }

    const recoveryWidgets: WidgetConfig[] = trackers.map((t, i) => ({
        id: `widget-recovery-${t.id}`,
        type: "recovery",
        visible: true,
        columnSpan: 1,
        containerId: "main",
        order: base.length + i,
        props: { tracker: t }, // Store the full tracker object in props
    }));

    return [...base, ...recoveryWidgets];
}

export function useDashboardLayout(trackers: Tracker[] | null) {
    const safeTrackers = useMemo(() => trackers ?? [], [trackers]);
    const [userId, setUserId] = useState<string | undefined>();
    const [layout, setLayout] = useState<WidgetConfig[]>([]);
    const [ready, setReady] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasLoadedInitial = useRef(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setUserId(data.session?.user.id);
        });
    }, []);

    useEffect(() => {
        // Don't proceed until we have userId and trackers is not null
        if (!userId || trackers === null || hasLoadedInitial.current) return;

        async function load() {
            try {
                const storageKey = `dashboard_layout_${userId}`;
                let finalLayout: WidgetConfig[];

                // Try to load from localStorage first
                const cached = localStorage.getItem(storageKey);
                let savedLayout: WidgetConfig[] | null = null;
                
                if (cached) {
                    try {
                        savedLayout = JSON.parse(cached);
                    } catch (e) {
                        console.error("Cache parse error", e);
                    }
                }

                // Try to load from Supabase
                const { data } = await supabase
                    .from("dashboard_layouts")
                    .select("layout")
                    .eq("user_id", userId)
                    .maybeSingle();

                const remoteLayout = data?.layout as WidgetConfig[] | null;
                
                // Use remote if available, otherwise cached, otherwise defaults
                const layoutSource = remoteLayout || savedLayout;
                
                if (layoutSource) {
                    // Hydrate the saved layout with fresh tracker data
                    const hydrated = hydrateTrackers(layoutSource, safeTrackers);
                    
                    // Remove recovery-empty if we have trackers
                    if (safeTrackers.length > 0) {
                        finalLayout = hydrated.filter(w => w.type !== "recovery-empty");
                    } else {
                        finalLayout = hydrated;
                    }
                    
                    // Add any missing trackers that aren't in the layout
                    const existingTrackerIds = new Set(
                        finalLayout
                            .filter(w => w.type === "recovery")
                            .map(w => w.id.replace("widget-recovery-", ""))
                    );
                    
                    const missingTrackers = safeTrackers.filter(
                        t => !existingTrackerIds.has(t.id)
                    );
                    
                    if (missingTrackers.length > 0) {
                        const newWidgets = missingTrackers.map((t, i) => ({
                            id: `widget-recovery-${t.id}`,
                            type: "recovery" as const,
                            visible: true,
                            columnSpan: 1,
                            containerId: "main" as const,
                            order: finalLayout.length + i,
                            props: { tracker: t },
                        }));
                        finalLayout = [...finalLayout, ...newWidgets];
                    }
                } else {
                    // No saved layout, build from defaults
                    finalLayout = buildDefaultLayout(safeTrackers);
                }

                setLayout(finalLayout);
                localStorage.setItem(storageKey, JSON.stringify(finalLayout));
                hasLoadedInitial.current = true;
            } catch (err) {
                console.error("Critical layout load error:", err);
                // Fallback to default layout
                const defaults = buildDefaultLayout(safeTrackers);
                setLayout(defaults);
            } finally {
                setReady(true);
            }
        }

        load();
    }, [userId, trackers, safeTrackers]);

    const persistLayout = useCallback((next: WidgetConfig[]) => {
        if (!userId) return;
        const storageKey = `dashboard_layout_${userId}`;
        localStorage.setItem(storageKey, JSON.stringify(next));

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
            await supabase.from("dashboard_layouts").upsert(
                { user_id: userId, layout: next, updated_at: new Date().toISOString() },
                { onConflict: "user_id" }
            );
        }, DEBOUNCE_MS);
    }, [userId]);

    const updateLayout = useCallback((next: WidgetConfig[]) => {
        setLayout(next);
        persistLayout(next);
    }, [persistLayout]);

    const toggleVisibility = useCallback((id: string) => {
        setLayout((prev) => {
            const next = prev.map((w) => w.id === id ? { ...w, visible: !w.visible } : w);
            persistLayout(next);
            return next;
        });
    }, [persistLayout]);

    return { layout, updateLayout, toggleVisibility, ready };
}