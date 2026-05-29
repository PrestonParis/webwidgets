import Header from '@/features/ui/components/Header';
import { ConverterPageClient } from '@/features/convert/components/ConverterPageClient';

export const metadata = {
    title: 'File Converter',
};

export default function ConvertPage() {
    return (
        <>
            <Header />
            <ConverterPageClient />
        </>
    );
}
