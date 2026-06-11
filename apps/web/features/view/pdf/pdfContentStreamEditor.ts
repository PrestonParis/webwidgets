import {
    decodePDFRawStream,
    PDFArray,
    type PDFDocument,
    PDFName,
    PDFRawStream,
} from 'pdf-lib';

export type NativePdfTextReplacement = {
    whiteoutId: string;
    textId: string;
    pageNumber: number;
    originalText: string;
    replacementText: string;
};

export type NativePdfTextReplacementResult = NativePdfTextReplacement & {
    applied: boolean;
    reason?: string;
};

type TextSegment = {
    start: number;
    end: number;
    operandStart: number;
    operandEnd: number;
    text: string;
    kind: 'string' | 'array';
};

type ParsedToken =
    | {
          kind: 'string';
          start: number;
          end: number;
          text: string;
      }
    | {
          kind: 'array';
          start: number;
          end: number;
          text: string;
      };

export function applyNativePdfTextReplacements(
    pdfDoc: PDFDocument,
    replacements: NativePdfTextReplacement[],
): NativePdfTextReplacementResult[] {
    const results: NativePdfTextReplacementResult[] = [];
    const byPage = groupByPage(replacements);

    for (const [pageNumber, pageReplacements] of byPage) {
        const page = pdfDoc.getPage(pageNumber - 1);
        const decodedContents = getDecodedPageContents(pdfDoc, pageNumber);
        if (!decodedContents) {
            results.push(
                ...pageReplacements.map((replacement) => ({
                    ...replacement,
                    applied: false,
                    reason: 'unsupported-content-stream',
                })),
            );
            continue;
        }

        const rewrite = rewritePdfContentStreamText(
            bytesToBinaryString(decodedContents),
            pageReplacements,
        );
        results.push(...rewrite.results);

        if (rewrite.changed) {
            const stream = pdfDoc.context.flateStream(
                binaryStringToBytes(rewrite.content),
            );
            page.node.set(PDFName.Contents, pdfDoc.context.register(stream));
        }
    }

    return results;
}

export function rewritePdfContentStreamText(
    content: string,
    replacements: NativePdfTextReplacement[],
) {
    let nextContent = content;
    const results: NativePdfTextReplacementResult[] = [];

    for (const replacement of replacements) {
        const rewrite = rewriteOneReplacement(nextContent, replacement);
        nextContent = rewrite.content;
        results.push(rewrite.result);
    }

    return {
        content: nextContent,
        changed: nextContent !== content,
        results,
    };
}

function rewriteOneReplacement(
    content: string,
    replacement: NativePdfTextReplacement,
) {
    const original = normalizeText(replacement.originalText);
    const replacementText = replacement.replacementText;
    if (!original || normalizeText(replacementText) === original) {
        return {
            content,
            result: {
                ...replacement,
                applied: true,
                reason: 'unchanged',
            },
        };
    }

    const segments = findTextSegments(content);
    const exactMatches = segments.filter(
        (segment) => normalizeText(segment.text) === original,
    );
    const substringMatches = segments.filter(
        (segment) =>
            segment.kind === 'string' &&
            normalizeText(segment.text).includes(original),
    );
    const matches =
        exactMatches.length > 0 ? exactMatches : uniqueBySpan(substringMatches);

    if (matches.length !== 1) {
        return {
            content,
            result: {
                ...replacement,
                applied: false,
                reason:
                    matches.length === 0 ? 'text-not-found' : 'ambiguous-text',
            },
        };
    }

    const match = matches[0];
    if (!match) {
        return {
            content,
            result: {
                ...replacement,
                applied: false,
                reason: 'text-not-found',
            },
        };
    }
    const rewritten =
        match.kind === 'array' || normalizeText(match.text) === original
            ? replaceSpan(
                  content,
                  match.start,
                  match.end,
                  `${encodeLiteralPdfString(replacementText)} Tj`,
              )
            : replaceSpan(
                  content,
                  match.operandStart,
                  match.operandEnd,
                  encodeLiteralPdfString(
                      replaceFirstNormalized(
                          match.text,
                          replacement.originalText,
                          replacementText,
                      ),
                  ),
              );

    return {
        content: rewritten,
        result: {
            ...replacement,
            applied: true,
        },
    };
}

