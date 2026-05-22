import dynamic from 'next/dynamic';
import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import { PageLoading } from '@/features/ui/loading';

const HelpPage = dynamic(() => import('@/features/help/components/HelpPage'), {
    loading: () => <PageLoading message="Loading help" />,
});

export const metadata = { title: 'Help' };

export default function Page() {
    return (
        <>
            <Header />
            <HelpPage />
            <Footer />
        </>
    );
}
