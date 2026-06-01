'use client';

import { useMemo, useState } from 'react';
import type React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Image from 'next/image';
import {
    Download,
    Grip,
    Highlighter,
    LetterText,
    PenLine,
    ShieldX,
    Trash2,
} from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type {
    NormalizedViewDocument,
    ViewAnnotation,
    ViewLayer,
} from '@/features/view/schemas/objectSchemas';
import { createAnnotation } from '@/features/view/annotations/annotationStore';
import { exportEditedPdf } from '@/features/view/pdf/pdfEditorExport';
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
    lastSavedAt,
}: {
    document: NormalizedViewDocument | null;
    annotations?: ViewAnnotation[];
    layers?: ViewLayer[];
    zoom?: number;
    onAddAnnotation?: ((annotation: ViewAnnotation) => void) | undefined;
    onUpdateAnnotation?: UpdateAnnotation | undefined;
    onRemoveAnnotation?: ((annotationId: string) => void) | undefined;
    lastSavedAt?: string | null;
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
                lastSavedAt={lastSavedAt ?? null}
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

type PdfTool =
    | 'select'
    | 'text'
    | 'replace-text'
    | 'highlight'
    | 'redaction'
    | 'signature';

function PdfEditor({
    document,
    url,
    annotations,
    layers,
    zoom,
    onAddAnnotation,
    onUpdateAnnotation,
    onRemoveAnnotation,
    lastSavedAt,
}: {
    document: NormalizedViewDocument;
    url: string;
    annotations: ViewAnnotation[];
    layers: ViewLayer[];
    zoom: number;
    onAddAnnotation?: ((annotation: ViewAnnotation) => void) | undefined;
    onUpdateAnnotation?: UpdateAnnotation | undefined;
    onRemoveAnnotation?: ((annotationId: string) => void) | undefined;
    lastSavedAt: string | null;
}) {
    const [numPages, setNumPages] = useState(1);
    const [tool, setTool] = useState<PdfTool>('select');
    const [loadError, setLoadError] = useState<string | null>(null);
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(
        null,
    );
    const [exporting, setExporting] = useState(false);
    const annotationLayerVisible = isLayerVisible(layers, 'annotations');
    const drawingLayerVisible = isLayerVisible(layers, 'drawings');
    const visibleAnnotations = annotations.filter(
        (annotation) => annotation.fileId === document.file.id,
    );
    const pageWidth = Math.round(760 * zoom);
    const canExport = visibleAnnotations.length > 0 && !exporting;

    const handleExport = async () => {
        setExporting(true);
        try {
            await exportEditedPdf({
                sourceUrl: url,
                fileName: document.file.name,
                annotations: visibleAnnotations,
            });
        } finally {
            setExporting(false);
        }
    };

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
                    active={tool === 'replace-text'}
                    icon={<LetterText size={14} />}
                    label="Replace"
                    onClick={() => setTool('replace-text')}
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
                <PdfToolButton
                    active={tool === 'signature'}
                    icon={<PenLine size={14} />}
                    label="Sign"
                    onClick={() => setTool('signature')}
                />
                <SignatureCaptureButton
                    onSignatureReady={setSignatureDataUrl}
                />
                <button
                    type="button"
                    disabled={!canExport}
                    onClick={() => {
                        void handleExport();
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
                >
                    <Download size={14} />
                    {exporting ? 'Exporting...' : 'Download edited PDF'}
                </button>
                <span className="ml-auto text-[10px] text-zinc-500">
                    {visibleAnnotations.length} edit
                    {visibleAnnotations.length === 1 ? '' : 's'} ·{' '}
                    {lastSavedAt
                        ? `saved ${new Date(lastSavedAt).toLocaleTimeString()}`
                        : 'autosave ready'}
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
                                    signatureDataUrl={signatureDataUrl}
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

function SignatureCaptureButton({
    onSignatureReady,
}: {
    onSignatureReady: (dataUrl: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [drawing, setDrawing] = useState(false);
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

    const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawing || !canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#111827';
        ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
        ctx.stroke();
    };

    const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
        setDrawing(true);
    };

    const clear = () => {
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const save = () => {
        if (!canvas) return;
        onSignatureReady(canvas.toDataURL('image/png'));
        setOpen(false);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
                <PenLine size={14} />
                Capture signature
            </button>
            {open && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
                    <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-950 p-4 shadow-2xl">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-zinc-100">
                                    Capture signature
                                </p>
                                <p className="text-xs text-zinc-500">
                                    Draw once, then use Sign and click the PDF.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                            >
                                Close
                            </button>
                        </div>
                        <canvas
                            ref={(node) => {
                                if (!node || canvas === node) return;
                                node.width = 760;
                                node.height = 220;
                                setCanvas(node);
                            }}
                            onPointerDown={startDrawing}
                            onPointerMove={draw}
                            onPointerUp={() => setDrawing(false)}
                            onPointerLeave={() => setDrawing(false)}
                            className="h-40 w-full touch-none rounded-md bg-white"
                        />
                        <div className="mt-3 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={clear}
                                className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-900"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={save}
                                className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white"
                            >
                                Use signature
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
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
    signatureDataUrl,
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
    signatureDataUrl: string | null;
    onToolChange: (tool: PdfTool) => void;
}) {
    const pageAnnotations = annotations.filter(
        (annotation) => annotation.geometry?.page === pageNumber,
    );

    const addEditAt = (event: React.MouseEvent<HTMLDivElement>) => {
        if (tool === 'select' || !onAddAnnotation) return;
        if (tool === 'signature' && !signatureDataUrl) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        const replacementTarget =
            tool === 'replace-text'
                ? getPdfTextTargetAtPoint(
                      event.clientX,
                      event.clientY,
                      rect,
                      pageNumber,
                  )
                : null;
        const replacementGeometry = replacementTarget?.geometry ?? {
            page: pageNumber,
            x: clamp(x, 1, 92),
            y: clamp(y, 1, 94),
            width: 24,
            height: 7,
        };
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
        } else if (tool === 'replace-text') {
            onAddAnnotation(
                createAnnotation({
                    fileId,
                    layerId: 'drawings',
                    kind: 'redaction',
                    text: replacementTarget?.text ?? 'Replacement text',
                    color: '#ffffff',
                    geometry: replacementGeometry,
                }),
            );
            onAddAnnotation(
                createAnnotation({
                    fileId,
                    layerId: 'annotations',
                    kind: 'text',
                    text: replacementTarget?.text ?? 'Replacement text',
                    color: '#111827',
                    geometry: replacementGeometry,
                }),
            );
        } else if (tool === 'signature') {
            onAddAnnotation(
                createAnnotation({
                    ...base,
                    kind: 'signature',
                    text: signatureDataUrl ?? '',
                    color: '#111827',
                    geometry: {
                        ...base.geometry,
                        width: 24,
                        height: 9,
                    },
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
    const startMove = createGeometryDragHandler(annotation, onUpdateAnnotation);
    const startResize = createGeometryResizeHandler(
        annotation,
        onUpdateAnnotation,
    );
    const controls = (
        <>
            <button
                type="button"
                title="Move"
                onPointerDown={startMove}
                className="absolute -left-2 -top-2 hidden cursor-move rounded-full bg-zinc-900 p-0.5 text-white shadow group-hover:block"
            >
                <Grip size={10} />
            </button>
            <button
                type="button"
                title="Resize"
                onPointerDown={startResize}
                className="absolute -bottom-2 -right-2 hidden h-4 w-4 cursor-nwse-resize rounded-full border border-white bg-blue-600 shadow group-hover:block"
            />
        </>
    );

    if (annotation.kind === 'text') {
        return (
            <div className="group absolute" style={style}>
                {controls}
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

    if (annotation.kind === 'signature' && annotation.text) {
        return (
            <div
                className="group absolute rounded-sm border border-blue-500/50 bg-white/70 p-1 hover:border-red-500"
                style={style}
            >
                {controls}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={annotation.text}
                    alt="Signature"
                    className="h-full w-full object-contain"
                />
                <DeleteAnnotationButton
                    onClick={() => onRemoveAnnotation?.(annotation.id)}
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                'group absolute rounded-sm border border-transparent transition-colors hover:border-red-500',
                annotation.kind === 'redaction' &&
                    annotation.color?.toLowerCase() === '#ffffff'
                    ? 'bg-white'
                    : annotation.kind === 'redaction'
                      ? 'bg-zinc-950'
                      : 'bg-yellow-300/45 mix-blend-multiply',
            )}
            style={style}
        >
            {controls}
            <DeleteAnnotationButton
                onClick={() => onRemoveAnnotation?.(annotation.id)}
            />
        </div>
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

function getPdfTextTargetAtPoint(
    clientX: number,
    clientY: number,
    pageRect: DOMRect,
    pageNumber: number,
) {
    const span = document
        .elementsFromPoint(clientX, clientY)
        .map((element) => {
            if (!(element instanceof HTMLElement)) return null;
            if (
                element.tagName === 'SPAN' &&
                element.closest('.react-pdf__Page__textContent')
            ) {
                return element;
            }
            return element.closest<HTMLElement>(
                '.react-pdf__Page__textContent span',
            );
        })
        .find((element): element is HTMLElement =>
            Boolean(element?.textContent?.trim()),
        );

    if (!span) return null;
    const spanRect = span.getBoundingClientRect();
    const x = ((spanRect.left - pageRect.left) / pageRect.width) * 100;
    const y = ((spanRect.top - pageRect.top) / pageRect.height) * 100;
    const width = (spanRect.width / pageRect.width) * 100;
    const height = (spanRect.height / pageRect.height) * 100;

    return {
        text: span.textContent?.trim() || 'Replacement text',
        geometry: {
            page: pageNumber,
            x: clamp(x, 0, 98),
            y: clamp(y, 0, 98),
            width: clamp(width, 3, 100 - clamp(x, 0, 98)),
            height: clamp(height, 2.4, 100 - clamp(y, 0, 98)),
        },
    };
}

function createGeometryDragHandler(
    annotation: ViewAnnotation,
    onUpdateAnnotation: UpdateAnnotation | undefined,
) {
    return (event: React.PointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!onUpdateAnnotation) return;
        const parent = event.currentTarget.parentElement?.parentElement;
        const rect = parent?.getBoundingClientRect();
        const geometry = annotation.geometry;
        if (!rect || !geometry) return;
        const startX = event.clientX;
        const startY = event.clientY;
        const originalX = geometry.x ?? 0;
        const originalY = geometry.y ?? 0;
        const width = geometry.width ?? 20;
        const height = geometry.height ?? 6;

        const move = (moveEvent: PointerEvent) => {
            const dx = ((moveEvent.clientX - startX) / rect.width) * 100;
            const dy = ((moveEvent.clientY - startY) / rect.height) * 100;
            onUpdateAnnotation(annotation.id, {
                geometry: {
                    ...geometry,
                    x: clamp(originalX + dx, 0, 100 - width),
                    y: clamp(originalY + dy, 0, 100 - height),
                },
            });
        };
        const stop = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', stop);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', stop);
    };
}

function createGeometryResizeHandler(
    annotation: ViewAnnotation,
    onUpdateAnnotation: UpdateAnnotation | undefined,
) {
    return (event: React.PointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!onUpdateAnnotation) return;
        const parent = event.currentTarget.parentElement?.parentElement;
        const rect = parent?.getBoundingClientRect();
        const geometry = annotation.geometry;
        if (!rect || !geometry) return;
        const startX = event.clientX;
        const startY = event.clientY;
        const originalWidth = geometry.width ?? 20;
        const originalHeight = geometry.height ?? 6;
        const x = geometry.x ?? 0;
        const y = geometry.y ?? 0;

        const move = (moveEvent: PointerEvent) => {
            const dw = ((moveEvent.clientX - startX) / rect.width) * 100;
            const dh = ((moveEvent.clientY - startY) / rect.height) * 100;
            onUpdateAnnotation(annotation.id, {
                geometry: {
                    ...geometry,
                    width: clamp(originalWidth + dw, 3, 100 - x),
                    height: clamp(originalHeight + dh, 2, 100 - y),
                },
            });
        };
        const stop = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', stop);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', stop);
    };
}
