import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import { AccessibilityCenterPage } from '@/features/accessibility/components/AccessibilityCenterPage';

export default function Page() {
    return (
        <>
            <Header />
            <AccessibilityCenterPage />
            <Footer />
        </>
    );
}
