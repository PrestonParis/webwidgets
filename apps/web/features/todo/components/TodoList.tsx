import { useState } from 'react';
import { CheckSquare, X } from 'lucide-react';
import { Checkmark } from '@/icons/CheckMark';
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from '@/features/ui/components/Modal';
import { TodoListProps } from '@/features/todo/types/todo';

export function TodoList({
    todos,
    loading,
    overflow,
    onToggle,
    onDelete,
}: TodoListProps) {
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const pendingTodo = todos.find((t) => t.id === pendingDeleteId);
    if (loading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-8 bg-stone-100 dark:bg-zinc-800 rounded-lg animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (todos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-6 text-stone-400 dark:text-zinc-600">
                <CheckSquare size={28} className="mb-2 opacity-40" />
                <p className="text-xs">All clear — nothing to do!</p>
            </div>
        );
    }

    return (
        <>
            <ul className="space-y-1">
                {todos.map((todo) => (
                    <li
                        key={todo.id}
                        className="group flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                        <button
                            onClick={() => onToggle(todo.id)}
                            className={`w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                                todo.completed
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'border-stone-300 dark:border-zinc-600 hover:border-blue-400'
                            }`}
                        >
                            {todo.completed && <Checkmark size={10} />}
                        </button>
                        <span
                            className={`flex-1 text-sm truncate ${
                                todo.completed
                                    ? 'line-through text-stone-400 dark:text-zinc-600'
                                    : 'text-stone-700 dark:text-zinc-300'
                            }`}
                        >
                            {todo.text}
                        </span>
                        <button
                            onClick={() => setPendingDeleteId(todo.id)}
                            className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-all"
                        >
                            <X size={13} />
                        </button>
                    </li>
                ))}
            </ul>
            {overflow > 0 && (
                <p className="mt-3 text-xs text-center text-stone-400 dark:text-zinc-600">
                    +{overflow} more tasks
                </p>
            )}

            <Modal
                open={pendingDeleteId !== null}
                onClose={() => setPendingDeleteId(null)}
                size="sm"
                aria-labelledby="todo-delete-title"
            >
                <ModalHeader
                    id="todo-delete-title"
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
                                onDelete(pendingDeleteId);
                                setPendingDeleteId(null);
                            }
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                    >
                        Delete
                    </button>
                </ModalFooter>
            </Modal>
        </>
    );
}
