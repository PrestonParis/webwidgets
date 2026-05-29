import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { WidgetSkeleton } from '@/features/widgets/components/WidgetSkeleton';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';

const TextEditorWidget = lazy(
    () => import('@/features/texteditor/components/TextEditorWidget'),
);
const ResearchQueueWidget = lazy(
    () => import('@/features/research/components/ResearchQueueWidget'),
);
const AutomationWidget = lazy(
    () => import('@/features/automation/components/AutomationWidget'),
);
const DeveloperWidget = lazy(
    () => import('@/features/developer/components/DeveloperWidget'),
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
const CountdownWidget = lazy(
    () => import('@/features/countdown/components/CountdownWidget'),
);
const CurrencyWidget = lazy(
    () => import('@/features/currency/components/CurrencyWidget'),
);
const EmptyRecovery = lazy(
    () => import('@/features/dashboard/components/EmptyRecovery'),
);
const ChessWidget = lazy(
    () => import('@/features/chess/components/ChessWidget'),
);
const TimekeepingWidget = lazy(
    () => import('@/features/timekeeping/components/TimekeepingWidget'),
);
const EmployeeClockWidget = lazy(
    () => import('@/features/timekeeping/components/EmployeeClockWidget'),
);
const TimerWidget = lazy(
    () => import('@/features/timekeeping/components/TimerWidget'),
);
const StopwatchWidget = lazy(
    () => import('@/features/timekeeping/components/StopwatchWidget'),
);
const PomodoroWidget = lazy(
    () => import('@/features/pomodoro/components/PomodoroWidget'),
);
const TodoWidget = lazy(() => import('@/features/todo/components/TodoWidget'));
const HabitWidget = lazy(
    () => import('@/features/habit/components/HabitWidget'),
);
const WeatherWidget = lazy(
    () => import('@/features/weather/components/WeatherWidget'),
);
const WorldClockWidget = lazy(
    () => import('@/features/worldclock/components/WorldClockWidget'),
);
const JournalWidget = lazy(
    () => import('@/features/journal/components/JournalWidget'),
);
const NotesWidget = lazy(
    () => import('@/features/texteditor/components/NotesWidget'),
);
const CalendarWidget = lazy(
    () => import('@/features/calendar/components/CalendarWidget'),
);
const FormFillerWidget = lazy(
    () => import('@/features/form-filler/components/FormFillerWidget'),
);
const TrackingWidget = lazy(
    () => import('@/features/tracking/components/TrackingWidget'),
);
const SleepWidget = lazy(
    () => import('@/features/tracking/components/widgets/SleepWidget'),
);
const WorkoutWidget = lazy(
    () => import('@/features/tracking/components/widgets/WorkoutWidget'),
);
const MealWidget = lazy(
    () => import('@/features/tracking/components/widgets/MealWidget'),
);
const MoodTrackingWidget = lazy(
    () => import('@/features/tracking/components/widgets/MoodTrackingWidget'),
);
const ContextDiagramWidget = lazy(
    () => import('@/features/context/components/ContextDiagramWidget'),
);
const ChatWidget = lazy(
    () => import('@/features/chatbot/components/ChatWidget'),
);
const SupplementWidget = lazy(
    () => import('@/features/tracking/components/widgets/SupplementWidget'),
);
const HealthWidget = lazy(
    () => import('@/features/tracking/components/widgets/HealthWidget'),
);
const FinanceWidget = lazy(
    () => import('@/features/finance/components/FinanceWidget'),
);
const WidgetBuilderShellWidget = lazy(
    () => import('@/features/widgets/builder/WidgetBuilderShellWidget'),
);
const FilesWidget = lazy(
    () => import('@/features/uploads/components/FilesWidget'),
);
const ReadingWidget = lazy(
    () => import('@/features/reading/components/ReadingWidget'),
);
const NewsWidget = lazy(() => import('@/features/news/components/NewsWidget'));
const ViewWidget = lazy(() => import('@/features/view/components/ViewWidget'));
const CollaborationWidget = lazy(
    () => import('@/features/collaboration/components/CollaborationWidget'),
);
const AccessibilityWidget = lazy(
    () => import('@/features/accessibility/components/AccessibilityWidget'),
);
const MemorizationWidget = lazy(
    () => import('@/features/memorization/components/MemorizationWidget'),
);
const CreativeWidget = lazy(
    () => import('@/features/creative/components/CreativeWidget'),
);
const InsightCardsWidget = lazy(
    () => import('@/features/dashboard/components/InsightCardsWidget'),
);
const CalculatorWidget = lazy(
    () => import('@/features/calculator/components/CalculatorWidget'),
);

function wrap(node: ReactNode): ReactNode {
    return <Suspense fallback={<WidgetSkeleton />}>{node}</Suspense>;
}

export function renderWidgetContent(
    config: WidgetConfig,
    onReset: (id: string, newStart: string) => void,
): ReactNode {
    switch (config.type) {
        case 'texteditor':
            return wrap(<TextEditorWidget />);
        case 'research-queue':
            return wrap(<ResearchQueueWidget widgetId={config.id} />);
        case 'automation':
            return wrap(<AutomationWidget widgetId={config.id} />);
        case 'developer':
            return wrap(<DeveloperWidget widgetId={config.id} />);
        case 'email':
            return wrap(<EmailWidget />);
        case 'recovery': {
            const tracker = config.props?.tracker;
            if (!tracker) return wrap(<EmptyRecovery />);
            return wrap(<SoberWidget tracker={tracker} onReset={onReset} />);
        }
        case 'recovery-empty':
            return wrap(<EmptyRecovery />);
        case 'converter':
            return wrap(<UnitConverterWidget />);
        case 'countdown':
            return wrap(<CountdownWidget />);
        case 'currency':
            return wrap(<CurrencyWidget />);
        case 'chess':
            return wrap(<ChessWidget />);
        case 'timekeeping':
            return wrap(<TimekeepingWidget />);
        case 'employee-clock':
            return wrap(<EmployeeClockWidget />);
        case 'timer':
            return wrap(<TimerWidget />);
        case 'stopwatch':
            return wrap(<StopwatchWidget />);
        case 'pomodoro':
            return wrap(<PomodoroWidget />);
        case 'todo':
            return wrap(<TodoWidget />);
        case 'habit':
            return wrap(<HabitWidget />);
        case 'weather':
            return wrap(<WeatherWidget widgetId={config.id} />);
        case 'worldclock':
            return wrap(<WorldClockWidget />);
        case 'journal':
            return wrap(<JournalWidget />);
        case 'notes':
        case 'scratchpad':
            return wrap(<NotesWidget />);
        case 'calendar':
            return wrap(<CalendarWidget />);
        case 'form-filler':
            return wrap(<FormFillerWidget />);
        case 'tracking':
            return wrap(<TrackingWidget />);
        case 'tracking-sleep':
            return wrap(<SleepWidget />);
        case 'tracking-workout':
            return wrap(<WorkoutWidget />);
        case 'tracking-meal':
            return wrap(<MealWidget />);
        case 'tracking-mood':
            return wrap(<MoodTrackingWidget />);
        case 'tracking-supplements':
            return wrap(<SupplementWidget />);
        case 'tracking-health':
            return wrap(<HealthWidget />);
        case 'context-diagram':
            return wrap(<ContextDiagramWidget widgetId={config.id} />);
        case 'chat':
            return wrap(<ChatWidget widgetId={config.id} />);
        case 'finance':
            return wrap(<FinanceWidget widgetId={config.id} />);
        case 'widget-builder':
            return wrap(<WidgetBuilderShellWidget widgetId={config.id} />);
        case 'files':
            return wrap(<FilesWidget />);
        case 'reading':
            return wrap(<ReadingWidget widgetId={config.id} />);
        case 'news':
            return wrap(<NewsWidget widgetId={config.id} />);
        case 'view':
            return wrap(<ViewWidget widgetId={config.id} />);
        case 'collaboration':
            return wrap(<CollaborationWidget widgetId={config.id} />);
        case 'accessibility':
            return wrap(<AccessibilityWidget widgetId={config.id} />);
        case 'memorization':
            return wrap(<MemorizationWidget widgetId={config.id} />);
        case 'creative':
            return wrap(<CreativeWidget widgetId={config.id} />);
        case 'insight-cards':
            return wrap(<InsightCardsWidget widgetId={config.id} />);
        case 'calculator':
            return wrap(<CalculatorWidget widgetId={config.id} />);
        case 'folder':
            return null;
        default:
            return null;
    }
}
