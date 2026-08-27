const isoDatePattern = /\b(20\d{2})-(\d{2})-(\d{2})\b/;
const slashDatePattern = /\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/;

function atLocalNoon(year: number, month: number, day: number) {
    return new Date(Date.UTC(year, month - 1, day, 17)).toISOString();
}

export function normalizeDatedText(text: string, occurredAt: string) {
    const iso = text.match(isoDatePattern);
    if (iso) return atLocalNoon(Number(iso[1]), Number(iso[2]), Number(iso[3]));
    const slash = text.match(slashDatePattern);
    if (slash)
        return atLocalNoon(
            Number(slash[3]),
            Number(slash[1]),
            Number(slash[2]),
        );
    if (/\btomorrow\b/i.test(text)) {
        const date = new Date(occurredAt);
        date.setUTCDate(date.getUTCDate() + 1);
        date.setUTCHours(17, 0, 0, 0);
        return date.toISOString();
    }
    return null;
}

export function isFuture(value: string, now: string) {
    return Date.parse(value) > Date.parse(now) - 3_600_000;
}
