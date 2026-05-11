import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { WidgetSkeleton } from '@/features/widgets/components/WidgetSkeleton';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';

const JournalWidget = lazy(() => import('@/widgets/JournalWidget'));
const EmailWidget = lazy(() => import('@/widgets/EmailWidget'));
const SoberWidget = lazy(() => import('@/widgets/RecoveryWidget'));
const UnitConverterWidget = lazy(() => import('@/widgets/UnitConvertWidget'));
const EmptyRecovery = lazy(
    () => import('@/features/dashboard/components/EmptyRecovery'),
);
const ChessWidget = lazy(() => import('@/widgets/ChessWidget'));
const PomodoroWidget = lazy(() => import('@/widgets/PomodoroWidget'));
const TodoWidget = lazy(() => import('@/widgets/TodoWidget'));
const WeatherWidget = lazy(() => import('@/widgets/WeatherWidget'));
const WorldClockWidget = lazy(() => import('@/widgets/WorldClockWidget'));
const CurrencyWidget = lazy(() => import('@/widgets/CurrencyWidget'));
const MoodWidget = lazy(() => import('@/widgets/MoodWidget'));
const HabitWidget = lazy(() => import('@/widgets/HabitWidget'));
const ScratchpadWidget = lazy(() => import('@/widgets/ScratchpadWidget'));
const CountdownWidget = lazy(() => import('@/widgets/CountdownWidget'));
const CalendarWidget = lazy(() => import('@/widgets/CalendarWidget'));
const FormFillerWidget = lazy(() => import('@/widgets/FormFillerWidget'));

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
