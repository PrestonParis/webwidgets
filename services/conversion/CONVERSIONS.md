# Conversion Service — Route Reference

All conversions run locally with no external API dependencies.
Engines: **LibreOffice**, **Pandoc**, **poppler-utils** (pdftotext / pdftohtml), **native** (in-process JS), **sharp** (images).

Legend: ✓ implemented · ✗ not implemented · ⚠ implemented with known caveats

---

## PDF — Input

Routes where a PDF is the source file.

| Target | Engine           | Lossy | Status | Notes                                                     |
| ------ | ---------------- | ----- | ------ | --------------------------------------------------------- |
| `txt`  | pdftotext        | ✓     | ✓      | Text layer only. Scanned PDFs produce empty output.       |
| `md`   | pdftotext        | ✓     | ✓      | Same extraction, wrapped in minimal Markdown.             |
| `html` | pdftohtml        | ✓     | ✓      | Positional HTML. Layout differs from original.            |
| `docx` | libreoffice-pdf  | ✓     | ⚠      | Draw PDF Import filter. Text boxes, not reflowable prose. |
| `odt`  | libreoffice-pdf  | ✓     | ⚠      | Same caveats as pdf → docx.                               |
| `rtf`  | libreoffice-pdf  | ✓     | ⚠      | LibreOffice Draw → RTF export.                            |
| `epub` | pdftoepub        | ✓     | ⚠      | Two-step: pdftotext + Pandoc. Images dropped.             |
| `png`  | pdftoppm         | —     | ✗      | Rasterize pages to images. Needs pdftoppm (poppler).      |
| `jpg`  | pdftoppm         | —     | ✗      | Same as pdf → png.                                        |
| `webp` | pdftoppm         | —     | ✗      | Rasterize then convert.                                   |
| `svg`  | pdf2svg          | —     | ✗      | Vector page extraction. Needs pdf2svg or Inkscape.        |
| `pptx` | libreoffice      | ✓     | ✗      | LibreOffice Impress PDF Import. Not yet registered.       |
| `xlsx` | camelot / tabula | —     | ✗      | Table extraction. Requires Python tabula-py or camelot.   |
| `csv`  | camelot / tabula | —     | ✗      | Same as pdf → xlsx, first table only.                     |

---

## PDF — Output

Routes where a PDF is produced from another format.

| Source             | Engine      | Lossy | Status | Notes                                                       |
| ------------------ | ----------- | ----- | ------ | ----------------------------------------------------------- |
| `doc`              | libreoffice | ✓     | ✓      |                                                             |
| `docx`             | libreoffice | ✓     | ✓      |                                                             |
| `odt`              | libreoffice | ✓     | ✓      |                                                             |
| `rtf`              | libreoffice | ✓     | ✓      |                                                             |
| `txt`              | pandoc      | ✓     | ⚠      | Requires LaTeX engine (pdflatex / lualatex).                |
| `html`             | pandoc      | ✓     | ⚠      | Requires LaTeX. HTML not sanitized before conversion.       |
| `md`               | pandoc      | ✓     | ⚠      | Requires LaTeX.                                             |
| `ppt`              | libreoffice | ✓     | ✓      |                                                             |
| `pptx`             | libreoffice | ✓     | ✓      |                                                             |
| `odp`              | libreoffice | ✓     | ✓      |                                                             |
| `xls`              | libreoffice | ✓     | ✓      |                                                             |
| `xlsx`             | libreoffice | ✓     | ✓      |                                                             |
| `ods`              | libreoffice | ✓     | ✓      |                                                             |
| `csv`              | libreoffice | ✓     | ✓      | CSV opened as spreadsheet before export.                    |
| `epub`             | pandoc      | ✓     | ⚠      | Requires LaTeX. Best-effort.                                |
| `svg`              | libreoffice | ✗     | ✓      | Vector-accurate.                                            |
| `png`              | libreoffice | ✓     | ✗      | Single-image to single-page PDF.                            |
| `jpg`              | libreoffice | ✓     | ✗      | Same.                                                       |
| `webp`             | —           | ✓     | ✗      | Convert to png first, then pdf.                             |
| `md (via browser)` | chromium    | ✓     | ✗      | Higher-fidelity PDF than LaTeX path. Needs headless Chrome. |

