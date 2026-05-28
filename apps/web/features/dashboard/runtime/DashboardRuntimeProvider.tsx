'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
    type RefObject,
} from 'react';
import {
    installDashboardFetchGuard,
    subscribeWidgetFetchCount,
} from './widgetFetchRegistry';
import {
    clearResourceFailure,
    getFailureRecord,
    isInCooldown,
} from './widgetFailureRegistry';
import type {
    RuntimeWidgetRecord,
    WidgetFailureReason,
    WidgetRuntimeMetadata,
    WidgetRuntimeSnapshot,
    WidgetRuntimeStatus,
    WidgetVisibilityLevel,
} from './widgetRuntimeTypes';
import {
    INITIAL_HYDRATION_BURST_COUNT,
    STAGGERED_HYDRATION_BATCH_SIZE,
    STAGGERED_HYDRATION_INTERVAL_MS,
    MAX_CONCURRENT_HYDRATIONS,
    MAX_CONCURRENT_FETCHES,
    PRESSURE_THRESHOLDS,
    PRESSURE_THROTTLE_MULTIPLIERS,
    HEAVY_WIDGET_DELAY_MS,
    NEAR_VIEWPORT_MARGIN_PX,
    BACKGROUND_MARGIN_PX,
    MAX_QUEUE_WAIT_MS,
    STARVATION_CHECK_INTERVAL_MS,
    DEV_RUNTIME_DEBUG_PANEL,
    DEV_RUNTIME_TOASTS,
    ENABLE_ADAPTIVE_PRESSURE_CONTROL,
    ENABLE_PROGRESSIVE_BATCH_SCHEDULING,
    ENABLE_STARVATION_PREVENTION,
} from './dashboardRuntimeConfig';

type RuntimeState = {
    records: Map<string, RuntimeWidgetRecord>;
    loadedIds: Set<string>;
    visibleIds: Set<string>;
    nearVisibleIds: Set<string>;
    offscreenIds: Set<string>;
    backgroundIds: Set<string>;
    hydratedIds: Set<string>;
    activeHydrationIds: Set<string>;
    failedIds: Set<string>;
    cooldownIds: Set<string>;
    activeFetchCount: number;
    requestDurations: number[];
    batchLoading: boolean;
    paused: boolean;
    pressureLevel: 'normal' | 'moderate' | 'high';
    version: number;
    burstPhase: boolean;
};

type DashboardRuntimeContextValue = {
    state: RuntimeState;
    snapshot: WidgetRuntimeSnapshot;
    registerWidget: (metadata: WidgetRuntimeMetadata) => void;
    unregisterWidget: (id: string) => void;
    setWidgetVisible: (id: string, visible: boolean) => void;
    setWidgetVisibilityLevel: (
        id: string,
        level: 'visible' | 'near-visible' | 'offscreen' | 'background',
    ) => void;
    requestHydration: (id: string) => boolean;
    releaseHydration: (id: string) => void;
    markWidgetFailed: (id: string, reason: WidgetFailureReason) => void;
    retryWidget: (id: string) => void;
    loadMore: () => void;
    isWidgetLoaded: (id: string) => boolean;
    getWidgetStatus: (id: string) => WidgetRuntimeStatus;
};

const DashboardRuntimeContext =
    createContext<DashboardRuntimeContextValue | null>(null);

function createInitialState(): RuntimeState {
    return {
        records: new Map(),
        loadedIds: new Set(),
        visibleIds: new Set(),
        nearVisibleIds: new Set(),
        offscreenIds: new Set(),
        backgroundIds: new Set(),
        hydratedIds: new Set(),
        activeHydrationIds: new Set(),
        failedIds: new Set(),
        cooldownIds: new Set(),
        activeFetchCount: 0,
        requestDurations: [],
        batchLoading: false,
        paused: false,
        pressureLevel: 'normal',
        version: 0,
        burstPhase: true,
    };
}

