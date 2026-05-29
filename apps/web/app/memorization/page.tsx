import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import { MemorizationPage } from '@/features/memorization/components/MemorizationPage';

export default function Page() {
    return (
        <>
            <Header />
            <MemorizationPage />
            <Footer />
        </>
    );
}