---

## Word / Office — Input

| Source | Target | Engine      | Status | Notes                                        |
| ------ | ------ | ----------- | ------ | -------------------------------------------- |
| `docx` | `pdf`  | libreoffice | ✓      |                                              |
| `docx` | `txt`  | pandoc      | ✓      |                                              |
| `docx` | `md`   | pandoc      | ✓      | Complex formatting simplified.               |
| `docx` | `html` | pandoc      | ✓      |                                              |
| `docx` | `odt`  | pandoc      | ✓      |                                              |
| `docx` | `rtf`  | pandoc      | ✓      |                                              |
| `docx` | `epub` | pandoc      | ✓      |                                              |
| `doc`  | `pdf`  | libreoffice | ✓      |                                              |
| `doc`  | `txt`  | libreoffice | ✓      |                                              |
| `doc`  | `html` | libreoffice | ✓      |                                              |
| `doc`  | `docx` | libreoffice | ✓      | Format upgrade.                              |
| `doc`  | `odt`  | libreoffice | ✓      |                                              |
| `odt`  | `pdf`  | libreoffice | ✓      |                                              |
| `odt`  | `txt`  | pandoc      | ✓      |                                              |
| `odt`  | `md`   | pandoc      | ✓      |                                              |
| `odt`  | `html` | pandoc      | ✓      |                                              |
| `odt`  | `docx` | libreoffice | ✓      |                                              |
| `odt`  | `rtf`  | pandoc      | ✓      |                                              |
| `odt`  | `epub` | pandoc      | ✓      |                                              |
| `rtf`  | `pdf`  | libreoffice | ✓      |                                              |
| `rtf`  | `txt`  | pandoc      | ✓      |                                              |
| `rtf`  | `md`   | pandoc      | ✓      |                                              |
| `rtf`  | `html` | pandoc      | ✓      |                                              |
| `rtf`  | `docx` | pandoc      | ✓      |                                              |
| `rtf`  | `odt`  | pandoc      | ✓      |                                              |
| `rtf`  | `epub` | pandoc      | ✓      |                                              |
| `docx` | `pptx` | —           | ✗      | No direct path. Convert to HTML then import. |
| `docx` | `xlsx` | —           | ✗      | No meaningful conversion exists.             |

---

## Presentations — Input

| Source | Target | Engine      | Status | Notes                                              |
| ------ | ------ | ----------- | ------ | -------------------------------------------------- |
| `pptx` | `pdf`  | libreoffice | ✓      |                                                    |
| `pptx` | `txt`  | pandoc      | ✓      | Slide text only.                                   |
| `ppt`  | `pdf`  | libreoffice | ✓      |                                                    |
| `ppt`  | `txt`  | libreoffice | ✓      |                                                    |
| `ppt`  | `pptx` | libreoffice | ✓      | Format upgrade.                                    |
| `odp`  | `pdf`  | libreoffice | ✓      |                                                    |
| `odp`  | `txt`  | libreoffice | ✓      |                                                    |
| `odp`  | `pptx` | libreoffice | ✓      |                                                    |
| `pptx` | `html` | —           | ✗      | LibreOffice can do this. Not yet registered.       |
| `pptx` | `png`  | —           | ✗      | Slide-per-image. Needs LibreOffice or python-pptx. |
| `pptx` | `jpg`  | —           | ✗      | Same.                                              |
| `pptx` | `md`   | —           | ✗      | Text extraction via Pandoc. Not registered.        |
| `pptx` | `docx` | —           | ✗      | Flattens slides to pages. No clean path.           |

---

