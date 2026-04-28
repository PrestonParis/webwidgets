export const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const snapMinute = (m: number) => Math.round(m / 5) * 5;

export function getMonthMeta(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return { firstDay, daysInMonth };
}

export function to24Hour(hour: number, minute: number, ampm: 'AM' | 'PM') {
    return ampm === 'PM'
        ? hour === 12
            ? 12
            : hour + 12
        : hour === 12
          ? 0
          : hour;
}
