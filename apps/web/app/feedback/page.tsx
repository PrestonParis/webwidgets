import dynamic from 'next/dynamic';
import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import { PageLoading } from '@/features/ui/loading';

const FeedbackPage = dynamic(
    () =>
        import('@/features/feedback/components/FeedbackPage').then(
            (module) => module.FeedbackPage,
        ),
    { loading: () => <PageLoading message="Loading feedback" /> },
);

export const metadata = { title: 'Feedback' };

export default function Page() {
    return (
        <>
            <Header />
            <FeedbackPage />
            <Footer />
        </>
    );
}