## Spreadsheets — Input

| Source | Target | Engine      | Status | Notes                                             |
| ------ | ------ | ----------- | ------ | ------------------------------------------------- |
| `xlsx` | `pdf`  | libreoffice | ✓      |                                                   |
| `xlsx` | `csv`  | libreoffice | ✓      | First sheet only.                                 |
| `xlsx` | `txt`  | libreoffice | ✓      | First sheet only.                                 |
| `xlsx` | `html` | libreoffice | ✓      |                                                   |
| `xls`  | `pdf`  | libreoffice | ✓      |                                                   |
| `xls`  | `xlsx` | libreoffice | ✓      | Format upgrade.                                   |
| `xls`  | `txt`  | libreoffice | ✓      | First sheet only.                                 |
| `xls`  | `html` | libreoffice | ✓      |                                                   |
| `ods`  | `pdf`  | libreoffice | ✓      |                                                   |
| `ods`  | `xlsx` | libreoffice | ✓      |                                                   |
| `ods`  | `txt`  | libreoffice | ✓      | First sheet only.                                 |
| `ods`  | `html` | libreoffice | ✓      |                                                   |
| `csv`  | `xlsx` | libreoffice | ✓      |                                                   |
| `csv`  | `pdf`  | libreoffice | ✓      |                                                   |
| `csv`  | `txt`  | native      | ✓      | CSV is valid plain text; passthrough.             |
| `csv`  | `html` | libreoffice | ✓      |                                                   |
| `xlsx` | `json` | —           | ✗      | Sheet to JSON array. Needs xlsx/exceljs lib.      |
| `csv`  | `json` | —           | ✗      | Simple parse. Could be native.                    |
| `xlsx` | `md`   | —           | ✗      | Table as Markdown. Pandoc can do this indirectly. |
| `csv`  | `md`   | —           | ✗      | Pipe table format. Could be native.               |
| `xlsx` | `ods`  | —           | ✗      | LibreOffice can do this. Not registered.          |

---

## Text / Markup — All routes

| Source | Target | Engine      | Status | Notes                                       |
| ------ | ------ | ----------- | ------ | ------------------------------------------- |
| `md`   | `html` | pandoc      | ✓      |                                             |
| `md`   | `pdf`  | pandoc      | ⚠      | Requires LaTeX.                             |
| `md`   | `txt`  | pandoc      | ✓      |                                             |
| `md`   | `docx` | pandoc      | ✓      |                                             |
| `md`   | `odt`  | pandoc      | ✓      |                                             |
| `md`   | `rtf`  | pandoc      | ✓      |                                             |
| `md`   | `epub` | pandoc      | ✓      |                                             |
| `html` | `md`   | pandoc      | ✓      | Sanitizer TODO.                             |
| `html` | `pdf`  | pandoc      | ⚠      | Requires LaTeX. Sanitizer TODO.             |
| `html` | `txt`  | pandoc      | ✓      | Sanitizer TODO.                             |
| `html` | `docx` | pandoc      | ✓      | Sanitizer TODO.                             |
| `html` | `odt`  | pandoc      | ✓      | Sanitizer TODO.                             |
| `html` | `rtf`  | pandoc      | ✓      | Sanitizer TODO.                             |
| `html` | `epub` | pandoc      | ✓      | Sanitizer TODO.                             |
| `txt`  | `md`   | native      | ✓      | Passthrough — plain text is valid Markdown. |
| `txt`  | `pdf`  | pandoc      | ⚠      | Requires LaTeX.                             |
| `txt`  | `html` | pandoc      | ✓      |                                             |
| `txt`  | `docx` | pandoc      | ✓      |                                             |
| `txt`  | `odt`  | pandoc      | ✓      |                                             |
| `txt`  | `rtf`  | pandoc      | ✓      |                                             |
| `txt`  | `epub` | —           | ✗      | Easy Pandoc add. Not registered.            |
| `epub` | `pdf`  | pandoc      | ⚠      | Requires LaTeX.                             |
| `epub` | `html` | pandoc      | ✓      | Chapters flattened.                         |
| `epub` | `txt`  | pandoc      | ✓      |                                             |
| `epub` | `md`   | pandoc      | ✓      | Chapters flattened to GFM.                  |
| `epub` | `docx` | pandoc      | ✓      |                                             |
| `epub` | `odt`  | pandoc      | ✓      |                                             |
| `epub` | `rtf`  | pandoc      | ✓      |                                             |
| `svg`  | `pdf`  | libreoffice | ✓      |                                             |

