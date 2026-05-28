'use client';

import { type Dispatch, type SetStateAction, useState } from 'react';
import { Eye, EyeOff, Layers3, Lock, Plus, Unlock } from 'lucide-react';
import { Button, IconButton } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { cn } from '@/lib/utils/utils';
import type { LayerRecord } from '../hooks/useCreativeStudio';

interface CreativeLayerPanelProps {
    layers: LayerRecord[];
    selectedLayerId: string;
    setSelectedLayerId: (id: string) => void;
    selectedProjectId: string;
    toggleLayerVisible: (id: string) => Promise<void>;
    toggleLayerLocked: (id: string) => Promise<void>;
    createLayer: (data: {
        name: string;
        layer_type?: string;
    }) => Promise<unknown>;
    showLayerForm: boolean;
    setShowLayerForm: Dispatch<SetStateAction<boolean>>;
}

export function CreativeLayerPanel({
    layers,
    selectedLayerId,
    setSelectedLayerId,
    selectedProjectId,
    toggleLayerVisible,
    toggleLayerLocked,
    createLayer,
    showLayerForm,
    setShowLayerForm,
}: CreativeLayerPanelProps) {
    const toast = useToastContext();
    const [layerName, setLayerName] = useState('');
    const [layerType, setLayerType] = useState('shape');
    const [layerSubmitting, setLayerSubmitting] = useState(false);

    async function handleCreateLayer(e: React.FormEvent) {
        e.preventDefault();
        if (!layerName.trim()) return;
        setLayerSubmitting(true);
        try {
            await createLayer({
                name: layerName.trim(),
                layer_type: layerType,
            });
            setLayerName('');
            setLayerType('shape');
            setShowLayerForm(false);
            toast.success('Layer added.');
        } catch {
            toast.error('Failed to add layer.');
        } finally {
            setLayerSubmitting(false);
        }
    }

    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                        Layers
                    </h2>
                    <Layers3 size={17} className="text-zinc-400" />
                </div>
                {selectedProjectId && (
                    <Button
                        size="sm"
                        variant="secondary"
                        icon={Plus}
                        onClick={() => setShowLayerForm(true)}
                    >
                        Add
                    </Button>
                )}
            </div>

            {showLayerForm && (
                <form
                    onSubmit={(e) => void handleCreateLayer(e)}
                    className="mb-3 space-y-2"
                >
                    <input
                        value={layerName}
                        onChange={(e) => setLayerName(e.target.value)}
                        placeholder="Layer name *"
                        required
                        className="w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                    <select
                        value={layerType}
                        onChange={(e) => setLayerType(e.target.value)}
                        className="w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                        <option value="shape">Shape</option>
                        <option value="text">Text</option>
                        <option value="image">Image</option>
                        <option value="note">Note</option>
                    </select>
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={layerSubmitting}
                        >
                            {layerSubmitting ? 'Adding…' : 'Add layer'}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setShowLayerForm(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            )}

            {layers.length === 0 ? (
                <div className="rounded-lg bg-zinc-50 p-4 text-center dark:bg-zinc-950">
                    <p className="text-xs text-zinc-500">
                        {selectedProjectId
                            ? 'No layers yet. Add your first layer.'
                            : 'Select a project first.'}
                    </p>
                    {selectedProjectId && (
                        <Button
                            className="mt-2"
                            size="sm"
                            icon={Plus}
                            onClick={() => setShowLayerForm(true)}
                        >
                            Add your first layer
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-2">
                    {layers.map((layer) => (
                        <div
                            key={layer.id}
                            className={cn(
                                'flex items-center gap-2 rounded-lg border p-2',
                                selectedLayerId === layer.id
                                    ? 'border-blue-400 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/25'
                                    : 'border-zinc-200 dark:border-zinc-800',
                            )}
                        >
                            <button
                                type="button"
                                onClick={() => setSelectedLayerId(layer.id)}
                                className="min-w-0 flex-1 text-left"
                            >
                                <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                                    {layer.name}
                                </p>
                                <p className="text-xs text-zinc-500">
                                    {layer.layer_type}
                                </p>
                            </button>
                            <IconButton
                                icon={layer.visible ? Eye : EyeOff}
                                label={
                                    layer.visible ? 'Hide layer' : 'Show layer'
                                }
                                size="xs"
                                onClick={() =>
                                    void toggleLayerVisible(layer.id)
                                }
                            />
                            <IconButton
                                icon={layer.locked ? Lock : Unlock}
                                label={
                                    layer.locked ? 'Unlock layer' : 'Lock layer'
                                }
                                size="xs"
                                onClick={() => void toggleLayerLocked(layer.id)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
