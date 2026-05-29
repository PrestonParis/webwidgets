'use client';

import { useState, useRef } from 'react';
import { CheckSquare, Flame } from 'lucide-react';
import { useTodos } from '@/features/todo/hooks/useTodos';
import { TodoForm } from '@/features/todo/components/TodoForm';
import { TodoList } from '@/features/todo/components/TodoList';
import { HabitSection } from '@/features/todo/components/HabitSection';
import { cn } from '@/lib/utils/utils';

type Tab = 'tasks' | 'habits';

export function TodoPage() {
    const [tab, setTab] = useState<Tab>('tasks');
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const { todos, loading, addTodo, toggleTodo, deleteTodo } = useTodos();

    const incomplete = todos.filter((t) => !t.completed);
    const completed = todos.filter((t) => t.completed);
    const visible = [...incomplete, ...completed];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim()) return;
        await addTodo(input);
        setInput('');
        inputRef.current?.focus();
    };

    return (
        <main className="max-w-2xl mx-auto px-6 py-8 lg:px-12">
            <div className="flex items-center gap-3 mb-8">
                {tab === 'habits' ? (
                    <Flame size={22} className="text-orange-500" />
                ) : (
                    <CheckSquare size={22} className="text-indigo-500" />
                )}
                <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100">
                    {tab === 'habits' ? 'Habits' : 'To-Do'}
                </h1>
            </div>

            {/* Tab bar */}
            <div className="flex gap-0.5 bg-stone-100 dark:bg-zinc-800/80 rounded-xl p-1 mb-6">
                {(['tasks', 'habits'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cn(
                            'flex-1 text-sm font-medium py-1.5 rounded-lg transition-all',
                            tab === t
                                ? 'bg-white dark:bg-zinc-700 text-stone-800 dark:text-zinc-100 shadow-sm'
                                : 'text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300',
                        )}
                    >
                        {t === 'tasks' ? 'Tasks' : 'Habits'}
                    </button>
                ))}
            </div>

            {tab === 'tasks' && (
                <div className="space-y-4">
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
                        overflow={0}
                        onToggle={(id) => {
                            void toggleTodo(id);
                        }}
                        onDelete={(id) => {
                            void deleteTodo(id);
                        }}
                    />
                </div>
            )}

            {tab === 'habits' && <HabitSection />}
        </main>
    );
}
