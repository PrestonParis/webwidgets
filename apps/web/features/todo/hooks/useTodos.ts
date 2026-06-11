'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Todo } from '@/features/todo/types/todo';

export function useTodos() {
    const { user } = useAuth();
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;

        void (async () => {
            const { data } = await supabase
                .from('todos')
                .select('id, text, completed, created_at, completed_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!cancelled) {
                setTodos(data || []);
                setLoading(false);
            }
        })();

        const channel = supabase
            .channel(`todos:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'todos',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newTodo = payload.new as Todo;
                    setTodos((prev) => {
                        if (prev.some((t) => t.id === newTodo.id)) return prev;
                        return [newTodo, ...prev];
                    });
                },
            )
            .subscribe();

        return () => {
            cancelled = true;
            void supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const addTodo = useCallback(
        async (text: string) => {
            if (!user?.id || !text.trim()) return;
            const { data, error } = await supabase
                .from('todos')
                .insert({ text: text.trim(), user_id: user.id })
                .select('id, text, completed, created_at, completed_at')
                .single();
            if (!error && data) setTodos((prev) => [data, ...prev]);
        },
        [user],
    );

    const toggleTodo = useCallback(
        async (id: string) => {
            const todo = todos.find((t) => t.id === id);
            if (!todo) return;
            const completed = !todo.completed;
            const completed_at = completed ? new Date().toISOString() : null;
            const { error } = await supabase
                .from('todos')
                .update({ completed, completed_at })
                .eq('id', id);
            if (!error) {
                setTodos((prev) =>
                    prev.map((t) =>
                        t.id === id ? { ...t, completed, completed_at } : t,
                    ),
                );
            }
        },
        [todos],
    );

    const deleteTodo = useCallback(async (id: string) => {
        await supabase.from('todos').delete().eq('id', id);
        setTodos((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const updateTodo = useCallback(async (id: string, text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const { error } = await supabase
            .from('todos')
            .update({ text: trimmed })
            .eq('id', id);
        if (!error)
            setTodos((prev) =>
                prev.map((t) => (t.id === id ? { ...t, text: trimmed } : t)),
            );
    }, []);

    const [aiSorted, setAiSorted] = useState(false);

    const sortByAiPriority = useCallback(async () => {
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
            const data = (await res.json()) as {
                ranked?: { id: string; urgency_score: number }[];
            };
            if (!data.ranked?.length) return;
            const scoreMap = new Map(
                data.ranked.map((r) => [r.id, r.urgency_score]),
            );
            setTodos((prev) => {
                const sorted = [...prev.filter((t) => !t.completed)].sort(
                    (a, b) =>
                        (scoreMap.get(b.id) ?? 0.5) -
                        (scoreMap.get(a.id) ?? 0.5),
                );
                return [...sorted, ...prev.filter((t) => t.completed)];
            });
            setAiSorted(true);
        } catch {
            // silent fallback
        }
    }, [todos]);

    return {
        todos,
        loading,
        addTodo,
        toggleTodo,
        deleteTodo,
        updateTodo,
        aiSorted,
        sortByAiPriority,
    };
}
