import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import { ReadingClient } from './ReadingClient';

export default function Page() {
    return (
        <>
            <Header />
            <ReadingClient />
            <Footer />
        </>
    );
}