function getPressureLevel(state: RuntimeState): 'normal' | 'moderate' | 'high' {
    const average =
        state.requestDurations.length === 0
            ? 0
            : state.requestDurations.reduce((sum, value) => sum + value, 0) /
              state.requestDurations.length;

    const fetchCount = state.activeFetchCount;
    const hydrationCount = state.activeHydrationIds.size;
    const failureCount = state.failedIds.size + state.cooldownIds.size;

    if (
        fetchCount >= PRESSURE_THRESHOLDS.HIGH_FETCH_COUNT ||
        hydrationCount >= PRESSURE_THRESHOLDS.HIGH_HYDRATION_COUNT ||
        average >= PRESSURE_THRESHOLDS.HIGH_REQUEST_MS ||
        failureCount >= PRESSURE_THRESHOLDS.HIGH_FAILURE_COUNT
    ) {
        return 'high';
    }

    if (
        fetchCount >= PRESSURE_THRESHOLDS.MODERATE_FETCH_COUNT ||
        hydrationCount >= PRESSURE_THRESHOLDS.MODERATE_HYDRATION_COUNT ||
        average >= PRESSURE_THRESHOLDS.MODERATE_REQUEST_MS
    ) {
        return 'moderate';
    }

    return 'normal';
}

function isHighPressure(state: RuntimeState): boolean {
    return getPressureLevel(state) === 'high';
}

function recordStatus(
    state: RuntimeState,
    id: string,
    status: WidgetRuntimeStatus,
) {
    const record = state.records.get(id);
    if (!record) return;
    state.records.set(id, { ...record, status });
}

function cloneState(state: RuntimeState): RuntimeState {
    return {
        ...state,
        records: new Map(state.records),
        loadedIds: new Set(state.loadedIds),
        visibleIds: new Set(state.visibleIds),
        nearVisibleIds: new Set(state.nearVisibleIds),
        offscreenIds: new Set(state.offscreenIds),
        backgroundIds: new Set(state.backgroundIds),
        hydratedIds: new Set(state.hydratedIds),
        activeHydrationIds: new Set(state.activeHydrationIds),
        failedIds: new Set(state.failedIds),
        cooldownIds: new Set(state.cooldownIds),
        requestDurations: [...state.requestDurations],
        version: state.version + 1,
    };
}

function shouldLoadInitially(
    metadata: WidgetRuntimeMetadata,
    index: number,
): boolean {
    if (metadata.defaultLoad === 'manual') return false;
    if (metadata.defaultLoad === 'eager') return true;
    if (metadata.priority === 'critical') return true;
    if (metadata.priority === 'high') return true;
    if (metadata.weight === 'heavy') return false;
    return index < INITIAL_HYDRATION_BURST_COUNT;
}

