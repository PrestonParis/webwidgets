import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import { ViewClient } from './ViewClient';

export default function Page() {
    return (
        <>
            <Header />
            <ViewClient />
            <Footer />
        </>
    );
}
