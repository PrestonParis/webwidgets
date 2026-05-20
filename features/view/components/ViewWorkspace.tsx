'use client';

import {
    Download,
    MessageSquarePlus,
    Search,
    Sparkles,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { ViewFileBrowser } from '@/features/view/components/ViewFileBrowser';
import { ViewInspector } from '@/features/view/components/ViewInspector';
import { ViewRenderer } from '@/features/view/renderers/ViewRenderer';
import { useViewDocument } from '@/features/view/hooks/useViewDocument';
import { useViewStore } from '@/features/view/state/viewStore';
import { createAnnotation } from '@/features/view/annotations/annotationStore';

export function ViewWorkspace({ compact = false }: { compact?: boolean }) {
    const activeFile = useViewStore((state) => state.activeFile);
    const setActiveFile = useViewStore((state) => state.setActiveFile);
    const layers = useViewStore((state) => state.layers);
    const toggleLayer = useViewStore((state) => state.toggleLayer);
    const zoom = useViewStore((state) => state.zoom);
    const setZoom = useViewStore((state) => state.setZoom);
    const addAnnotation = useViewStore((state) => state.addAnnotation);
    const { data: document, isLoading, isError } = useViewDocument(activeFile);

    const addComment = () => {
        if (!activeFile) return;
        addAnnotation(
            createAnnotation({
                fileId: activeFile.id,
                kind: 'comment',
                text: 'New comment',
                color: '#60a5fa',
            }),
        );
    };

    return (
        <div
            className={`flex min-h-0 overflow-hidden bg-zinc-950 text-zinc-100 ${compact ? 'h-[420px]' : 'h-screen'}`}
        >
            {!compact && (
                <ViewFileBrowser
                    activeFileId={activeFile?.id}
                    onSelect={setActiveFile}
                />
            )}
            <main className="flex min-w-0 flex-1 flex-col">
                <header className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                            {activeFile?.name ?? 'View Workspace'}
                        </p>
                        <p className="text-[10px] text-zinc-600">
                            {document?.strategy ??
                                'input -> parse -> render -> analyze -> edit -> export'}
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            title="Search"
                            className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-900"
                        >
                            <Search size={15} />
                        </button>
                        <button
                            title="Add comment"
                            onClick={addComment}
                            className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-900"
                        >
                            <MessageSquarePlus size={15} />
                        </button>
                        <button
                            title="Analyze"
                            className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-900"
                        >
                            <Sparkles size={15} />
                        </button>
                        <button
                            title="Export"
                            className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-900"
                        >
                            <Download size={15} />
                        </button>
                        <span className="mx-1 h-5 w-px bg-zinc-800" />
                        <button
                            title="Zoom out"
                            onClick={() => setZoom(zoom - 0.1)}
                            className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-900"
                        >
                            <ZoomOut size={15} />
                        </button>
                        <span className="w-10 text-center text-[10px] text-zinc-500">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            title="Zoom in"
                            onClick={() => setZoom(zoom + 0.1)}
                            className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-900"
                        >
                            <ZoomIn size={15} />
                        </button>
                    </div>
                </header>
                <section className="relative min-h-0 flex-1">
                    {isLoading && (
                        <div className="grid h-full place-items-center text-sm text-zinc-500">
                            Parsing file...
                        </div>
                    )}
                    {isError && (
                        <div className="grid h-full place-items-center text-sm text-red-400">
                            Could not parse this file.
                        </div>
                    )}
                    {!isLoading && !isError && (
                        <ViewRenderer document={document ?? null} />
                    )}
                </section>
            </main>
            {!compact && (
                <ViewInspector
                    document={document ?? null}
                    layers={layers}
                    onToggleLayer={toggleLayer}
                />
            )}
        </div>
    );
}
