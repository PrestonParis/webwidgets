import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { WidgetSkeleton } from '@/features/widgets/components/WidgetSkeleton';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';

const JournalWidget = lazy(
    () => import('@/features/journal/components/JournalWidget'),
);
const EmailWidget = lazy(
    () => import('@/features/inbox/components/EmailWidget'),
);
const SoberWidget = lazy(
    () => import('@/features/recovery/components/RecoveryWidget'),
);
const UnitConverterWidget = lazy(
    () => import('@/features/convert/components/UnitConvertWidget'),
);
const EmptyRecovery = lazy(
    () => import('@/features/dashboard/components/EmptyRecovery'),
);
const ChessWidget = lazy(
    () => import('@/features/chess/components/ChessWidget'),
);
const PomodoroWidget = lazy(
    () => import('@/features/pomodoro/components/PomodoroWidget'),
);
const TodoWidget = lazy(() => import('@/features/todo/components/TodoWidget'));
const WeatherWidget = lazy(
    () => import('@/features/weather/components/WeatherWidget'),
);
const WorldClockWidget = lazy(
    () => import('@/features/worldclock/components/WorldClockWidget'),
);
const CurrencyWidget = lazy(
    () => import('@/features/currency/components/CurrencyWidget'),
);
const MoodWidget = lazy(() => import('@/features/mood/components/MoodWidget'));
const HabitWidget = lazy(
    () => import('@/features/habit/components/HabitWidget'),
);
const ScratchpadWidget = lazy(
    () => import('@/features/scratchpad/components/ScratchpadWidget'),
);
const CountdownWidget = lazy(
    () => import('@/features/countdown/components/CountdownWidget'),
);
const CalendarWidget = lazy(
    () => import('@/features/calendar/components/CalendarWidget'),
);
const FormFillerWidget = lazy(
    () => import('@/features/form-filler/components/FormFillerWidget'),
);

function wrap(node: ReactNode): ReactNode {
    return <Suspense fallback={<WidgetSkeleton />}>{node}</Suspense>;
}

export function renderWidgetContent(
    config: WidgetConfig,
    onReset: (id: string, newStart: string) => void,
): ReactNode {
    switch (config.type) {
        case 'journal':
            return wrap(<JournalWidget />);
        case 'email':
            return wrap(<EmailWidget />);
        case 'recovery': {
            const tracker = config.props?.tracker;
            if (!tracker) return null;
            return wrap(<SoberWidget tracker={tracker} onReset={onReset} />);
        }
        case 'recovery-empty':
            return wrap(<EmptyRecovery />);
        case 'converter':
            return wrap(<UnitConverterWidget />);
        case 'chess':
            return wrap(<ChessWidget />);
        case 'pomodoro':
            return wrap(<PomodoroWidget />);
        case 'todo':
            return wrap(<TodoWidget />);
        case 'weather':
            return wrap(<WeatherWidget />);
        case 'worldclock':
            return wrap(<WorldClockWidget />);
        case 'currency':
            return wrap(<CurrencyWidget />);
        case 'mood':
            return wrap(<MoodWidget />);
        case 'habit':
            return wrap(<HabitWidget />);
        case 'scratchpad':
            return wrap(<ScratchpadWidget />);
        case 'countdown':
            return wrap(<CountdownWidget />);
        case 'calendar':
            return wrap(<CalendarWidget />);
        case 'form-filler':
            return wrap(<FormFillerWidget />);
        case 'folder':
            return null;
        default:
            return null;
    }
}