function getDecodedPageContents(pdfDoc: PDFDocument, pageNumber: number) {
    const page = pdfDoc.getPage(pageNumber - 1);
    const contents = page.node.Contents();
    if (!contents) return null;

    const streams: PDFRawStream[] = [];
    if (contents instanceof PDFRawStream) {
        streams.push(contents);
    } else if (contents instanceof PDFArray) {
        for (let index = 0; index < contents.size(); index += 1) {
            const stream = pdfDoc.context.lookup(contents.get(index));
            if (!(stream instanceof PDFRawStream)) return null;
            streams.push(stream);
        }
    } else {
        return null;
    }

    const chunks: Uint8Array[] = [];
    for (const stream of streams) {
        try {
            chunks.push(decodePDFRawStream(stream).decode());
        } catch {
            return null;
        }
    }

    return joinBytes(chunks, 10);
}

function findTextSegments(content: string): TextSegment[] {
    const segments: TextSegment[] = [];
    let index = 0;

    while (index < content.length) {
        const token = parseNextToken(content, index);
        if (!token) {
            index += 1;
            continue;
        }

        const operator = readOperator(content, token.end);
        if (
            token.kind === 'string' &&
            (operator.value === 'Tj' ||
                operator.value === "'" ||
                operator.value === '"')
        ) {
            segments.push({
                start: token.start,
                end: operator.end,
                operandStart: token.start,
                operandEnd: token.end,
                text: token.text,
                kind: 'string',
            });
        } else if (token.kind === 'array' && operator.value === 'TJ') {
            segments.push({
                start: token.start,
                end: operator.end,
                operandStart: token.start,
                operandEnd: token.end,
                text: token.text,
                kind: 'array',
            });
        }

        index = token.end;
    }

    return segments;
}

function parseNextToken(content: string, start: number): ParsedToken | null {
    const char = content[start];
    if (char === '(') return parseLiteralString(content, start);
    if (char === '<' && content[start + 1] !== '<') {
        return parseHexString(content, start);
    }
    if (char === '[') return parseTextArray(content, start);
    return null;
}

function parseLiteralString(content: string, start: number) {
    let depth = 1;
    let index = start + 1;
    let text = '';

    while (index < content.length && depth > 0) {
        const char = content[index];
        if (char === '\\') {
            const escaped = parseEscapedCharacter(content, index);
            text += escaped.value;
            index = escaped.end;
        } else if (char === '(') {
            depth += 1;
            text += char;
            index += 1;
        } else if (char === ')') {
            depth -= 1;
            if (depth > 0) text += char;
            index += 1;
        } else {
            text += char;
            index += 1;
        }
    }

    if (depth !== 0) return null;
    return { kind: 'string' as const, start, end: index, text };
}

function parseEscapedCharacter(content: string, start: number) {
    const char = content[start + 1];
    if (!char) return { value: '', end: start + 1 };
    if (char === 'n') return { value: '\n', end: start + 2 };
    if (char === 'r') return { value: '\r', end: start + 2 };
    if (char === 't') return { value: '\t', end: start + 2 };
    if (char === 'b') return { value: '\b', end: start + 2 };
    if (char === 'f') return { value: '\f', end: start + 2 };
    if (char === '\r' || char === '\n') {
        let end = start + 2;
        if (char === '\r' && content[end] === '\n') end += 1;
        return { value: '', end };
    }
    if (/[0-7]/.test(char)) {
        const match = content.slice(start + 1, start + 4).match(/^[0-7]{1,3}/);
        if (match) {
            return {
                value: String.fromCharCode(parseInt(match[0], 8)),
                end: start + 1 + match[0].length,
            };
        }
    }
    return { value: char, end: start + 2 };
}

function parseHexString(content: string, start: number) {
    const end = content.indexOf('>', start + 1);
    if (end < 0) return null;
    const hex = content.slice(start + 1, end).replace(/\s+/g, '');
    return {
        kind: 'string' as const,
        start,
        end: end + 1,
        text: decodeHexPdfString(hex),
    };
}

