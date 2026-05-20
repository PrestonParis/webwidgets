import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import SettingsLayout from '@/features/settings/components/SettingsLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
            <Header />
            <div className="flex-1 flex">
                <SettingsLayout>{children}</SettingsLayout>
            </div>
            <Footer />
        </div>
    );
}
