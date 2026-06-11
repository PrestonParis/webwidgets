'use client';

import { apiRouteFetch } from '@/lib/api/client';
// Mutation-only hook for todo write operations.
// Writes go through /api/todos so activity events are published server-side.
// Reads are handled by the runtime adapter pipeline via useWidgetData → todosAdapter.

import { useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import type { Todo } from '@/features/todo/types/todo';

const QUERY_KEY = ['widget-adapter', 'todos', 'current_user'];

async function apiFetch(path: string, options: RequestInit): Promise<unknown> {
    const res = await fetch(path, {
        ...options,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    if (!res.ok && res.status !== 204) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error ?? `Request failed: ${res.status}`);
    }
    return res.status === 204 ? null : res.json();
}

export function useTodoMutations() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const invalidate = useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }, [queryClient]);

    const addTodo = useCallback(
        async (text: string) => {
            if (!user?.id || !text.trim()) return;
            await apiFetch('/api/todos', {
                method: 'POST',
                body: JSON.stringify({ text: text.trim() }),
            }).catch(console.error);
            invalidate();
        },
        [user, invalidate],
    );

    const toggleTodo = useCallback(
        async (id: string, currentCompleted: boolean) => {
            await apiFetch(`/api/todos/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ completed: !currentCompleted }),
            }).catch(console.error);
            invalidate();
        },
        [invalidate],
    );

    const deleteTodo = useCallback(
        async (id: string) => {
            await apiFetch(`/api/todos/${id}`, { method: 'DELETE' }).catch(
                console.error,
            );
            invalidate();
        },
        [invalidate],
    );

    const updateTodo = useCallback(
        async (id: string, text: string) => {
            const trimmed = text.trim();
            if (!trimmed) return;
            await apiFetch(`/api/todos/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ text: trimmed }),
            }).catch(console.error);
            invalidate();
        },
        [invalidate],
    );

    const sortByAiPriority = useCallback(
        async (todos: Todo[]): Promise<void> => {
            const incomplete = todos.filter((t) => !t.completed);
            if (!incomplete.length) return;
            try {
                const res = await apiRouteFetch('/api/ml/rank-tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tasks: incomplete.map((t) => ({
                            id: t.id,
                            title: t.text,
                            days_until_due: 7,
                            priority: 'medium',
                            category: 'engineering',
                            is_blocked: false,
                            has_dependencies: false,
                        })),
                    }),
                    signal: AbortSignal.timeout(5000),
                });
                if (!res.ok) return;
                // AI sort result is UI-only — caller applies ranked order locally
            } catch {
                // silent fallback
            }
        },
        [],
    );

    return { addTodo, toggleTodo, deleteTodo, updateTodo, sortByAiPriority };
}