---

## Images — All routes

| Source | Target            | Engine  | Status | Notes                                      |
| ------ | ----------------- | ------- | ------ | ------------------------------------------ |
| `png`  | `jpg`             | sharp   | ✓      |                                            |
| `png`  | `webp`            | sharp   | ✓      |                                            |
| `jpg`  | `png`             | sharp   | ✓      |                                            |
| `jpg`  | `webp`            | sharp   | ✓      |                                            |
| `webp` | `png`             | sharp   | ✓      |                                            |
| `webp` | `jpg`             | sharp   | ✓      |                                            |
| `gif`  | `png`             | sharp   | ✓      | First frame extracted.                     |
| `gif`  | `webp`            | sharp   | ✓      | Animation preserved.                       |
| `tiff` | `png`             | sharp   | ✓      |                                            |
| `tiff` | `jpg`             | sharp   | ✓      |                                            |
| `bmp`  | `png`             | sharp   | ✓      |                                            |
| `svg`  | `png`             | sharp   | ✓      |                                            |
| `svg`  | `jpg`             | sharp   | ✓      |                                            |
| `heic` | `jpg`             | libheif | ✗      | Needs libheif with decoder. Noted as TODO. |
| `heic` | `png`             | libheif | ✗      | Same.                                      |
| `heic` | `webp`            | libheif | ✗      | Same.                                      |
| `png`  | `webp` (lossless) | sharp   | ✓      | Already covered by png → webp.             |
| `tiff` | `webp`            | sharp   | ✗      | Sharp supports this. Not registered.       |
| `bmp`  | `jpg`             | sharp   | ✗      | Sharp supports this. Not registered.       |
| `bmp`  | `webp`            | sharp   | ✗      | Sharp supports this. Not registered.       |
| `gif`  | `jpg`             | sharp   | ✗      | Sharp supports this. Not registered.       |
| `any`  | `avif`            | sharp   | ✗      | Sharp supports AVIF. Not registered.       |

---

## Not Yet Built — Priority additions

These require new infrastructure or worker logic beyond what's currently wired.

### High value, straightforward

| Route                    | Tool               | Effort | Why                                                |
| ------------------------ | ------------------ | ------ | -------------------------------------------------- |
| `pdf → png` (per page)   | pdftoppm (poppler) | Low    | Poppler already installed. One new processor.      |
| `pdf → jpg` (per page)   | pdftoppm           | Low    | Same processor, different output format.           |
| `txt → epub`             | pandoc             | Low    | Already have the Pandoc wiring. One matrix entry.  |
| `pptx → html`            | libreoffice        | Low    | LibreOffice supports this. One matrix entry.       |
| `pptx → png` (per slide) | libreoffice        | Medium | Needs per-slide output handling and ZIP packaging. |
| `xlsx → json`            | exceljs            | Medium | Pure Node.js, no system binary required.           |
| `csv → json`             | native             | Low    | 10-line JSON.parse wrapper.                        |
| `csv → md`               | native             | Low    | Pipe-table formatter.                              |
| `heic → jpg/png/webp`    | libheif            | Medium | Needs libheif added to worker-images Dockerfile.   |
| `tiff → webp`            | sharp              | Low    | Already have sharp. One matrix entry.              |
| `bmp → jpg`              | sharp              | Low    | Already have sharp. One matrix entry.              |

