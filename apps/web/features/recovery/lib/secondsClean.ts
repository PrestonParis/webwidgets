export function calcSecondsClean(nowMs: number, startTime: string): number {
    return Math.max(
        0,
        Math.floor((nowMs - new Date(startTime).getTime()) / 1000),
    );
}
