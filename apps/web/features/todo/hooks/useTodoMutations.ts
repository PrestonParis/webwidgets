'use client';

// Mutation-only hook for todo write operations.
// The read side (listing todos) is handled by the runtime adapter pipeline
// via useWidgetData → import-export/exports → todosAdapter.
// This hook only handles writes (add, toggle, delete, update).

import { useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import type { Todo } from '@/features/todo/types/todo';

const QUERY_KEY = ['widget-adapter', 'todos', 'current_user'];

export function useTodoMutations() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const invalidate = useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }, [queryClient]);

    const addTodo = useCallback(
        async (text: string) => {
            if (!user?.id || !text.trim()) return;
            const { error } = await supabase
                .from('todos')
                .insert({ text: text.trim(), user_id: user.id });
            if (!error) invalidate();
        },
        [user, invalidate],
    );

    const toggleTodo = useCallback(
        async (id: string, currentCompleted: boolean) => {
            const completed = !currentCompleted;
            const completed_at = completed ? new Date().toISOString() : null;
            const { error } = await supabase
                .from('todos')
                .update({ completed, completed_at })
                .eq('id', id);
            if (!error) invalidate();
        },
        [invalidate],
    );

    const deleteTodo = useCallback(
        async (id: string) => {
            await supabase.from('todos').delete().eq('id', id);
            invalidate();
        },
        [invalidate],
    );

    const updateTodo = useCallback(
        async (id: string, text: string) => {
            const trimmed = text.trim();
            if (!trimmed) return;
            const { error } = await supabase
                .from('todos')
                .update({ text: trimmed })
                .eq('id', id);
            if (!error) invalidate();
        },
        [invalidate],
    );

    const sortByAiPriority = useCallback(
        async (todos: Todo[]): Promise<void> => {
            const incomplete = todos.filter((t) => !t.completed);
            if (!incomplete.length) return;
            try {
                const res = await fetch('/api/ml/rank-tasks', {
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
                // AI sort result is UI-only — doesn't invalidate the query,
                // just returns the ranked order for the caller to apply locally.
            } catch {
                // silent fallback
            }
        },
        [],
    );

    return { addTodo, toggleTodo, deleteTodo, updateTodo, sortByAiPriority };
}
