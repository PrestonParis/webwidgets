'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    FileText,
    RotateCw,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { ReadingContentResult } from '@/features/reading/types/providers';
import type { ReadingDocument } from '@/features/reading/types/document';

// Set worker lazily inside the component via useEffect — module-level assignment
// with import.meta.url breaks Turbopack's bundling of pdfjs-dist.

interface PdfReaderViewProps {
    result: ReadingContentResult | null;
    document: ReadingDocument | null;
    loading: boolean;
    error: string | null;
    onPageChange?: (page: number) => void;
}

function LoadingState() {
    return (
        <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

export function PdfReaderView({
    result,
    document,
    loading,
    error,
    onPageChange,
}: PdfReaderViewProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [pageWidth, setPageWidth] = useState(720);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
            pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        }
    }, []);

    const content = result?.content.type === 'pdf_page' ? result.content : null;
    const pageNumber = content?.pageNumber ?? 1;
    const pdfUrl = content?.pdfUrl ?? document?.source.url;
    const resolvedTotalPages =
        numPages || content?.totalPages || document?.totalPages || 0;

    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        const observer = new ResizeObserver(([entry]) => {
            const width = entry?.contentRect.width ?? 900;
            setPageWidth(Math.max(280, Math.min(860, width - 48)));
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const file = useMemo(() => (pdfUrl ? { url: pdfUrl } : null), [pdfUrl]);

    if (loading) return <LoadingState />;
    if (error) return <p className="text-sm text-red-500 p-6">{error}</p>;
    if (!result || !content)
        return <p className="text-sm text-zinc-400 p-6">No PDF loaded.</p>;
    if (!file)
        return (
            <p className="text-sm text-zinc-400 p-6">
                This PDF does not have a readable file URL.
            </p>
        );

    const canGoPrevious = pageNumber > 1;
    const canGoNext = resolvedTotalPages
        ? pageNumber < resolvedTotalPages
        : true;
    const goToPage = (nextPage: number) => {
        if (!onPageChange) return;
        const bounded = resolvedTotalPages
            ? Math.min(Math.max(1, nextPage), resolvedTotalPages)
            : Math.max(1, nextPage);
        onPageChange(bounded);
    };

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto bg-gray-50 dark:bg-zinc-950"
        >
            <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white/90 px-4 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
                <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <FileText size={15} className="shrink-0 text-[#4f6ef7]" />
                    <span className="truncate">{document?.title ?? 'PDF'}</span>
                    <span className="shrink-0 font-medium text-zinc-700 dark:text-zinc-200">
                        Page {pageNumber}
                        {resolvedTotalPages ? ` / ${resolvedTotalPages}` : ''}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        title="Previous page"
                        disabled={!canGoPrevious || !onPageChange}
                        onClick={() => goToPage(pageNumber - 1)}
                        className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-800"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        type="button"
                        title="Next page"
                        disabled={!canGoNext || !onPageChange}
                        onClick={() => goToPage(pageNumber + 1)}
                        className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-800"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
                    <button
                        type="button"
                        title="Zoom out"
                        onClick={() =>
                            setScale((value) =>
                                Math.max(
                                    0.65,
                                    Number((value - 0.1).toFixed(2)),
                                ),
                            )
                        }
                        className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <ZoomOut size={15} />
                    </button>
                    <button
                        type="button"
                        title="Zoom in"
                        onClick={() =>
                            setScale((value) =>
                                Math.min(1.8, Number((value + 0.1).toFixed(2))),
                            )
                        }
                        className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <ZoomIn size={15} />
                    </button>
                    <button
                        type="button"
                        title="Rotate page"
                        onClick={() =>
                            setRotation((value) => (value + 90) % 360)
                        }
                        className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <RotateCw size={15} />
                    </button>
                </div>
            </div>
            <div className="px-4 py-8">
                <Document
                    file={file}
                    loading={<LoadingState />}
                    error={
                        <p className="text-center text-sm text-red-500">
                            Unable to render this PDF.
                        </p>
                    }
                    onLoadSuccess={({
                        numPages: loadedPages,
                    }: {
                        numPages: number;
                    }) => setNumPages(loadedPages)}
                >
                    <Page
                        key={`${pageNumber}-${scale}-${rotation}`}
                        pageNumber={pageNumber}
                        width={pageWidth * scale}
                        rotate={rotation}
                        renderAnnotationLayer
                        renderTextLayer
                        className="mx-auto overflow-hidden rounded-sm bg-white shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-800"
                    />
                </Document>
            </div>
        </div>
    );
}
