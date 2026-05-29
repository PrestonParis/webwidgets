import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import { CommandCenterPage } from '@/features/command-center/components/CommandCenterPage';

export default function Page() {
    return (
        <>
            <Header />
            <CommandCenterPage />
            <Footer />
        </>
    );
}
