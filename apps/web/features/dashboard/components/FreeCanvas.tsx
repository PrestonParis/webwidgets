'use client';

import { useCallback } from 'react';
import { Link2, GitMerge } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type {
    WidgetConfig,
    SnapRule,
    DashboardGridProps,
} from '@/features/dashboard/types/dashboard';
import { HideWidgetContext } from '@/features/dashboard/lib/HideWidgetContext';
import { RemoveWidgetContext } from '@/features/dashboard/lib/RemoveWidgetContext';
import { BucketWidgetContext } from '@/features/dashboard/lib/BucketWidgetContext';
import { UnpresentWidgetContext } from '@/features/dashboard/lib/UnpresentWidgetContext';
import { CopyStyleContext } from '@/features/dashboard/lib/CopyStyleContext';
import { renderWidgetContent } from '@/features/dashboard/lib/renderWidgetContent';
import FolderWidget from './FolderWidget';
import RecoveryFolderWidget from '@/features/recovery/components/RecoveryFolderWidget';
import { FreeItem } from './FreeCanvasItem';
import { WovenItem } from './FreeCanvasWoven';
import { ViewportWidgetMount } from './ViewportWidgetMount';
import { WidgetBodyBudgetProvider } from './WidgetBodyBudget';
import { DashboardRuntimeControls } from './DashboardRuntimeControls';
import { GlueConnectors } from './GlueConnectors';
import { useFreeCanvasDrag } from '@/features/dashboard/hooks/useFreeCanvasDrag';
import { useFreeCanvasResize } from '@/features/dashboard/hooks/useFreeCanvasResize';
import { useFreeCanvasRelations } from '@/features/dashboard/hooks/useFreeCanvasRelations';
import { useFreeCanvasComputed } from '@/features/dashboard/hooks/useFreeCanvasComputed';
import {
    GRID,
    WIDGET_W,
    WIDGET_APPROX_H,
} from '@/features/dashboard/lib/freeCanvasConfig';
import {
    autoPos,
    getWidgetEmoji,
    getWidgetLabel,
    type Pos,
    type Size,
} from '@/features/dashboard/lib/freeCanvasUtils';

interface FreeCanvasProps extends DashboardGridProps {
    snapRule: SnapRule;
}

const DENSE_CANVAS_WIDGET_THRESHOLD = 12;
const DENSE_CANVAS_BODY_BUDGET = 4;

// ─── static overlays ──────────────────────────────────────────────────────────

function CanvasDotGrid({ snapRule }: { snapRule: SnapRule }) {
    return (
        <div
            className="absolute inset-0 pointer-events-none select-none"
            style={{
                backgroundImage:
                    'radial-gradient(circle, #a1a1aa 1px, transparent 1px)',
                backgroundSize: `${GRID}px ${GRID}px`,
                opacity: snapRule === 'grid' ? 0.35 : 0.18,
            }}
        />
    );
}

function GlueWeaveBanner({
    pendingGlueId,
    pendingWeaveId,
}: {
    pendingGlueId: string | null;
    pendingWeaveId: string | null;
}) {
    if (!pendingGlueId && !pendingWeaveId) return null;
    return (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div
                className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-b-2xl text-white text-xs font-semibold shadow-lg',
                    pendingGlueId ? 'bg-blue-500' : 'bg-purple-500',
                )}
            >
                {pendingGlueId ? <Link2 size={12} /> : <GitMerge size={12} />}
                {pendingGlueId
                    ? 'Click another widget to glue'
                    : 'Click another widget to weave'}{' '}
                — Esc to cancel
            </div>
        </div>
    );
}

// ─── item layer helpers (context wrappers) ────────────────────────────────────

