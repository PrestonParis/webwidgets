import dynamic from 'next/dynamic';
import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import { PageLoading } from '@/features/ui/loading';

const CreativeStudioPage = dynamic(
    () =>
        import('@/features/creative/components/CreativeStudioPage').then(
            (module) => module.CreativeStudioPage,
        ),
    { loading: () => <PageLoading message="Loading creative studio" /> },
);

export default function Page() {
    return (
        <>
            <Header />
            <CreativeStudioPage />
            <Footer />
        </>
    );
}
