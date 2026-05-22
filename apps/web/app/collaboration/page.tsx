import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import { CollaborationWorkspacePage } from '@/features/collaboration/components/CollaborationWorkspacePage';

export default function Page() {
    return (
        <>
            <Header />
            <CollaborationWorkspacePage />
            <Footer />
        </>
    );
}
