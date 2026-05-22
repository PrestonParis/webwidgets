export function getTimeLeft(targetDate: string): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
} | null {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    const seconds = Math.floor((diff % 60_000) / 1_000);
    return { days, hours, minutes, seconds };
}
