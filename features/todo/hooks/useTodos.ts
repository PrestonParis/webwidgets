'use client';

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

    return { todos, loading, addTodo, toggleTodo, deleteTodo };
}
