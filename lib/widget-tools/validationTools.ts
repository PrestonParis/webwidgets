// Widget definition validation helpers and text/NLP stubs

export interface ValidationResult {
    valid: boolean;
    issues: string[];
    warnings: string[];
}

export function validateRequired(
    obj: Record<string, unknown>,
    fields: string[],
): string[] {
    return fields
        .filter((f) => obj[f] === undefined || obj[f] === null || obj[f] === '')
        .map((f) => `${f} is required`);
}

export function validateStringLength(
    value: string,
    field: string,
    min = 1,
    max = 1000,
): string[] {
    const issues: string[] = [];
    if (value.length < min)
        issues.push(`${field} must be at least ${min} characters`);
    if (value.length > max)
        issues.push(`${field} must be ${max} characters or fewer`);
    return issues;
}

export function validateNumberRange(
    value: number,
    field: string,
    min: number,
    max: number,
): string[] {
    const issues: string[] = [];
    if (value < min) issues.push(`${field} must be at least ${min}`);
    if (value > max) issues.push(`${field} must be at most ${max}`);
    return issues;
}

export function validateEnum<T extends string>(
    value: unknown,
    field: string,
    allowed: T[],
): value is T {
    return allowed.includes(value as T);
}

export function validateArrayItems<T>(
    items: T[],
    field: string,
    validator: (item: T, index: number) => string[],
): string[] {
    return items.flatMap((item, i) =>
        validator(item, i).map((msg) => `${field}[${i}]: ${msg}`),
    );
}

export function sanitizeWidgetName(raw: string): string {
    return raw
        .trim()
        .replace(/[<>{}[\]]/g, '')
        .slice(0, 60);
}

export function sanitizeWidgetDescription(raw: string): string {
    return raw
        .trim()
        .replace(/[<>{}]/g, '')
        .slice(0, 500);
}

export function sanitizeTag(raw: string): string {
    return raw
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-_]/g, '')
        .slice(0, 30);
}

export function sanitizeTags(raw: string[]): string[] {
    return raw
        .map(sanitizeTag)
        .filter((t) => t.length > 0)
        .slice(0, 10);
}

// NLP/text stubs — architecture-ready for future ML routing

export function summarizeText(text: string, _maxSentences = 3): string {
    const sentences = text
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);
    return (
        sentences.slice(0, _maxSentences).join('. ') +
        (sentences.length > 0 ? '.' : '')
    );
}

export function classifyText(_text: string): {
    label: string;
    confidence: number;
} {
    // Stub: ready for ML classification service
    return { label: 'general', confidence: 0.5 };
}

export function extractEntities(
    _text: string,
): Array<{ text: string; type: string }> {
    // Stub: ready for NER service
    return [];
}

export function extractKeywords(text: string): string[] {
    const stopwords = new Set([
        'the',
        'is',
        'in',
        'at',
        'on',
        'for',
        'and',
        'or',
        'a',
        'an',
        'to',
        'of',
        'with',
        'this',
        'that',
    ]);
    return text
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3 && !stopwords.has(w))
        .slice(0, 10);
}

export function detectSentiment(
    _text: string,
): 'positive' | 'neutral' | 'negative' {
    // Stub: ready for sentiment analysis service
    return 'neutral';
}

export function combineValidationResults(
    ...results: ValidationResult[]
): ValidationResult {
    return {
        valid: results.every((r) => r.valid),
        issues: results.flatMap((r) => r.issues),
        warnings: results.flatMap((r) => r.warnings),
    };
}

export function buildValidationResult(
    issues: string[],
    warnings: string[] = [],
): ValidationResult {
    return { valid: issues.length === 0, issues, warnings };
}
