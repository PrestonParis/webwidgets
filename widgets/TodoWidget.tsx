'use client';

import { CheckSquare } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useTodoWidget } from '@/features/todo/hooks/useTodoWidget';
import { TodoForm } from '@/features/todo/components/TodoForm';
import { TodoList } from '@/features/todo/components/TodoList';

export default function TodoWidget() {
    const { settings, updateSettings } = useWidgetSettings('todo', 'todo');
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
            icon={<CheckSquare size={16} />}
            title="To-Do"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetType="todo"
            widgetId="todo"
        >
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
        </WidgetShell>
    );
}
