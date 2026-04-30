'use client';

import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import { PrivacySection } from './PrivacySection';
import { PrivacyHeader } from './PrivacyHeader';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
            <Header />

            <main className="flex-1 max-w-3xl mx-auto px-6 lg:px-12 py-14 space-y-10">
                <PrivacyHeader />

                <PrivacySection title="1. Overview">
                    This Privacy Policy explains how webwidgets collects, uses,
                    and protects your information when you use our platform.
                </PrivacySection>

                <PrivacySection title="2. Information We Collect">
                    We collect information you provide directly, such as account
                    details (email, name), and data generated through your use
                    of widgets and integrations.
                </PrivacySection>

                <PrivacySection title="3. How We Use Information">
                    We use your data to operate the service, sync your
                    dashboard, store preferences, and enable integrations such
                    as Google services when authorized.
                </PrivacySection>

                {/* ... Add other sections similarly ... */}

                <div className="pt-6 border-t border-gray-100 dark:border-zinc-800">
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Questions? Contact{' '}
                        <a
                            href="mailto:privacy@webwidgets.com"
                            className="text-[#4f6ef7] hover:underline"
                        >
                            privacy@webwidgets.com
                        </a>
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
