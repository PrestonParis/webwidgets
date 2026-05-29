'use client';

import { useState } from 'react';
import { Grid3X3, Palette, Save, Sparkles } from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { useCreativeStudio } from '../hooks/useCreativeStudio';
import { CreativeToolsPanel } from './CreativeToolsPanel';
import { CreativeProjectPanel } from './CreativeProjectPanel';
import { CreativeLayerPanel } from './CreativeLayerPanel';
import { CreativeCanvas } from './CreativeCanvas';
import { CreativeExportPanel } from './CreativeExportPanel';

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
    const [showLayerForm, setShowLayerForm] = useState(false);

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
                            Design diagrams, widget mockups, and visual assets
                            inside WebWidgets.
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                            A frontend creative canvas with tools, layers,
                            projects, and export targets.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="secondary"
                            icon={Save}
                            onClick={() =>
                                toast.success(
                                    'Creative workspace snapshot saved.',
                                )
                            }
                        >
                            Save
                        </Button>
                        <Button
                            icon={Sparkles}
                            onClick={() =>
                                toast.success(
                                    'Widget draft generated from canvas layers.',
                                )
                            }
                        >
                            Generate widget
                        </Button>
                    </div>
                </div>

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        {
                            label: 'Active layers',
                            value: layers.length,
                            detail: 'in selected project',
                        },
                        {
                            label: 'Projects',
                            value: projects.length,
                            detail: 'total',
                        },
                        {
                            label: 'Export targets',
                            value: exports.length,
                            detail: 'configured',
                        },
                        {
                            label: 'Visible layers',
                            value: layers.filter((l) => l.visible).length,
                            detail: 'on canvas',
                        },
                    ].map((m) => (
                        <article
                            key={m.label}
                            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <p className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
                                {m.label}
                            </p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <strong className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                                    {m.value}
                                </strong>
                                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    {m.detail}
                                </span>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_330px]">
                    <aside className="space-y-4">
                        <CreativeToolsPanel
                            tools={tools}
                            activeTool={activeTool}
                            setActiveTool={setActiveTool}
                        />
                        <CreativeProjectPanel
                            projects={projects}
                            selectedProjectId={selectedProjectId}
                            setSelectedProjectId={setSelectedProjectId}
                            createProject={createProject}
                            loading={loading}
                            showProjectForm={showProjectForm}
                            setShowProjectForm={setShowProjectForm}
                        />
                        <CreativeLayerPanel
                            layers={layers}
                            selectedLayerId={selectedLayerId}
                            setSelectedLayerId={setSelectedLayerId}
                            selectedProjectId={selectedProjectId}
                            toggleLayerVisible={toggleLayerVisible}
                            toggleLayerLocked={toggleLayerLocked}
                            createLayer={createLayer}
                            showLayerForm={showLayerForm}
                            setShowLayerForm={setShowLayerForm}
                        />
                    </aside>
                    <CreativeCanvas
                        activeTool={activeTool}
                        selectedProject={selectedProject}
                        selectedLayer={selectedLayer}
                        layers={layers}
                        selectedLayerId={selectedLayerId}
                        setSelectedLayerId={setSelectedLayerId}
                        zoom={zoom}
                        setZoom={setZoom}
                        snapToGrid={snapToGrid}
                        setSnapToGrid={setSnapToGrid}
                        onOpenProjectForm={() => setShowProjectForm(true)}
                        onOpenLayerForm={() => setShowLayerForm(true)}
                        loading={loading}
                    />
                    <CreativeExportPanel
                        exports={exports}
                        selectedProject={selectedProject}
                    />
                </section>
            </section>
        </main>
    );
}
