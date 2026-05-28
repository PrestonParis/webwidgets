function str(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function num(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
}

function positive(value: unknown): number | undefined {
    const parsed = num(value);
    return parsed !== undefined && parsed > 0 ? parsed : undefined;
}

function stringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.filter(
            (item): item is string =>
                typeof item === 'string' && item.trim() !== '',
        );
    }
    if (typeof value === 'string' && value.trim()) {
        return value
            .split(/[,;]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
}

export { str, num, positive, stringArray };
