'use client';

import { useState } from 'react';
import { CheckSquare, Flame } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useTodoWidget } from '@/features/todo/hooks/useTodoWidget';
import { TodoForm } from '@/features/todo/components/TodoForm';
import { TodoList } from '@/features/todo/components/TodoList';
import { HabitSection } from '@/features/todo/components/HabitSection';
import { cn } from '@/lib/utils/utils';

type Tab = 'tasks' | 'habits';

const TABS: { value: Tab; label: string; icon: typeof CheckSquare }[] = [
    { value: 'tasks', label: 'Tasks', icon: CheckSquare },
    { value: 'habits', label: 'Habits', icon: Flame },
];

export default function TodoWidget() {
    const { settings, updateSettings } = useWidgetSettings('todo', 'todo');
    const [tab, setTab] = useState<Tab>('tasks');
    const {
        input,
        setInput,
        inputRef,
        handleSubmit,
        loading,
        visible,
        overflow,
        toggleTodo,
        deleteTodo,
    } = useTodoWidget();

    return (
        <WidgetShell
            icon={
                tab === 'habits' ? (
                    <Flame size={16} />
                ) : (
                    <CheckSquare size={16} />
                )
            }
            title={tab === 'habits' ? 'Habits' : 'To-Do'}
            settings={settings}
            onSettingsChange={updateSettings}
            widgetType="todo"
            widgetId="todo"
            footerHref="/todo"
            footerLabel="Open todos →"
        >
            {/* Tab bar */}
            <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-zinc-800/80 rounded-lg p-0.5 mb-4">
                {TABS.map(({ value, label }) => (
                    <button
                        key={value}
                        onClick={() => setTab(value)}
                        className={cn(
                            'flex-1 text-[11px] font-medium py-1 rounded-md transition-all',
                            tab === value
                                ? 'bg-white dark:bg-zinc-700 text-stone-800 dark:text-zinc-100 shadow-sm'
                                : 'text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300',
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className={tab === 'tasks' ? 'block' : 'hidden'}>
                <TodoForm
                    input={input}
                    onChange={setInput}
                    onSubmit={(e) => {
                        void handleSubmit(e);
                    }}
                    inputRef={inputRef}
                />
                <TodoList
                    todos={visible}
                    loading={loading}
                    overflow={overflow}
                    onToggle={(id) => {
                        void toggleTodo(id);
                    }}
                    onDelete={(id) => {
                        void deleteTodo(id);
                    }}
                />
            </div>

            <div className={tab === 'habits' ? 'block' : 'hidden'}>
                <HabitSection />
            </div>
        </WidgetShell>
    );
}
