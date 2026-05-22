import { useState, useRef } from 'react';
import { useTodos } from '@/features/todo/hooks/useTodos';

const MAX_VISIBLE = 7;

export function useTodoWidget() {
    const { todos, loading, addTodo, toggleTodo, deleteTodo } = useTodos();
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim()) return;
        await addTodo(input);
        setInput('');
        inputRef.current?.focus();
    };

    const incomplete = todos.filter((t) => !t.completed);
    const completed = todos.filter((t) => t.completed);
    const visible = [...incomplete, ...completed].slice(0, MAX_VISIBLE);
    const overflow = todos.length - MAX_VISIBLE;

    return {
        input,
        setInput,
        inputRef,
        handleSubmit,
        loading,
        visible,
        overflow,
        toggleTodo,
        deleteTodo,
    };
}
