import Header from '@/features/ui/components/Header';
import { ScratchpadPage } from '@/features/scratchpad/components/ScratchpadPage';

export const metadata = { title: 'Scratchpad' };

export default function Page() {
    return (
        <>
            <Header />
            <ScratchpadPage />
        </>
    );
}
