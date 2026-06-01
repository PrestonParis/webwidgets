'use client';

import { useMemo, useState } from 'react';
import type React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Image from 'next/image';
import { Highlighter, LetterText, ShieldX, Trash2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type {
    NormalizedViewDocument,
    ViewAnnotation,
    ViewLayer,
} from '@/features/view/schemas/objectSchemas';
import { createAnnotation } from '@/features/view/annotations/annotationStore';
import { cn } from '@/lib/utils/utils';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

type UpdateAnnotation = (
    annotationId: string,
    patch: Partial<ViewAnnotation>,
) => void;

function PreBlock({ text }: { text: string }) {
    return (
        <pre className="h-full overflow-auto whitespace-pre-wrap p-5 text-xs leading-relaxed text-zinc-200">
            {text}
        </pre>
    );
}

function renderValue(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    return JSON.stringify(value);
}

export function ViewRenderer({
    document,
    annotations = [],
    layers = [],
    zoom = 1,
    onAddAnnotation,
    onUpdateAnnotation,
    onRemoveAnnotation,
}: {
    document: NormalizedViewDocument | null;
    annotations?: ViewAnnotation[];
    layers?: ViewLayer[];
    zoom?: number;
    onAddAnnotation?: ((annotation: ViewAnnotation) => void) | undefined;
    onUpdateAnnotation?: UpdateAnnotation | undefined;
    onRemoveAnnotation?: ((annotationId: string) => void) | undefined;
}) {
    const renderable = document?.renderable as
        | Record<string, unknown>
        | undefined;
    const jsonText = useMemo(
        () =>
            document?.strategy === 'json_tree'
                ? JSON.stringify(renderable?.value ?? {}, null, 2)
                : '',
        [document?.strategy, renderable],
    );

    if (!document) {
        return (
            <div className="grid h-full place-items-center text-sm text-zinc-500">
                Select a file to inspect, annotate, transform, or export.
            </div>
        );
    }

    if (
        document.strategy === 'pdf_canvas' &&
        typeof renderable?.url === 'string'
    ) {
        return (
            <PdfEditor
                document={document}
                url={renderable.url}
                annotations={annotations}
                layers={layers}
                zoom={zoom}
                onAddAnnotation={onAddAnnotation}
                onUpdateAnnotation={onUpdateAnnotation}
                onRemoveAnnotation={onRemoveAnnotation}
            />
        );
    }

    if (
        document.strategy === 'markdown_html' &&
        typeof renderable?.html === 'string'
    ) {
        return (
            <article
                className="prose prose-zinc dark:prose-invert max-w-none overflow-auto p-6 text-sm"
                dangerouslySetInnerHTML={{ __html: renderable.html }}
            />
        );
    }

    if (document.strategy === 'image' && typeof renderable?.url === 'string') {
        return (
            <div className="grid h-full place-items-center overflow-auto bg-zinc-100 p-6 dark:bg-zinc-950">
                <Image
                    src={renderable.url}
                    alt={document.file.name}
                    className="max-h-full max-w-full shadow-xl"
                    width={0}
                    height={0}
                    style={{ width: 'auto', height: 'auto' }}
                />
            </div>
        );
    }

    if (
        document.strategy === 'svg_sandbox' &&
        typeof renderable?.svg === 'string'
    ) {
        return (
            <iframe
                title={document.file.name}
                sandbox=""
                className="h-full w-full bg-white"
                srcDoc={renderable.svg}
            />
        );
    }

    if (document.strategy === 'csv_table') {
        const rows = (renderable?.rows ?? []) as Array<Record<string, unknown>>;
        const fields = (renderable?.fields ?? []) as string[];
        return (
            <div className="h-full overflow-auto p-4">
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr>
                            {fields.map((field) => (
                                <th
                                    key={field}
                                    className="border border-zinc-800 bg-zinc-900 px-2 py-1 text-left text-zinc-300"
                                >
                                    {field}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={index}>
                                {fields.map((field) => (
                                    <td
                                        key={field}
                                        className="border border-zinc-800 px-2 py-1 text-zinc-400"
                                    >
                                        {renderValue(row[field])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (document.strategy === 'json_tree') return <PreBlock text={jsonText} />;
    if (
        document.strategy === 'code_block' ||
        document.strategy === 'plain_text' ||
        document.strategy === 'yaml_text'
    ) {
        return (
            <PreBlock
                text={renderValue(renderable?.text ?? document.searchableText)}
            />
        );
    }

    if (document.strategy === 'media_placeholder') {
        return (
            <div className="grid h-full place-items-center text-sm text-zinc-500">
                Media timeline and waveform support is staged for a future
                renderer.
            </div>
        );
    }

    return (
        <div className="grid h-full place-items-center text-sm text-zinc-500">
            Unsupported renderer strategy: {document.strategy}
        </div>
    );
}

type PdfTool = 'select' | 'text' | 'highlight' | 'redaction';

function PdfEditor({
    document,
    url,
    annotations,
    layers,
    zoom,
    onAddAnnotation,
    onUpdateAnnotation,
    onRemoveAnnotation,
}: {
    document: NormalizedViewDocument;
    url: string;
    annotations: ViewAnnotation[];
    layers: ViewLayer[];
    zoom: number;
    onAddAnnotation?: ((annotation: ViewAnnotation) => void) | undefined;
    onUpdateAnnotation?: UpdateAnnotation | undefined;
    onRemoveAnnotation?: ((annotationId: string) => void) | undefined;
}) {
    const [numPages, setNumPages] = useState(1);
    const [tool, setTool] = useState<PdfTool>('select');
    const [loadError, setLoadError] = useState<string | null>(null);
    const annotationLayerVisible = isLayerVisible(layers, 'annotations');
    const drawingLayerVisible = isLayerVisible(layers, 'drawings');
    const visibleAnnotations = annotations.filter(
        (annotation) => annotation.fileId === document.file.id,
    );
    const pageWidth = Math.round(760 * zoom);

    return (
        <div className="flex h-full min-h-0 flex-col bg-zinc-100 dark:bg-zinc-950">
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    PDF Edit
                </span>
                <PdfToolButton
                    active={tool === 'select'}
                    label="Select"
                    onClick={() => setTool('select')}
                />
                <PdfToolButton
                    active={tool === 'text'}
                    icon={<LetterText size={14} />}
                    label="Text"
                    onClick={() => setTool('text')}
                />
                <PdfToolButton
                    active={tool === 'highlight'}
                    icon={<Highlighter size={14} />}
                    label="Highlight"
                    onClick={() => setTool('highlight')}
                />
                <PdfToolButton
                    active={tool === 'redaction'}
                    icon={<ShieldX size={14} />}
                    label="Redact"
                    onClick={() => setTool('redaction')}
                />
                <span className="ml-auto text-[10px] text-zinc-500">
                    {visibleAnnotations.length} edit
                    {visibleAnnotations.length === 1 ? '' : 's'}
                </span>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-6">
                {loadError ? (
                    <div className="grid h-full place-items-center text-sm text-red-400">
                        {loadError}
                    </div>
                ) : (
                    <Document
                        file={{ url }}
                        loading={
                            <p className="text-sm text-zinc-500">
                                Loading PDF...
                            </p>
                        }
                        error={
                            <p className="text-sm text-red-400">
                                Could not load this PDF.
                            </p>
                        }
                        onLoadSuccess={({ numPages: pageCount }) => {
                            setNumPages(pageCount);
                            setLoadError(null);
                        }}
                        onLoadError={(error) =>
                            setLoadError(
                                error instanceof Error
                                    ? error.message
                                    : 'Could not load this PDF.',
                            )
                        }
                    >
                        <div className="grid justify-center gap-6">
                            {Array.from(
                                { length: numPages },
                                (_, index) => index + 1,
                            ).map((pageNumber) => (
                                <PdfPageEditor
                                    key={pageNumber}
                                    pageNumber={pageNumber}
                                    pageWidth={pageWidth}
                                    tool={tool}
                                    annotations={visibleAnnotations}
                                    showAnnotations={annotationLayerVisible}
                                    showDrawings={drawingLayerVisible}
                                    fileId={document.file.id}
                                    onAddAnnotation={onAddAnnotation}
                                    onUpdateAnnotation={onUpdateAnnotation}
                                    onRemoveAnnotation={onRemoveAnnotation}
                                    onToolChange={setTool}
                                />
                            ))}
                        </div>
                    </Document>
                )}
            </div>
        </div>
    );
}

function PdfToolButton({
    active,
    icon,
    label,
    onClick,
}: {
    active: boolean;
    icon?: React.ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors',
                active
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100',
            )}
        >
            {icon}
            {label}
        </button>
    );
}

function PdfPageEditor({
    pageNumber,
    pageWidth,
    tool,
    annotations,
    showAnnotations,
    showDrawings,
    fileId,
    onAddAnnotation,
    onUpdateAnnotation,
    onRemoveAnnotation,
    onToolChange,
}: {
    pageNumber: number;
    pageWidth: number;
    tool: PdfTool;
    annotations: ViewAnnotation[];
    showAnnotations: boolean;
    showDrawings: boolean;
    fileId: string;
    onAddAnnotation?: ((annotation: ViewAnnotation) => void) | undefined;
    onUpdateAnnotation?: UpdateAnnotation | undefined;
    onRemoveAnnotation?: ((annotationId: string) => void) | undefined;
    onToolChange: (tool: PdfTool) => void;
}) {
    const pageAnnotations = annotations.filter(
        (annotation) => annotation.geometry?.page === pageNumber,
    );

    const addEditAt = (event: React.MouseEvent<HTMLDivElement>) => {
        if (tool === 'select' || !onAddAnnotation) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        const base = {
            fileId,
            layerId: tool === 'redaction' ? 'drawings' : 'annotations',
            geometry: {
                page: pageNumber,
                x: clamp(x, 1, 92),
                y: clamp(y, 1, 94),
                width: tool === 'text' ? 24 : 18,
                height: tool === 'text' ? 7 : 4,
            },
        };

        if (tool === 'text') {
            onAddAnnotation(
                createAnnotation({
                    ...base,
                    kind: 'text',
                    text: 'Edit text',
                    color: '#111827',
                }),
            );
        } else if (tool === 'highlight') {
            onAddAnnotation(
                createAnnotation({
                    ...base,
                    kind: 'highlight',
                    color: '#fde047',
                }),
            );
        } else {
            onAddAnnotation(
                createAnnotation({
                    ...base,
                    kind: 'redaction',
                    color: '#111827',
                }),
            );
        }
        onToolChange('select');
    };

    return (
        <div className="relative bg-white shadow-xl">
            <Page
                pageNumber={pageNumber}
                width={pageWidth}
                renderTextLayer
                renderAnnotationLayer
                className="bg-white"
            />
            <div
                className={cn(
                    'absolute inset-0',
                    tool === 'select' ? 'cursor-default' : 'cursor-crosshair',
                )}
                onClick={addEditAt}
            >
                {pageAnnotations.map((annotation) => {
                    const layerVisible =
                        annotation.layerId === 'drawings'
                            ? showDrawings
                            : showAnnotations;
                    if (!layerVisible) return null;
                    return (
                        <PdfAnnotationOverlay
                            key={annotation.id}
                            annotation={annotation}
                            onUpdateAnnotation={onUpdateAnnotation}
                            onRemoveAnnotation={onRemoveAnnotation}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function PdfAnnotationOverlay({
    annotation,
    onUpdateAnnotation,
    onRemoveAnnotation,
}: {
    annotation: ViewAnnotation;
    onUpdateAnnotation?: UpdateAnnotation | undefined;
    onRemoveAnnotation?: ((annotationId: string) => void) | undefined;
}) {
    const geometry = annotation.geometry ?? {};
    const style = {
        left: `${geometry.x ?? 0}%`,
        top: `${geometry.y ?? 0}%`,
        width: `${geometry.width ?? 20}%`,
        height: `${geometry.height ?? 6}%`,
    };

    if (annotation.kind === 'text') {
        return (
            <div className="group absolute" style={style}>
                <textarea
                    value={annotation.text ?? ''}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                        onUpdateAnnotation?.(annotation.id, {
                            text: event.target.value,
                        })
                    }
                    className="h-full w-full resize-none rounded-sm border border-blue-500/70 bg-white/85 p-1 text-[11px] leading-tight text-zinc-950 shadow-sm outline-none focus:bg-white"
                />
                <DeleteAnnotationButton
                    onClick={() => onRemoveAnnotation?.(annotation.id)}
                />
            </div>
        );
    }

    return (
        <button
            type="button"
            aria-label={`Remove ${annotation.kind}`}
            onClick={(event) => {
                event.stopPropagation();
                onRemoveAnnotation?.(annotation.id);
            }}
            className={cn(
                'group absolute rounded-sm border border-transparent transition-colors hover:border-red-500',
                annotation.kind === 'redaction'
                    ? 'bg-zinc-950'
                    : 'bg-yellow-300/45 mix-blend-multiply',
            )}
            style={style}
        >
            <span className="absolute -right-2 -top-2 hidden rounded-full bg-red-600 p-0.5 text-white group-hover:block">
                <Trash2 size={10} />
            </span>
        </button>
    );
}

function DeleteAnnotationButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            title="Remove edit"
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
            className="absolute -right-2 -top-2 hidden rounded-full bg-red-600 p-0.5 text-white group-hover:block"
        >
            <Trash2 size={10} />
        </button>
    );
}

function isLayerVisible(layers: ViewLayer[], layerId: string) {
    return layers.find((layer) => layer.id === layerId)?.visible ?? true;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}
