export interface TodoListProps {
    todos: Todo[];
    loading: boolean;
    overflow: number;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}
export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    created_at: string;
    completed_at: string | null;
    due_at: string | null;
    updated_at: string;
}

export interface TodoFormProps {
    input: string;
    onChange: (val: string) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
}
