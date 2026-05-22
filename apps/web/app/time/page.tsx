import type { TimekeepingMode } from '@/features/widgets/types/widgets';
import Header from '@/features/ui/components/Header';
import { TimekeepingPage } from '@/features/timekeeping/components/TimekeepingPage';

export const metadata = { title: 'Time' };

const VALID_MODES: TimekeepingMode[] = [
    'timer',
    'pomodoro',
    'stopwatch',
    'countdown',
    'worldclock',
];

function toMode(raw: string | undefined): TimekeepingMode {
    return VALID_MODES.includes(raw as TimekeepingMode)
        ? (raw as TimekeepingMode)
        : 'timer';
}

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ mode?: string }>;
}) {
    const params = await searchParams;
    const mode = toMode(params.mode);

    return (
        <>
            <Header />
            <TimekeepingPage initialMode={mode} />
        </>
    );
}
