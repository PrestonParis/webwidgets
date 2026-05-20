import Header from '@/features/ui/components/Header';
import { DataHealthPage } from '@/features/datahealth/components/DataHealthPage';

export const metadata = { title: 'System Health' };

export default function Page() {
    return (
        <>
            <Header />
            <DataHealthPage />
        </>
    );
}
