'use client';

import { Grid3X3, Plus, ZoomIn } from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import { cn } from '@/lib/utils/utils';
import type { LayerRecord, ProjectRecord } from '../hooks/useCreativeStudio';

interface CreativeCanvasProps {
    activeTool: string;
    selectedProject: ProjectRecord | undefined;
    selectedLayer: LayerRecord | undefined;
    layers: LayerRecord[];
    selectedLayerId: string;
    setSelectedLayerId: (id: string) => void;
    zoom: number;
    setZoom: (z: number) => void;
    snapToGrid: boolean;
    setSnapToGrid: (v: boolean) => void;
    onOpenProjectForm: () => void;
    onOpenLayerForm: () => void;
    loading: boolean;
}

export function CreativeCanvas({
    activeTool,
    selectedProject,
    selectedLayer,
    layers,
    selectedLayerId,
    setSelectedLayerId,
    zoom,
    setZoom,
    snapToGrid,
    setSnapToGrid,
    onOpenProjectForm,
    onOpenLayerForm,
    loading,
}: CreativeCanvasProps) {
    return (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <div>
                    <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        Design canvas
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Tool: {activeTool}
                        {selectedLayer
                            ? `, selected: ${selectedLayer.name}`
                            : ''}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                        <Grid3X3 size={14} />
                        Snap
                        <input
                            type="checkbox"
                            checked={snapToGrid}
                            onChange={(e) => setSnapToGrid(e.target.checked)}
                        />
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                        <ZoomIn size={14} />
                        <input
                            type="range"
                            min={40}
                            max={140}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-24 accent-zinc-900 dark:accent-zinc-100"
                        />
                        {zoom}%
                    </label>
                </div>
            </div>

            <div className="relative h-[680px] overflow-auto bg-zinc-100 p-8 dark:bg-zinc-950">
                {!selectedProject ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {loading ? 'Loading…' : 'No project selected'}
                            </p>
                            {!loading && (
                                <Button
                                    className="mt-3"
                                    icon={Plus}
                                    onClick={onOpenProjectForm}
                                >
                                    Create your first project
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div
                        className="relative mx-auto h-[520px] w-[780px] rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                        style={{
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'top center',
                        }}
                    >
                        {snapToGrid && (
                            <div className="absolute inset-0 rounded-lg bg-[linear-gradient(to_right,rgba(113,113,122,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(113,113,122,0.12)_1px,transparent_1px)] bg-[size:24px_24px]" />
                        )}
                        {layers.length === 0 ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center">
                                    <p className="text-sm text-zinc-500">
                                        Canvas is empty.
                                    </p>
                                    <Button
                                        className="mt-2"
                                        size="sm"
                                        icon={Plus}
                                        onClick={onOpenLayerForm}
                                    >
                                        Add your first layer
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            layers
                                .filter((l) => l.visible)
                                .map((layer) => (
                                    <button
                                        key={layer.id}
                                        type="button"
                                        onClick={() =>
                                            setSelectedLayerId(layer.id)
                                        }
                                        className={cn(
                                            'absolute rounded-lg border text-left transition',
                                            selectedLayerId === layer.id
                                                ? 'border-blue-500 ring-2 ring-blue-200'
                                                : 'border-zinc-300 dark:border-zinc-700',
                                            layer.locked &&
                                                'cursor-not-allowed opacity-80',
                                        )}
                                        style={{
                                            left: layer.x,
                                            top: layer.y,
                                            width: layer.width,
                                            height: layer.height,
                                            background:
                                                layer.color ?? '#e5e7eb',
                                        }}
                                    >
                                        {layer.layer_type === 'text' && (
                                            <span className="block p-4 text-xl font-semibold text-zinc-950">
                                                {layer.name}
                                            </span>
                                        )}
                                        {layer.layer_type === 'note' && (
                                            <span className="block p-3 text-sm leading-5 text-amber-950">
                                                {layer.name}
                                            </span>
                                        )}
                                    </button>
                                ))
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
