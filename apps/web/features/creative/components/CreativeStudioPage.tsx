'use client';

import { useState } from 'react';
import {
    Download,
    Eye,
    EyeOff,
    Grid3X3,
    Layers3,
    Lock,
    Palette,
    Plus,
    Save,
    Sparkles,
    Unlock,
    ZoomIn,
} from 'lucide-react';
import { Button, IconButton } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { cn } from '@/lib/utils/utils';
import { useCreativeStudio } from '../hooks/useCreativeStudio';

export function CreativeStudioPage() {
    const {
        projects,
        selectedProjectId,
        setSelectedProjectId,
        selectedProject,
        layers,
        selectedLayer,
        selectedLayerId,
        setSelectedLayerId,
        loading,
        createProject,
        createLayer,
        toggleLayerVisible,
        toggleLayerLocked,
        tools,
        activeTool,
        setActiveTool,
        exports,
        zoom,
        setZoom,
        snapToGrid,
        setSnapToGrid,
    } = useCreativeStudio();
    const toast = useToastContext();

    const [showProjectForm, setShowProjectForm] = useState(false);
    const [projTitle, setProjTitle] = useState('');
    const [projDesc, setProjDesc] = useState('');
    const [projFormat, setProjFormat] = useState('1440 x 960');
    const [projSubmitting, setProjSubmitting] = useState(false);

    const [showLayerForm, setShowLayerForm] = useState(false);
    const [layerName, setLayerName] = useState('');
    const [layerType, setLayerType] = useState('shape');
    const [layerSubmitting, setLayerSubmitting] = useState(false);

    async function handleCreateProject(e: React.FormEvent) {
        e.preventDefault();
        if (!projTitle.trim()) return;
        setProjSubmitting(true);
        try {
            await createProject({ title: projTitle.trim(), ...(projDesc.trim() ? { description: projDesc.trim() } : {}), format: projFormat });
            setProjTitle(''); setProjDesc(''); setProjFormat('1440 x 960');
            setShowProjectForm(false);
            toast.success('Project created.');
        } catch {
            toast.error('Failed to create project.');
        } finally {
            setProjSubmitting(false);
        }
    }

    async function handleCreateLayer(e: React.FormEvent) {
        e.preventDefault();
        if (!layerName.trim()) return;
        setLayerSubmitting(true);
        try {
            await createLayer({ name: layerName.trim(), layer_type: layerType });
            setLayerName(''); setLayerType('shape');
            setShowLayerForm(false);
            toast.success('Layer added.');
        } catch {
            toast.error('Failed to add layer.');
        } finally {
            setLayerSubmitting(false);
        }
    }

    return (
        <main
            id="main-content"
            className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-zinc-950 lg:px-12"
        >
            <section className="mx-auto flex max-w-7xl flex-col gap-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                                <Palette size={13} />
                                Creative studio
                            </span>
                            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                <Grid3X3 size={13} />
                                Canvas and design system
                            </span>
                        </div>
                        <h1 className="mt-4 text-3xl font-semibold text-zinc-950 dark:text-zinc-50 md:text-4xl">
                            Design diagrams, widget mockups, and visual assets inside WebWidgets.
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                            A frontend creative canvas with tools, layers, projects, and export targets.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="secondary"
                            icon={Save}
                            onClick={() => toast.success('Creative workspace snapshot saved.')}
                        >
                            Save
                        </Button>
                        <Button
                            icon={Sparkles}
                            onClick={() => toast.success('Widget draft generated from canvas layers.')}
                        >
                            Generate widget
                        </Button>
                    </div>
                </div>

                {/* Metrics row — computed from real data */}
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: 'Active layers', value: layers.length, detail: 'in selected project' },
                        { label: 'Projects', value: projects.length, detail: 'total' },
                        { label: 'Export targets', value: exports.length, detail: 'configured' },
                        { label: 'Visible layers', value: layers.filter((l) => l.visible).length, detail: 'on canvas' },
                    ].map((m) => (
                        <article
                            key={m.label}
                            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <p className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">{m.label}</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <strong className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">{m.value}</strong>
                                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{m.detail}</span>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_330px]">
                    <aside className="space-y-4">
                        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">Tools</h2>
                            <div className="mt-4 grid grid-cols-3 gap-2">
                                {tools.map((tool) => {
                                    const Icon = tool.icon;
                                    return (
                                        <button
                                            key={tool.id}
                                            type="button"
                                            onClick={() => setActiveTool(tool.id)}
                                            title={tool.label}
                                            className={cn(
                                                'flex h-12 flex-col items-center justify-center gap-1 rounded-lg border text-xs font-medium transition',
                                                activeTool === tool.id
                                                    ? 'border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                                                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300',
                                            )}
                                        >
                                            <Icon size={15} />
                                            {tool.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Project selector */}
                        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">Project</h2>
                                <Button size="sm" variant="secondary" icon={Plus} onClick={() => setShowProjectForm(true)}>
                                    New
                                </Button>
                            </div>

                            {showProjectForm && (
                                <form onSubmit={handleCreateProject} className="mb-3 space-y-2">
                                    <input
                                        value={projTitle}
                                        onChange={(e) => setProjTitle(e.target.value)}
                                        placeholder="Project title *"
                                        required
                                        className="w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                    />
                                    <input
                                        value={projDesc}
                                        onChange={(e) => setProjDesc(e.target.value)}
                                        placeholder="Description (optional)"
                                        className="w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                    />
                                    <select
                                        value={projFormat}
                                        onChange={(e) => setProjFormat(e.target.value)}
                                        className="w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                    >
                                        <option value="1440 x 960">1440 x 960</option>
                                        <option value="1080 x 1080">1080 x 1080</option>
                                        <option value="1920 x 1080">1920 x 1080</option>
                                    </select>
                                    <div className="flex gap-2">
                                        <Button type="submit" size="sm" disabled={projSubmitting}>
                                            {projSubmitting ? 'Creating…' : 'Create'}
                                        </Button>
                                        <Button type="button" size="sm" variant="secondary" onClick={() => setShowProjectForm(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {loading ? (
                                <p className="text-xs text-zinc-400">Loading…</p>
                            ) : projects.length === 0 ? (
                                <div className="rounded-lg bg-zinc-50 p-4 text-center dark:bg-zinc-950">
                                    <p className="text-xs text-zinc-500">No projects yet.</p>
                                    <Button className="mt-2" size="sm" icon={Plus} onClick={() => setShowProjectForm(true)}>
                                        Create your first project
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {projects.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setSelectedProjectId(p.id)}
                                            className={cn(
                                                'w-full rounded-lg border p-2 text-left text-sm transition',
                                                selectedProjectId === p.id
                                                    ? 'border-blue-400 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/25'
                                                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700',
                                            )}
                                        >
                                            <p className="font-medium text-zinc-950 dark:text-zinc-50 truncate">{p.title}</p>
                                            <p className="text-xs text-zinc-500">{p.format}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">Layers</h2>
                                    <Layers3 size={17} className="text-zinc-400" />
                                </div>
                                {selectedProjectId && (
                                    <Button size="sm" variant="secondary" icon={Plus} onClick={() => setShowLayerForm(true)}>
                                        Add
                                    </Button>
                                )}
                            </div>

                            {showLayerForm && (
                                <form onSubmit={handleCreateLayer} className="mb-3 space-y-2">
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
                                        <Button type="submit" size="sm" disabled={layerSubmitting}>
                                            {layerSubmitting ? 'Adding…' : 'Add layer'}
                                        </Button>
                                        <Button type="button" size="sm" variant="secondary" onClick={() => setShowLayerForm(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {layers.length === 0 ? (
                                <div className="rounded-lg bg-zinc-50 p-4 text-center dark:bg-zinc-950">
                                    <p className="text-xs text-zinc-500">
                                        {selectedProjectId ? 'No layers yet. Add your first layer.' : 'Select a project first.'}
                                    </p>
                                    {selectedProjectId && (
                                        <Button className="mt-2" size="sm" icon={Plus} onClick={() => setShowLayerForm(true)}>
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
                                                <p className="text-xs text-zinc-500">{layer.layer_type}</p>
                                            </button>
                                            <IconButton
                                                icon={layer.visible ? Eye : EyeOff}
                                                label={layer.visible ? 'Hide layer' : 'Show layer'}
                                                size="xs"
                                                onClick={() => void toggleLayerVisible(layer.id)}
                                            />
                                            <IconButton
                                                icon={layer.locked ? Lock : Unlock}
                                                label={layer.locked ? 'Unlock layer' : 'Lock layer'}
                                                size="xs"
                                                onClick={() => void toggleLayerLocked(layer.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </aside>

                    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                            <div>
                                <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                    Design canvas
                                </h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Tool: {activeTool}
                                    {selectedLayer ? `, selected: ${selectedLayer.name}` : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                                    <Grid3X3 size={14} />
                                    Snap
                                    <input
                                        type="checkbox"
                                        checked={snapToGrid}
                                        onChange={(event) => setSnapToGrid(event.target.checked)}
                                    />
                                </label>
                                <label className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                                    <ZoomIn size={14} />
                                    <input
                                        type="range"
                                        min={40}
                                        max={140}
                                        value={zoom}
                                        onChange={(event) => setZoom(Number(event.target.value))}
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
                                            <Button className="mt-3" icon={Plus} onClick={() => setShowProjectForm(true)}>
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
                                                <p className="text-sm text-zinc-500">Canvas is empty.</p>
                                                <Button className="mt-2" size="sm" icon={Plus} onClick={() => setShowLayerForm(true)}>
                                                    Add your first layer
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        layers
                                            .filter((layer) => layer.visible)
                                            .map((layer) => (
                                                <button
                                                    key={layer.id}
                                                    type="button"
                                                    onClick={() => setSelectedLayerId(layer.id)}
                                                    className={cn(
                                                        'absolute rounded-lg border text-left transition',
                                                        selectedLayerId === layer.id
                                                            ? 'border-blue-500 ring-2 ring-blue-200'
                                                            : 'border-zinc-300 dark:border-zinc-700',
                                                        layer.locked && 'cursor-not-allowed opacity-80',
                                                    )}
                                                    style={{
                                                        left: layer.x,
                                                        top: layer.y,
                                                        width: layer.width,
                                                        height: layer.height,
                                                        background: layer.color ?? '#e5e7eb',
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

                    <aside className="space-y-4">
                        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                                Export targets
                            </h2>
                            <div className="mt-4 grid gap-2">
                                {exports.map((target) => (
                                    <button
                                        key={target.id}
                                        type="button"
                                        onClick={() => toast.info(`${target.label} export staged.`)}
                                        className="rounded-lg border border-zinc-200 p-3 text-left transition hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                                {target.label}
                                            </h3>
                                            <span className={cn(
                                                'rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase',
                                                target.ready ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-950',
                                            )}>
                                                {target.ready ? 'ready' : 'draft'}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                                            {target.description}
                                        </p>
                                    </button>
                                ))}
                            </div>
                            <Button
                                className="mt-4"
                                fullWidth
                                icon={Download}
                                onClick={() => toast.success('Export packet prepared.')}
                            >
                                Export
                            </Button>
                        </section>

                        {selectedProject && (
                            <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                <h2 className="mb-3 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                                    Project info
                                </h2>
                                <dl className="grid gap-2">
                                    <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
                                        <dt className="text-xs text-zinc-500">Format</dt>
                                        <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            {selectedProject.format}
                                        </dd>
                                    </div>
                                    {selectedProject.description && (
                                        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
                                            <dt className="text-xs text-zinc-500">Description</dt>
                                            <dd className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                                                {selectedProject.description}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </section>
                        )}
                    </aside>
                </section>
            </section>
        </main>
    );
}
