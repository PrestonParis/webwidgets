import { useTick } from '@/lib/tick';
import { calcSecondsClean } from '@/features/recovery/lib/secondsClean';

export function useSecondsClean(startTime: string | null): number {
    const now = useTick();
    if (!startTime) return 0;
    return calcSecondsClean(now, startTime);
}
