export function formatTime(seconds: number) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
}

export function cleanDate(date: string) {
    // Wed, 18 Mar 2026 21:24:20 +0000 -> Wed, Mar 18, 2026, 05:24 PM
    return new Date(date).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

export function getTimeParts(totalSeconds: number) {
    const SECONDS_IN_DAY = 86400;
    const SECONDS_IN_MONTH = 2629746; // Avg (30.44 days)
    const SECONDS_IN_YEAR = 31557600; // Avg (365.25 days)

    const years = Math.floor(totalSeconds / SECONDS_IN_YEAR);
    let remainder = totalSeconds % SECONDS_IN_YEAR;

    const months = Math.floor(remainder / SECONDS_IN_MONTH);
    remainder %= SECONDS_IN_MONTH;

    const days = Math.floor(remainder / SECONDS_IN_DAY);
    remainder %= SECONDS_IN_DAY;

    const hours = Math.floor(remainder / 3600);
    const minutes = Math.floor((remainder % 3600) / 60);
    const seconds = remainder % 60;

    return {
        years,
        months,
        days,
        hours,
        minutes,
        seconds,
    };
}
