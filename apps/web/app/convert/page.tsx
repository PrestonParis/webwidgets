import { Suspense } from 'react';
import Header from '@/features/ui/components/Header';
import UnitConvertPage from '@/features/convert/components/UnitConvertPage';

export const metadata = {
    title: 'Converter',
};

export default function ConvertPage() {
    return (
        <>
            <Header />
            <Suspense>
                <UnitConvertPage />
            </Suspense>
        </>
    );
}