function parseTextArray(content: string, start: number) {
    let index = start + 1;
    let text = '';

    while (index < content.length) {
        const char = content[index];
        if (char === ']') {
            return { kind: 'array' as const, start, end: index + 1, text };
        }
        if (char === '(') {
            const token = parseLiteralString(content, index);
            if (!token) return null;
            text += token.text;
            index = token.end;
        } else if (char === '<' && content[index + 1] !== '<') {
            const token = parseHexString(content, index);
            if (!token) return null;
            text += token.text;
            index = token.end;
        } else {
            index += 1;
        }
    }

    return null;
}

function readOperator(content: string, start: number) {
    let index = skipWhitespace(content, start);
    const quote = content[index];
    if (quote === "'" || quote === '"') {
        return { value: quote, end: index + 1 };
    }

    const match = content.slice(index).match(/^[A-Za-z*]+/);
    if (!match) return { value: '', end: index };
    index += match[0].length;
    return { value: match[0], end: index };
}

function skipWhitespace(content: string, start: number) {
    let index = start;
    while (/\s/.test(content[index] ?? '')) index += 1;
    return index;
}

function decodeHexPdfString(hex: string) {
    const padded = hex.length % 2 === 0 ? hex : `${hex}0`;
    const bytes: number[] = [];
    for (let index = 0; index < padded.length; index += 2) {
        bytes.push(parseInt(padded.slice(index, index + 2), 16));
    }

    if (bytes[0] === 0xfe && bytes[1] === 0xff) {
        let text = '';
        for (let index = 2; index < bytes.length; index += 2) {
            text += String.fromCharCode(
                ((bytes[index] ?? 0) << 8) | (bytes[index + 1] ?? 0),
            );
        }
        return text;
    }

    return String.fromCharCode(...bytes);
}

function encodeLiteralPdfString(value: string) {
    return `(${value.replace(/[\\()\r\n]/g, (char) => {
        if (char === '\r') return '\\r';
        if (char === '\n') return '\\n';
        return `\\${char}`;
    })})`;
}

function normalizeText(value: string) {
    return value.replace(/\s+/g, ' ').trim();
}

function replaceFirstNormalized(
    value: string,
    originalText: string,
    replacementText: string,
) {
    const normalizedOriginal = normalizeText(originalText);
    const exactIndex = value.indexOf(originalText);
    if (exactIndex >= 0) {
        return (
            value.slice(0, exactIndex) +
            replacementText +
            value.slice(exactIndex + originalText.length)
        );
    }

    const normalizedIndex = normalizeText(value).indexOf(normalizedOriginal);
    if (normalizedIndex < 0) return replacementText;
    return (
        value.slice(0, normalizedIndex) +
        replacementText +
        value.slice(normalizedIndex + normalizedOriginal.length)
    );
}

function replaceSpan(
    value: string,
    start: number,
    end: number,
    replacement: string,
) {
    return `${value.slice(0, start)}${replacement}${value.slice(end)}`;
}

function uniqueBySpan(segments: TextSegment[]) {
    const seen = new Set<string>();
    return segments.filter((segment) => {
        const key = `${segment.start}:${segment.end}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function groupByPage(replacements: NativePdfTextReplacement[]) {
    const grouped = new Map<number, NativePdfTextReplacement[]>();
    for (const replacement of replacements) {
        const pageNumber = Math.max(1, Math.floor(replacement.pageNumber));
        const pageReplacements = grouped.get(pageNumber) ?? [];
        pageReplacements.push(replacement);
        grouped.set(pageNumber, pageReplacements);
    }
    return grouped;
}

function joinBytes(chunks: Uint8Array[], separator: number) {
    const length =
        chunks.reduce((sum, chunk) => sum + chunk.length, 0) +
        Math.max(0, chunks.length - 1);
    const joined = new Uint8Array(length);
    let offset = 0;
    chunks.forEach((chunk, index) => {
        if (index > 0) {
            joined[offset] = separator;
            offset += 1;
        }
        joined.set(chunk, offset);
        offset += chunk.length;
    });
    return joined;
}

function bytesToBinaryString(bytes: Uint8Array) {
    let value = '';
    for (let index = 0; index < bytes.length; index += 1) {
        value += String.fromCharCode(bytes[index] ?? 0);
    }
    return value;
}

function binaryStringToBytes(value: string) {
    const bytes = new Uint8Array(value.length);
    for (let index = 0; index < value.length; index += 1) {
        bytes[index] = value.charCodeAt(index) & 0xff;
    }
    return bytes;
}
