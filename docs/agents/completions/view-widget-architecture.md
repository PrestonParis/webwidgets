# View Widget Architecture

The View Widget is a universal information surface built as an input -> parsing -> normalization -> rendering -> analysis -> editing -> transformation -> export pipeline.

## Core Modules

- `features/view/schemas/`: Zod and drizzle-zod contracts for files, normalized documents, annotations, layers, transforms, exports, and persistence placeholders.
- `features/view/parsers/`: Storage-independent parsers that normalize PDFs, text, markdown, code, CSV, JSON, YAML, images, and SVG into renderable structures.
- `features/view/renderers/`: React rendering surfaces. The first renderer shell supports PDF, markdown, text/code, CSV, JSON, images, SVG sandboxing, and placeholders.
- `features/view/registry/`: Replaceable parser and renderer registries with capabilities, security restrictions, export formats, and performance expectations.
- `features/view/analyzers/`: Metadata, entity, timeline, statistics, OCR placeholder, visual analysis placeholder, and future AI analysis hooks.
- `features/view/layers/` and `features/view/canvas/`: Base rendering, annotation, drawing, analysis, selection, zoom/pan, and future vector/collaboration foundations.
- `features/view/annotations/`: Highlight, comment, drawing, pin, redaction, and geometry primitives.
- `features/view/transforms/`: Safe transformation registry for extraction, snapshots, sanitization, summary placeholders, and annotation transforms.
- `features/view/exporters/`: Export planning for download, notes, research vault, dashboard widgets, timeline events, notifications, cloud storage, and action-engine destinations.
- `features/view/security/`: MIME validation, payload limits, HTML/SVG sanitization, and unsafe protocol/type blocking.

## Security Principles

- Uploaded content is untrusted.
- HTML and SVG are sanitized before rendering.
- SVG rendering uses a sandboxed iframe.
- Blocked MIME types and oversized files are rejected.
- External URLs must use safe protocols.
- Parser logic stays outside React components.

## Extension Points

Future work can add mammoth/docx, richer PDF text extraction, OCR, image metadata, code symbols, Monaco/Codemirror editing, Fabric/Konva canvas tools, html2canvas/jsPDF export execution, Yjs collaboration, semantic search, and action-engine backed export destinations without changing the normalized document contract.
