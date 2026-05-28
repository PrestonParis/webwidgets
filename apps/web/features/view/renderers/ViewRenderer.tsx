'use client';

import { useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Image from 'next/image';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { NormalizedViewDocument } from '@/features/view/schemas/objectSchemas';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

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
}: {
    document: NormalizedViewDocument | null;
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
            <div className="h-full overflow-auto bg-zinc-100 p-6 dark:bg-zinc-950">
                <Document
                    file={{ url: renderable.url }}
                    loading={
                        <p className="text-sm text-zinc-500">Loading PDF...</p>
                    }
                >
                    <Page
                        pageNumber={1}
                        width={760}
                        renderTextLayer
                        renderAnnotationLayer
                        className="mx-auto bg-white shadow-xl"
                    />
                </Document>
            </div>
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
