import dynamic from 'next/dynamic';
import Header from '@/features/ui/components/Header';
import { PageLoading } from '@/features/ui/loading';

const RecoveryPage = dynamic(
    () => import('../../features/recovery/components/RecoveryPage'),
    { loading: () => <PageLoading message="Loading recovery" /> },
);

export default function Page() {
    return (
        <>
            <Header />
            <RecoveryPage />
        </>
    );
}
