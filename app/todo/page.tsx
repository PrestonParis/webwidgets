import Header from '@/features/ui/components/Header';
import { TodoPage } from '@/features/todo/components/TodoPage';

export const metadata = { title: 'To-Do' };

export default function Page() {
    return (
        <>
            <Header />
            <TodoPage />
        </>
    );
}