export function DashboardRuntimeProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [state, setState] = useState(createInitialState);
    const stateRef = useRef(state);
    const batchTimerRef = useRef<number | null>(null);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => installDashboardFetchGuard(), []);

    useEffect(
        () =>
            subscribeWidgetFetchCount((count) => {
                setState((current) => {
                    const next = cloneState(current);
                    next.activeFetchCount = count;
                    next.paused = isHighPressure(next);
                    return next;
                });
            }),
        [],
    );

    const loadBatch = useCallback((preferredId?: string) => {
        setState((current) => {
            const pressureLevel = getPressureLevel(current);
            const batchSize = current.burstPhase
                ? INITIAL_HYDRATION_BURST_COUNT
                : STAGGERED_HYDRATION_BATCH_SIZE;

            if (current.batchLoading) {
                return current;
            }

            const next = cloneState(current);
            next.batchLoading = true;

            // Adaptive throttling: slow down under pressure instead of stopping
            if (
                ENABLE_ADAPTIVE_PRESSURE_CONTROL &&
                pressureLevel !== 'normal'
            ) {
                const throttleMultiplier =
                    pressureLevel === 'high'
                        ? PRESSURE_THROTTLE_MULTIPLIERS.HIGH
                        : pressureLevel === 'moderate'
                          ? PRESSURE_THROTTLE_MULTIPLIERS.MODERATE
                          : PRESSURE_THROTTLE_MULTIPLIERS.NORMAL;
                // We'll handle throttling in the scheduler, not here
                if (
                    process.env.NODE_ENV !== 'production' &&
                    DEV_RUNTIME_TOASTS
                ) {
                    console.info('[dashboard-runtime] adaptive throttling', {
                        pressureLevel,
                        throttleMultiplier,
                        activeFetches: current.activeFetchCount,
                        activeHydrations: current.activeHydrationIds.size,
                    });
                }
            }

            // Priority-based candidate selection
            const ordered = [...next.records.values()].sort((a, b) => {
                // First by visibility (visible first)
                const aVisible = next.visibleIds.has(a.id) ? 0 : 1;
                const bVisible = next.visibleIds.has(b.id) ? 0 : 1;
                if (aVisible !== bVisible) return aVisible - bVisible;

                // Then by priority (critical first)
                const aPriority = a.metadata.priority ?? 'normal';
                const bPriority = b.metadata.priority ?? 'normal';
                const priorityOrder = ['critical', 'high', 'normal', 'low'];
                const aPriorityIdx = priorityOrder.indexOf(aPriority);
                const bPriorityIdx = priorityOrder.indexOf(bPriority);
                if (aPriorityIdx !== bPriorityIdx)
                    return aPriorityIdx - bPriorityIdx;

                // Then by weight (light first)
                const aWeight = a.metadata.weight ?? 'medium';
                const bWeight = b.metadata.weight ?? 'medium';
                const weightOrder = ['light', 'medium', 'heavy'];
                const aWeightIdx = weightOrder.indexOf(aWeight);
                const bWeightIdx = weightOrder.indexOf(bWeight);
                if (aWeightIdx !== bWeightIdx) return aWeightIdx - bWeightIdx;

                // Finally by estimated cost (lower first)
                const aCost = a.metadata.estimatedCost ?? 50;
                const bCost = b.metadata.estimatedCost ?? 50;
                return aCost - bCost;
            });

            const candidates = ordered.filter((record) => {
                if (next.loadedIds.has(record.id)) return false;
                if (record.disabled) return false;
                if (record.metadata.defaultLoad === 'manual') {
                    return record.id === preferredId;
                }
                // Under high pressure, skip heavy widgets
                if (
                    pressureLevel === 'high' &&
                    record.metadata.weight === 'heavy'
                ) {
                    return false;
                }
                return true;
            });

            const promoted = new Set<string>();
            if (preferredId && candidates.some((r) => r.id === preferredId)) {
                promoted.add(preferredId);
            }

            for (const record of candidates) {
                if (promoted.size >= batchSize) break;
                promoted.add(record.id);
            }

            for (const id of promoted) {
                next.loadedIds.add(id);
                const record = next.records.get(id);
                if (record) {
                    next.records.set(id, {
                        ...record,
                        loadedAt: Date.now(),
                        status: 'shell',
                    });
                }
            }

            next.batchLoading = false;

            // End burst phase after first batch
            if (next.burstPhase && next.loadedIds.size > 0) {
                next.burstPhase = false;
            }

            if (process.env.NODE_ENV !== 'production' && DEV_RUNTIME_TOASTS) {
                console.info('[dashboard-runtime] widget batch loaded', {
                    ids: [...promoted],
                    loaded: next.loadedIds.size,
                    registered: next.records.size,
                    burstPhase: next.burstPhase,
                    pressureLevel,
                });
            }
            return next;
        });
    }, []);

    const scheduleBatch = useCallback(
        (preferredId?: string) => {
            if (batchTimerRef.current !== null) return;

            const current = stateRef.current;
            const pressureLevel = getPressureLevel(current);
            const throttleMultiplier = ENABLE_ADAPTIVE_PRESSURE_CONTROL
                ? pressureLevel === 'high'
                    ? PRESSURE_THROTTLE_MULTIPLIERS.HIGH
                    : pressureLevel === 'moderate'
                      ? PRESSURE_THROTTLE_MULTIPLIERS.MODERATE
                      : PRESSURE_THROTTLE_MULTIPLIERS.NORMAL
                : 1;
            const delay = current.burstPhase
                ? 0
                : STAGGERED_HYDRATION_INTERVAL_MS * throttleMultiplier;

            batchTimerRef.current = window.setTimeout(() => {
                batchTimerRef.current = null;
                loadBatch(preferredId);
            }, delay);
        },
        [loadBatch],
    );

    const registerWidget = useCallback((metadata: WidgetRuntimeMetadata) => {
        setState((current) => {
            if (current.records.has(metadata.id)) return current;
            const next = cloneState(current);
            const index = next.records.size;
            const status: WidgetRuntimeStatus = shouldLoadInitially(
                metadata,
                index,
            )
                ? 'shell'
                : 'idle';
            next.records.set(metadata.id, {
                id: metadata.id,
                metadata,
                status,
                registeredAt: Date.now(),
                failureCount: 0,
            });
            if (status === 'shell') next.loadedIds.add(metadata.id);
            return next;
        });
    }, []);

    const unregisterWidget = useCallback((id: string) => {
        setState((current) => {
            const next = cloneState(current);
            next.visibleIds.delete(id);
            next.activeHydrationIds.delete(id);
            return next;
        });
    }, []);

    const setWidgetVisible = useCallback(
        (id: string, visible: boolean) => {
            setState((current) => {
                const next = cloneState(current);
                if (visible) {
                    next.visibleIds.add(id);
                    next.nearVisibleIds.delete(id);
                    next.offscreenIds.delete(id);
                    next.backgroundIds.delete(id);
                    const record = next.records.get(id);
                    if (record) {
                        next.records.set(id, {
                            ...record,
                            lastVisibleAt: Date.now(),
                        });
                    }
                } else {
                    next.visibleIds.delete(id);
                    next.activeHydrationIds.delete(id);
                }
                return next;
            });

            const current = stateRef.current;
            if (visible && !current.loadedIds.has(id)) scheduleBatch(id);
        },
        [scheduleBatch],
    );

    const setWidgetVisibilityLevel = useCallback(
        (
            id: string,
            level: 'visible' | 'near-visible' | 'offscreen' | 'background',
        ) => {
            setState((current) => {
                const next = cloneState(current);
                // Clear all visibility sets first
                next.visibleIds.delete(id);
                next.nearVisibleIds.delete(id);
                next.offscreenIds.delete(id);
                next.backgroundIds.delete(id);

                // Add to the appropriate set
                if (level === 'visible') {
                    next.visibleIds.add(id);
                    const record = next.records.get(id);
                    if (record) {
                        next.records.set(id, {
                            ...record,
                            lastVisibleAt: Date.now(),
                        });
                    }
                } else if (level === 'near-visible') {
                    next.nearVisibleIds.add(id);
                } else if (level === 'offscreen') {
                    next.offscreenIds.add(id);
                } else if (level === 'background') {
                    next.backgroundIds.add(id);
                }

                return next;
            });

            const current = stateRef.current;
            if (level === 'visible' && !current.loadedIds.has(id)) {
                scheduleBatch(id);
            }
        },
        [scheduleBatch],
    );

    const requestHydration = useCallback((id: string): boolean => {
        const current = stateRef.current;
        const record = current.records.get(id);
        if (!record || record.disabled) return false;
        if (!current.loadedIds.has(id) || !current.visibleIds.has(id)) {
            return false;
        }
        if (current.failedIds.has(id) || current.cooldownIds.has(id)) {
            return false;
        }
        const cooldownKey = record.metadata.dataKeys?.[0];
        if (cooldownKey && isInCooldown(cooldownKey)) return false;
        if (
            !current.activeHydrationIds.has(id) &&
            current.activeHydrationIds.size >= MAX_CONCURRENT_HYDRATIONS
        ) {
            if (process.env.NODE_ENV !== 'production' && DEV_RUNTIME_TOASTS) {
                console.info(
                    '[dashboard-runtime] hydration denied (concurrency limit)',
                    {
                        id,
                        activeHydrations: current.activeHydrationIds.size,
                        limit: MAX_CONCURRENT_HYDRATIONS,
                    },
                );
            }
            return false;
        }

        setState((inner) => {
            const next = cloneState(inner);
            next.activeHydrationIds.add(id);
            next.hydratedIds.add(id);
            recordStatus(next, id, 'hydrated');
            if (process.env.NODE_ENV !== 'production' && DEV_RUNTIME_TOASTS) {
                console.info('[dashboard-runtime] hydration granted', {
                    id,
                    activeHydrations: next.activeHydrationIds.size,
                    activeFetches: next.activeFetchCount,
                });
            }
            return next;
        });
        return true;
    }, []);

    const releaseHydration = useCallback((id: string) => {
        setState((current) => {
            const next = cloneState(current);
            next.activeHydrationIds.delete(id);
            if (next.loadedIds.has(id)) recordStatus(next, id, 'shell');
            return next;
        });
    }, []);

    const markWidgetFailed = useCallback(
        (id: string, reason: WidgetFailureReason) => {
            setState((current) => {
                const next = cloneState(current);
                next.failedIds.add(id);
                next.activeHydrationIds.delete(id);
                const record = next.records.get(id);
                const failureCount = (record?.failureCount ?? 0) + 1;
                const failure = getFailureRecord(id);
                const status: WidgetRuntimeStatus = failure?.disabled
                    ? 'disabled'
                    : 'cooldown';
                const baseRecord = {
                    id,
                    metadata: record?.metadata ?? {
                        id,
                        priority: 'normal',
                        weight: 'medium',
                        defaultLoad: 'visible',
                    },
                    status,
                    registeredAt: record?.registeredAt ?? Date.now(),
                    loadedAt: record?.loadedAt ?? Date.now(),
                    failureCount,
                };

                const optionalFields: Partial<
                    Pick<
                        RuntimeWidgetRecord,
                        'lastVisibleAt' | 'cooldownUntil' | 'disabled'
                    >
                > = {};
                if (record?.lastVisibleAt !== undefined)
                    optionalFields.lastVisibleAt = record.lastVisibleAt;
                if (failure?.cooldownUntil !== undefined)
                    optionalFields.cooldownUntil = failure.cooldownUntil;
                if (failure?.disabled !== undefined)
                    optionalFields.disabled = failure.disabled;

                next.records.set(id, { ...baseRecord, ...optionalFields });
                if (failure?.disabled) next.cooldownIds.delete(id);
                else next.cooldownIds.add(id);
                if (process.env.NODE_ENV !== 'production') {
                    console.info('[dashboard-runtime] widget failed', {
                        id,
                        failureCount,
                        reason,
                    });
                }
                return next;
            });
        },
        [],
    );

    const retryWidget = useCallback((id: string) => {
        clearResourceFailure(id);
        setState((current) => {
            const next = cloneState(current);
            next.failedIds.delete(id);
            next.cooldownIds.delete(id);
            next.loadedIds.add(id);
            recordStatus(next, id, 'shell');
            return next;
        });
    }, []);

    const snapshot = useMemo<WidgetRuntimeSnapshot>(() => {
        const pressure = getPressureLevel(state);
        return {
            registered: state.records.size,
            loaded: state.loadedIds.size,
            visible: state.visibleIds.size,
            nearVisible: state.nearVisibleIds.size,
            offscreen: state.offscreenIds.size,
            background: state.backgroundIds.size,
            hydrated: state.hydratedIds.size,
            failed: state.failedIds.size,
            cooldown: state.cooldownIds.size,
            activeFetches: state.activeFetchCount,
            activeHydrations: state.activeHydrationIds.size,
            paused: state.paused || pressure === 'high',
            pressure,
        };
    }, [state]);

    const value = useMemo<DashboardRuntimeContextValue>(
        () => ({
            state,
            snapshot,
            registerWidget,
            unregisterWidget,
            setWidgetVisible,
            setWidgetVisibilityLevel,
            requestHydration,
            releaseHydration,
            markWidgetFailed,
            retryWidget,
            loadMore: () => loadBatch(),
            isWidgetLoaded: (id) => state.loadedIds.has(id),
            getWidgetStatus: (id) =>
                state.records.get(id)?.status ??
                (state.loadedIds.has(id) ? 'shell' : 'idle'),
        }),
        [
            state,
            snapshot,
            registerWidget,
            unregisterWidget,
            setWidgetVisible,
            setWidgetVisibilityLevel,
            requestHydration,
            releaseHydration,
            markWidgetFailed,
            retryWidget,
            loadBatch,
        ],
    );

    return (
        <DashboardRuntimeContext.Provider value={value}>
            {children}
            {DEV_RUNTIME_DEBUG_PANEL &&
                process.env.NODE_ENV !== 'production' && (
                    <RuntimeDebugPanel snapshot={snapshot} />
                )}
        </DashboardRuntimeContext.Provider>
    );
}

