import Header from '@/features/ui/components/Header';
import { CurrencyPage } from '@/features/currency/components/CurrencyPage';

export const metadata = { title: 'Currency Converter' };

export default function Page() {
    return (
        <>
            <Header />
            <CurrencyPage />
        </>
    );
}