interface LayerSharedProps {
    draggingId: string | null;
    resizingId: string | null;
    pendingGlueId: string | null;
    pendingWeaveId: string | null;
    onToggleVisible: (id: string) => void;
    handleRemove: (id: string) => void;
    onMoveToBucket?: (id: string) => void;
    onUnpresent?: (id: string) => void;
    handleDragDown: (id: string, e: React.PointerEvent<HTMLDivElement>) => void;
    handleDragMove: (id: string, e: React.PointerEvent<HTMLDivElement>) => void;
    handleDragUp: (id: string) => void;
    handleResizeDown: (
        id: string,
        e: React.PointerEvent<HTMLDivElement>,
        axis: 'x' | 'y' | 'both',
    ) => void;
    handleResizeMove: (
        id: string,
        e: React.PointerEvent<HTMLDivElement>,
    ) => void;
    handleResizeUp: (id: string) => void;
    handleUnweave: (groupId: string) => void;
    handleGlueConnect: (id: string) => void;
    handleWeaveConnect: (id: string) => void;
    handleGlueToggle: (id: string) => void;
    handleWeaveToggle: (id: string) => void;
    renderContent: (config: WidgetConfig) => React.ReactNode;
    positions: Map<string, Pos>;
    sizes: Map<string, Size>;
}

interface WovenLayerProps extends LayerSharedProps {
    wovenGroups: Map<string, WidgetConfig[]>;
}

function WovenLayer({
    wovenGroups,
    positions,
    sizes,
    draggingId,
    resizingId,
    pendingGlueId,
    pendingWeaveId,
    onToggleVisible,
    handleRemove,
    onMoveToBucket,
    onUnpresent,
    handleDragDown,
    handleDragMove,
    handleDragUp,
    handleResizeDown,
    handleResizeMove,
    handleResizeUp,
    handleUnweave,
    handleGlueConnect,
    handleWeaveConnect,
    renderContent,
}: WovenLayerProps) {
    return (
        <>
            {[...wovenGroups.entries()].map(([groupId, members]) => {
                const leader = members[0]!;
                const pos = positions.get(leader.id) ?? autoPos(0);
                const size = sizes.get(leader.id) ?? {
                    w: WIDGET_W,
                    h: WIDGET_APPROX_H,
                };
                return (
                    <HideWidgetContext.Provider
                        key={groupId}
                        value={() => onToggleVisible(leader.id)}
                    >
                        <RemoveWidgetContext.Provider
                            value={() => handleRemove(leader.id)}
                        >
                            <BucketWidgetContext.Provider
                                value={
                                    onMoveToBucket
                                        ? () => onMoveToBucket(leader.id)
                                        : null
                                }
                            >
                                <UnpresentWidgetContext.Provider
                                    value={
                                        onUnpresent
                                            ? () => onUnpresent(leader.id)
                                            : null
                                    }
                                >
                                    <WovenItem
                                        groupId={groupId}
                                        members={members}
                                        pos={pos}
                                        size={size}
                                        isDraggingThis={
                                            draggingId === leader.id
                                        }
                                        isResizingThis={
                                            resizingId === leader.id
                                        }
                                        isPendingWeaveTarget={
                                            !!pendingWeaveId &&
                                            pendingWeaveId !== leader.id &&
                                            !members.find(
                                                (m) => m.id === pendingWeaveId,
                                            )
                                        }
                                        isPendingGlueTarget={
                                            !!pendingGlueId &&
                                            pendingGlueId !== leader.id
                                        }
                                        onDragDown={handleDragDown}
                                        onDragMove={handleDragMove}
                                        onDragUp={handleDragUp}
                                        onResizeDown={handleResizeDown}
                                        onResizeMove={handleResizeMove}
                                        onResizeUp={handleResizeUp}
                                        onUnweave={handleUnweave}
                                        onGlueConnect={handleGlueConnect}
                                        onWeaveConnect={handleWeaveConnect}
                                        renderContent={renderContent}
                                    />
                                </UnpresentWidgetContext.Provider>
                            </BucketWidgetContext.Provider>
                        </RemoveWidgetContext.Provider>
                    </HideWidgetContext.Provider>
                );
            })}
        </>
    );
}