### Medium value, medium complexity

| Route                           | Tool                         | Effort | Why                                                                  |
| ------------------------------- | ---------------------------- | ------ | -------------------------------------------------------------------- |
| `pdf → xlsx` (table extraction) | tabula-py or camelot         | High   | Requires Python worker. Table detection is heuristic.                |
| `pdf → csv` (table extraction)  | tabula-py or camelot         | High   | Same as above, single-table output.                                  |
| `pdf → pptx`                    | libreoffice (Impress import) | Medium | LibreOffice Impress PDF Import filter. Quality varies.               |
| `pptx → md`                     | pandoc                       | Low    | Pandoc supports PPTX input. One matrix entry + test.                 |
| `xlsx → md`                     | pandoc                       | Low    | Pandoc supports XLSX → markdown table.                               |
| `xlsx → ods`                    | libreoffice                  | Low    | LibreOffice supports this. One matrix entry.                         |
| `images → pdf` (multi-page)     | libreoffice or img2pdf       | Medium | Needs batch-input handling; output is single PDF.                    |
| `html → pdf` (via browser)      | puppeteer/playwright         | High   | Much better CSS fidelity than Pandoc+LaTeX. Needs browser in Docker. |

### Lower priority / complex

| Route                    | Tool            | Effort | Why                                                                           |
| ------------------------ | --------------- | ------ | ----------------------------------------------------------------------------- |
| `any → avif`             | sharp           | Low    | Sharp supports it. AVIF encode is slow, needs timeout tuning.                 |
| `xml → json`             | native          | Medium | Schema-dependent; no generic mapping without losing structure.                |
| `pdf → md` (AI-assisted) | LLM + pdftotext | High   | Uses AI to infer headings/lists from raw text. Out of scope for this service. |
| `scanned pdf → txt`      | Tesseract OCR   | High   | Needs Tesseract + image preprocessing. New worker variant.                    |
| `video`                  | ffmpeg          | High   | Entirely different worker. Out of scope for document service.                 |

---

## Batch API

| Feature                            | Status | Notes                                                               |
| ---------------------------------- | ------ | ------------------------------------------------------------------- |
| `POST /v1/jobs/batch` (up to 30)   | ✓      | Creates all jobs + per-job upload URLs in one request.              |
| `GET /v1/batches/:batchId`         | ✓      | Aggregate status + per-job status.                                  |
| `POST /v1/batches/:batchId/start`  | ✓      | Enqueues all jobs after uploads complete.                           |
| Batch ZIP download                 | ✗      | Stream all outputs as a single ZIP. Needs output aggregation route. |
| Webhook notification on completion | ✗      | POST to caller-provided URL when batch reaches terminal state.      |
| SSE progress stream                | ✗      | Server-sent events for real-time batch progress without polling.    |
| Partial batch start (subset)       | ✗      | Start only jobs where upload is confirmed.                          |

---

## Known Limitations

- **Scanned PDFs** — All pdf-source routes extract the text layer only. Scanned/image-only PDFs produce empty output. OCR requires Tesseract, which is not yet installed.
- **LibreOffice PDF Import fidelity** — `pdf → docx/odt/rtf` uses the Draw import path. Output is layout-based text boxes, not reflowable prose. Complex multi-column layouts, headers, and footers are best-effort.
- **LaTeX dependency** — Pandoc PDF output requires pdflatex, lualatex, or xelatex on the host. If none is installed the job fails with a clear error.
- **HTML sanitization** — HTML input is not sanitized before Pandoc processes it. Pandoc does not execute scripts, but the result should not be rendered as trusted HTML without a separate sanitizer pass.
- **XLSX multi-sheet** — xlsx → csv exports the first sheet only.
- **Password-protected documents** — Not supported. The conversion fails with a LibreOffice/Pandoc error.
- **HEIC** — Not supported. Requires libheif with decoder support added to the worker-images Dockerfile.
