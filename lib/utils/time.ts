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
    const SECONDS_IN_MONTH = 2629746;
    const SECONDS_IN_YEAR = 31557600;

    const years = Math.floor(totalSeconds / SECONDS_IN_YEAR);
    let remainder = totalSeconds % SECONDS_IN_YEAR;
    const months = Math.floor(remainder / SECONDS_IN_MONTH);
    remainder %= SECONDS_IN_MONTH;
    const days = Math.floor(remainder / SECONDS_IN_DAY);
    remainder %= SECONDS_IN_DAY;
    const hours = Math.floor(remainder / 3600);
    const minutes = Math.floor((remainder % 3600) / 60);
    const seconds = remainder % 60;

    return { years, months, days, hours, minutes, seconds };
}

// Exact calendar-based breakdown — avoids month drift from average-second approximation
export function getExactTimeParts(startIso: string) {
    const start = new Date(startIso);
    const now = new Date();

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
        months--;
        days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    const totalSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
    const daySeconds = totalSeconds % 86400;
    const hours = Math.floor(daySeconds / 3600);
    const minutes = Math.floor((daySeconds % 3600) / 60);
    const seconds = daySeconds % 60;

    return { years, months, days, hours, minutes, seconds };
}

export const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const snapMinute = (m: number) => Math.round(m / 5) * 5;

export function getMonthMeta(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return { firstDay, daysInMonth };
}

export function to24Hour(hour: number, ampm: 'AM' | 'PM') {
    return ampm === 'PM'
        ? hour === 12
            ? 12
            : hour + 12
        : hour === 12
          ? 0
          : hour;
}