interface FreeLayerProps extends LayerSharedProps {
    unwovenVisible: WidgetConfig[];
    ctx: ReturnType<typeof useFreeCanvasComputed>['ctx'];
    proximityHintId: string | null;
}

function FreeLayer({
    unwovenVisible,
    positions,
    sizes,
    ctx,
    draggingId,
    resizingId,
    proximityHintId,
    pendingGlueId,
    pendingWeaveId,
    onToggleVisible,
    handleRemove,
    onMoveToBucket,
    onUnpresent,
    handleDragDown,
    handleDragMove,
    handleDragUp,
    handleResizeDown,
    handleResizeMove,
    handleResizeUp,
    handleGlueToggle,
    handleGlueConnect,
    handleWeaveToggle,
    handleWeaveConnect,
    renderContent,
}: FreeLayerProps) {
    return (
        <>
            {unwovenVisible.map((config, i) => {
                const pos = positions.get(config.id) ?? autoPos(i);
                const size = sizes.get(config.id) ?? {
                    w: WIDGET_W,
                    h: WIDGET_APPROX_H,
                };
                const ws = ctx?.getSettings(config.id, config.type);
                const isViewportPinned = ws?.pinMode === 'viewport';
                const isCanvasPinned =
                    ws?.pinMode === 'canvas' || ws?.pinMode === 'anchor';
                return (
                    <FreeItem
                        key={config.id}
                        config={config}
                        pos={pos}
                        size={size}
                        isDraggingThis={draggingId === config.id}
                        isResizingThis={resizingId === config.id}
                        isProximityHint={proximityHintId === config.id}
                        isCanvasPinned={isCanvasPinned}
                        isViewportPinned={isViewportPinned}
                        isGlued={!!config.glueGroupId}
                        isPendingGlueSource={pendingGlueId === config.id}
                        isPendingGlueTarget={
                            !!pendingGlueId && pendingGlueId !== config.id
                        }
                        isWoven={!!config.weaveGroupId}
                        isPendingWeaveSource={pendingWeaveId === config.id}
                        isPendingWeaveTarget={
                            !!pendingWeaveId && pendingWeaveId !== config.id
                        }
                        onToggleVisible={onToggleVisible}
                        onRemove={handleRemove}
                        {...(onMoveToBucket && { onMoveToBucket })}
                        {...(onUnpresent && { onUnpresent })}
                        onDragDown={handleDragDown}
                        onDragMove={handleDragMove}
                        onDragUp={handleDragUp}
                        onResizeDown={handleResizeDown}
                        onResizeMove={handleResizeMove}
                        onResizeUp={handleResizeUp}
                        onGlueToggle={handleGlueToggle}
                        onGlueConnect={handleGlueConnect}
                        onWeaveToggle={handleWeaveToggle}
                        onWeaveConnect={handleWeaveConnect}
                    >
                        {renderContent(config)}
                    </FreeItem>
                );
            })}
        </>
    );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function FreeCanvas({
    layout,
    onLayoutChange,
    onDragComplete,
    onToggleVisible,
    onReset,
    onOpenFolder,
    onRenameFolder,
    onDeleteFolder,
    onOpenRecovery,
    onMoveToBucket,
    onUnpresent,
    snapRule,
}: FreeCanvasProps) {
    const {
        ctx,
        copyStyleMap,
        visible,
        positions,
        setPositions,
        sizes,
        setSizes,
        computeSnap,
        canvasH,
    } = useFreeCanvasComputed({ layout, snapRule });
    const denseCanvas = visible.length > DENSE_CANVAS_WIDGET_THRESHOLD;

    const renderContent = useCallback(
        (config: WidgetConfig) =>
            config.type === 'folder' ? (
                <FolderWidget
                    folder={config}
                    layout={layout}
                    onOpen={() => onOpenFolder(config.id)}
                    onRename={(n) => onRenameFolder(config.id, n)}
                    onDelete={() => onDeleteFolder(config.id)}
                />
            ) : config.type === 'recovery-empty' ? (
                <RecoveryFolderWidget onOpen={() => onOpenRecovery?.()} />
            ) : (
                <ViewportWidgetMount
                    widgetId={config.id}
                    config={config}
                    label={getWidgetLabel(config)}
                    emoji={getWidgetEmoji(config)}
                    render={() => renderWidgetContent(config, onReset)}
                />
            ),
        [
            layout,
            onOpenFolder,
            onRenameFolder,
            onDeleteFolder,
            onOpenRecovery,
            onReset,
        ],
    );

    const {
        draggingId,
        guideLines,
        proximityHintId,
        handleDragDown,
        handleDragMove,
        handleDragUp,
    } = useFreeCanvasDrag({
        positions,
        sizes,
        setPositions,
        visible,
        layout,
        onLayoutChange,
        onDragComplete,
        computeSnap,
        ctx,
    });
    const { resizingId, handleResizeDown, handleResizeMove, handleResizeUp } =
        useFreeCanvasResize({ sizes, setSizes, layout, onLayoutChange });
    const handleRemove = useCallback(
        (id: string) => onLayoutChange(layout.filter((w) => w.id !== id)),
        [layout, onLayoutChange],
    );
    const {
        pendingGlueId,
        pendingWeaveId,
        glueConnectors,
        wovenGroups,
        unwovenVisible,
        handleGlueToggle,
        handleGlueConnect,
        handleWeaveToggle,
        handleWeaveConnect,
        handleUnweave,
    } = useFreeCanvasRelations({
        layout,
        onLayoutChange,
        visible,
        positions,
        sizes,
        setPositions,
    });

    const layerProps = {
        draggingId,
        resizingId,
        pendingGlueId,
        pendingWeaveId,
        onToggleVisible,
        handleRemove,
        ...(onMoveToBucket && { onMoveToBucket }),
        ...(onUnpresent && { onUnpresent }),
        handleDragDown,
        handleDragMove,
        handleDragUp,
        handleResizeDown,
        handleResizeMove,
        handleResizeUp,
        handleUnweave,
        handleGlueToggle,
        handleGlueConnect,
        handleWeaveToggle,
        handleWeaveConnect,
        renderContent,
        positions,
        sizes,
    };

    return (
        <CopyStyleContext.Provider value={copyStyleMap}>
            <DashboardRuntimeControls />
            <div
                className="relative w-full"
                style={{ height: canvasH }}
                onClick={() => {
                    if (pendingGlueId) handleGlueToggle(pendingGlueId);
                    if (pendingWeaveId) handleWeaveToggle(pendingWeaveId);
                }}
            >
                <CanvasDotGrid snapRule={snapRule} />
                <GlueConnectors connectors={glueConnectors} height={canvasH} />
                {guideLines.map((line, i) => (
                    <div
                        key={i}
                        className="absolute pointer-events-none z-40 bg-blue-500"
                        style={
                            line.axis === 'x'
                                ? {
                                      left: line.value,
                                      top: 0,
                                      width: 1,
                                      height: '100%',
                                      opacity: 0.65,
                                  }
                                : {
                                      top: line.value,
                                      left: 0,
                                      height: 1,
                                      width: '100%',
                                      opacity: 0.65,
                                  }
                        }
                    />
                ))}
                <GlueWeaveBanner
                    pendingGlueId={pendingGlueId}
                    pendingWeaveId={pendingWeaveId}
                />
                <WidgetBodyBudgetProvider
                    enabled={denseCanvas}
                    maxActive={DENSE_CANVAS_BODY_BUDGET}
                >
                    <WovenLayer {...layerProps} wovenGroups={wovenGroups} />
                    <FreeLayer
                        {...layerProps}
                        unwovenVisible={unwovenVisible}
                        ctx={ctx}
                        proximityHintId={proximityHintId}
                    />
                </WidgetBodyBudgetProvider>
            </div>
        </CopyStyleContext.Provider>
    );
}
