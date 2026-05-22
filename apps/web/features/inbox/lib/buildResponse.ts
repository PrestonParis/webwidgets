type ParsedEmail = { id: string; [key: string]: unknown };
type CategoryEntry = { category: string; is_manual: boolean };

export function buildEmailResponse(
    parsed: ParsedEmail[],
    categoryMap: Map<string, CategoryEntry>,
) {
    return parsed.map((e) => {
        const hit = categoryMap.get(e.id);
        return {
            ...e,
            category: hit?.category ?? 'other',
            is_manual: hit?.is_manual ?? false,
        };
    });
}
