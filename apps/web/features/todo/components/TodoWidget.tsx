'use client';

import { useRef, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useWidgetData } from '@/features/dashboard/runtime/useWidgetData';
import { useTodoMutations } from '@/features/todo/hooks/useTodoMutations';
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from '@/features/ui/components/Modal';
import { cn } from '@/lib/utils/utils';
import { WidgetImportExportControls } from '@/features/import-export/components/WidgetImportExportControls';

const MAX_INCOMPLETE = 5;
const MAX_COMPLETED = 2;

// Adapter payload row shape (from todosAdapter)
interface TodoRow {
    id: string;
    text: string;
    completed: boolean;
    created_at: string;
    completed_at: string;
}

export default function TodoWidget() {
    const { settings, updateSettings } = useWidgetSettings('todo', 'todo');
    const { payload, loading } = useWidgetData('todo', 'todo');
    const { addTodo, toggleTodo, deleteTodo, updateTodo } = useTodoMutations();

    const [input, setInput] = useState('');
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const editRef = useRef<HTMLInputElement>(null);

    // Extract todos from the adapter payload
    const todos: TodoRow[] = (
        (payload?.sources['todos']?.data as TodoRow[] | null) ?? []
    ).filter((r): r is TodoRow => r != null);

    const incomplete = todos.filter((t) => !t.completed);
    const completed = todos.filter((t) => t.completed);
    const total = todos.length;
    const doneCount = completed.length;
    const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    const visibleIncomplete = incomplete.slice(0, MAX_INCOMPLETE);
    const visibleCompleted = completed.slice(0, MAX_COMPLETED);
    const overflow =
        Math.max(0, incomplete.length - MAX_INCOMPLETE) +
        Math.max(0, completed.length - MAX_COMPLETED);

    const pendingTodo = todos.find((t) => t.id === pendingDeleteId);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim()) return;
        await addTodo(input.trim());
        setInput('');
        inputRef.current?.focus();
    }

    function startEdit(id: string, text: string) {
        setEditingId(id);
        setEditText(text);
        setTimeout(() => editRef.current?.select(), 0);
    }

    async function commitEdit() {
        if (editingId && editText.trim()) await updateTodo(editingId, editText);
        setEditingId(null);
    }

    return (
        <WidgetShell
            icon={<Check size={14} />}
            title="To-Do"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetType="todo"
            widgetId="todo"
            footerHref="/planning"
            footerLabel="Open Planning →"
            headerActionsSlot={
                <WidgetImportExportControls
                    sourceType="todos"
                    displayName="Todos"
                />
            }
        >
            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-5 bg-stone-100 dark:bg-zinc-800 rounded animate-pulse"
                        />
                    ))}
                </div>
            ) : (
                <>
                    {/* Progress bar — only when there are tasks */}
                    {total > 0 && (
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                                    {doneCount} of {total} done
                                </span>
                                <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400">
                                    {progressPct}%
                                </span>
                            </div>
                            <div className="h-0.75 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Compact inline input */}
                    <form
                        onSubmit={(e) => void handleSubmit(e)}
                        className="mb-2.5"
                    >
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800/60 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-colors">
                            <Plus
                                size={11}
                                className="text-zinc-400 shrink-0"
                            />
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Add a task…"
                                className="flex-1 text-xs bg-transparent outline-none text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                            />
                        </div>
                    </form>

                    {/* Empty state */}
                    {visibleIncomplete.length === 0 &&
                        visibleCompleted.length === 0 && (
                            <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 py-3">
                                All clear, nothing to do!
                            </p>
                        )}

                    {/* Incomplete tasks */}
                    {visibleIncomplete.length > 0 && (
                        <ul className="space-y-px mb-1">
                            {visibleIncomplete.map((todo) => (
                                <li
                                    key={todo.id}
                                    className="group flex items-center gap-2 px-1 py-1 rounded-md hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors"
                                >
                                    <button
                                        onClick={() =>
                                            void toggleTodo(
                                                todo.id,
                                                todo.completed,
                                            )
                                        }
                                        className="w-3.5 h-3.5 shrink-0 rounded border-2 border-stone-300 dark:border-zinc-600 hover:border-indigo-400 transition-colors"
                                    />
                                    {editingId === todo.id ? (
                                        <input
                                            ref={editRef}
                                            value={editText}
                                            onChange={(e) =>
                                                setEditText(e.target.value)
                                            }
                                            onBlur={() => void commitEdit()}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter')
                                                    void commitEdit();
                                                if (e.key === 'Escape')
                                                    setEditingId(null);
                                            }}
                                            className="flex-1 text-xs bg-transparent outline-none border-b border-indigo-400 text-zinc-700 dark:text-zinc-300"
                                        />
                                    ) : (
                                        <span
                                            className="flex-1 text-xs truncate text-zinc-700 dark:text-zinc-300 cursor-text"
                                            onDoubleClick={() =>
                                                startEdit(todo.id, todo.text)
                                            }
                                        >
                                            {todo.text}
                                        </span>
                                    )}
                                    <button
                                        onClick={() =>
                                            setPendingDeleteId(todo.id)
                                        }
                                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                                    >
                                        <X size={10} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Completed tasks — compressed below a divider */}
                    {visibleCompleted.length > 0 && (
                        <>
                            <div className="border-t border-stone-100 dark:border-zinc-800 my-1.5" />
                            <ul className="space-y-px">
                                {visibleCompleted.map((todo) => (
                                    <li
                                        key={todo.id}
                                        className="flex items-center gap-2 px-1 py-0.5"
                                    >
                                        <button
                                            onClick={() =>
                                                void toggleTodo(
                                                    todo.id,
                                                    todo.completed,
                                                )
                                            }
                                            className="w-3.5 h-3.5 shrink-0 rounded bg-indigo-500 border-2 border-indigo-500 flex items-center justify-center transition-colors"
                                        >
                                            <Check
                                                size={9}
                                                className="text-white"
                                            />
                                        </button>
                                        <span className="flex-1 text-[11px] truncate line-through text-zinc-400 dark:text-zinc-600">
                                            {todo.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    {overflow > 0 && (
                        <p
                            className={cn(
                                'text-[10px] text-center text-zinc-400 dark:text-zinc-600',
                                visibleCompleted.length > 0 ? 'mt-1.5' : 'mt-2',
                            )}
                        >
                            +{overflow} more
                        </p>
                    )}
                </>
            )}

            {/* Delete confirmation */}
            <Modal
                open={pendingDeleteId !== null}
                onClose={() => setPendingDeleteId(null)}
                size="sm"
                aria-labelledby="widget-todo-delete-title"
            >
                <ModalHeader
                    id="widget-todo-delete-title"
                    title="Delete task?"
                    onClose={() => setPendingDeleteId(null)}
                />
                <ModalBody>
                    <p className="text-sm text-stone-600 dark:text-zinc-400">
                        {pendingTodo ? (
                            <>
                                <span className="font-medium text-stone-800 dark:text-zinc-200">
                                    &ldquo;{pendingTodo.text}&rdquo;
                                </span>{' '}
                                will be permanently deleted.
                            </>
                        ) : (
                            'This task will be permanently deleted.'
                        )}
                    </p>
                </ModalBody>
                <ModalFooter>
                    <button
                        onClick={() => setPendingDeleteId(null)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (pendingDeleteId) {
                                void deleteTodo(pendingDeleteId);
                                setPendingDeleteId(null);
                            }
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                    >
                        Delete
                    </button>
                </ModalFooter>
            </Modal>
        </WidgetShell>
    );
}
