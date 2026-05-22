import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import { TutorialsPage } from '@/features/tutorials/components/TutorialsPage';

export default function Page() {
    return (
        <>
            <Header />
            <TutorialsPage />
            <Footer />
        </>
    );
}
