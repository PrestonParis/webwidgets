import { TodoFormProps } from '@/types/todo';

export function TodoForm({
    input,
    onChange,
    onSubmit,
    inputRef,
}: TodoFormProps) {
    return (
        <form onSubmit={onSubmit} className="flex gap-2 mb-4">
            <input
                ref={inputRef}
                value={input}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Add a task…"
                className="flex-1 text-sm px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 placeholder:text-stone-400 dark:placeholder:text-zinc-600 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
            />
            <button
                type="submit"
                disabled={!input.trim()}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm rounded-xl transition-colors"
            >
                Add
            </button>
        </form>
    );
}