function RuntimeDebugPanel({ snapshot }: { snapshot: WidgetRuntimeSnapshot }) {
    return (
        <div className="fixed bottom-4 right-4 z-40 hidden rounded-lg border border-zinc-200 bg-white/90 p-3 text-[10px] text-zinc-600 shadow-sm backdrop-blur md:block dark:border-zinc-800 dark:bg-zinc-950/90 dark:text-zinc-300">
            <div className="mb-1 font-semibold">Runtime Debug</div>
            <div>reg {snapshot.registered}</div>
            <div>loaded {snapshot.loaded}</div>
            <div>vis {snapshot.visible}</div>
            <div>near {snapshot.nearVisible}</div>
            <div>off {snapshot.offscreen}</div>
            <div>bg {snapshot.background}</div>
            <div>hyd {snapshot.hydrated}</div>
            <div>fail {snapshot.failed}</div>
            <div>fetch {snapshot.activeFetches}</div>
            <div>hydrating {snapshot.activeHydrations}</div>
            <div>press {snapshot.pressure}</div>
            {snapshot.paused && <div className="text-amber-600">PAUSED</div>}
        </div>
    );
}

export function useDashboardRuntime() {
    const context = useContext(DashboardRuntimeContext);
    if (!context) {
        throw new Error(
            'useDashboardRuntime must be used inside DashboardRuntimeProvider',
        );
    }
    return context;
}

