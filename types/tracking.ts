export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    created_at: string;
    completed_at: string | null;
}