export function useDashboardRuntimeWidget({
    metadata,
    eager = false,
}: {
    metadata: WidgetRuntimeMetadata;
    eager?: boolean;
}): {
    ref: RefObject<HTMLDivElement | null>;
    loaded: boolean;
    visible: boolean;
    canHydrate: boolean;
    status: WidgetRuntimeStatus;
    retry: () => void;
    loadMore: () => void;
} {
    const runtime = useDashboardRuntime();
    const {
        registerWidget,
        unregisterWidget,
        setWidgetVisible,
        setWidgetVisibilityLevel,
        requestHydration,
        releaseHydration,
        retryWidget,
        loadMore,
    } = runtime;
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(eager);
    const [canHydrate, setCanHydrate] = useState(false);

    useEffect(() => {
        registerWidget({
            ...metadata,
            defaultLoad: eager ? 'eager' : (metadata.defaultLoad ?? 'visible'),
        });
        return () => unregisterWidget(metadata.id);
    }, [eager, metadata, registerWidget, unregisterWidget]);

    useEffect(() => {
        if (eager) {
            setWidgetVisible(metadata.id, true);
            setVisible(true);
            return;
        }
        const node = ref.current;
        if (!node || !('IntersectionObserver' in window)) {
            setWidgetVisible(metadata.id, true);
            setVisible(true);
            return;
        }

        // Use 4-level visibility system with multiple observers
        const visibleObserver = new IntersectionObserver(
            ([entry]) => {
                const nextVisible = Boolean(entry?.isIntersecting);
                setVisible(nextVisible);
                if (nextVisible) {
                    setWidgetVisibilityLevel(metadata.id, 'visible');
                }
            },
            { rootMargin: '0px' },
        );

        const nearVisibleObserver = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting && !visible) {
                    setWidgetVisibilityLevel(metadata.id, 'near-visible');
                }
            },
            { rootMargin: `${NEAR_VIEWPORT_MARGIN_PX}px 0px` },
        );

        const offscreenObserver = new IntersectionObserver(
            ([entry]) => {
                if (!entry?.isIntersecting) {
                    setWidgetVisibilityLevel(metadata.id, 'offscreen');
                }
            },
            { rootMargin: `${BACKGROUND_MARGIN_PX}px 0px` },
        );

        visibleObserver.observe(node);
        nearVisibleObserver.observe(node);
        offscreenObserver.observe(node);

        return () => {
            visibleObserver.disconnect();
            nearVisibleObserver.disconnect();
            offscreenObserver.disconnect();
            setWidgetVisible(metadata.id, false);
        };
    }, [
        eager,
        metadata.id,
        setWidgetVisible,
        setWidgetVisibilityLevel,
        visible,
    ]);

    const loaded = runtime.isWidgetLoaded(metadata.id);
    const status = runtime.getWidgetStatus(metadata.id);
    useEffect(() => {
        if (
            !visible ||
            !loaded ||
            status === 'failed' ||
            status === 'cooldown' ||
            status === 'disabled'
        ) {
            setCanHydrate(false);
            releaseHydration(metadata.id);
            return;
        }
        const granted = requestHydration(metadata.id);
        setCanHydrate(granted);
        return () => releaseHydration(metadata.id);
    }, [loaded, metadata.id, releaseHydration, requestHydration, visible]);

    return {
        ref,
        loaded,
        visible,
        canHydrate,
        status,
        retry: () => retryWidget(metadata.id),
        loadMore,
    };
}
