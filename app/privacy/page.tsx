'use client';

import Header from '@/components/global/Header';
import Footer from '@/components/global/Footer';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
            {/* Header */}
            <Header />

            {/* Content */}
            <main className="flex-1 max-w-3xl mx-auto px-6 lg:px-12 py-14 space-y-10">
                {/* Title */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Privacy Policy
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </div>

                {/* Section 1 */}
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">1. Overview</h2>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                        This Privacy Policy explains how webwidgets collects,
                        uses, and protects your information when you use our
                        platform.
                    </p>
                </section>

                {/* Section 2 */}
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">
                        2. Information We Collect
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                        We collect information you provide directly, such as
                        account details (email, name), and data generated
                        through your use of widgets and integrations.
                    </p>
                </section>

                {/* Section 3 */}
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">
                        3. How We Use Information
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                        We use your data to operate the service, sync your
                        dashboard, store preferences, and enable integrations
                        such as Google services when authorized.
                    </p>
                </section>

                {/* Section 4 */}
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">4. Data Storage</h2>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                        Your data is stored securely using Supabase
                        infrastructure. We do not sell personal data.
                        Authentication and sensitive data are handled through
                        secure third-party systems.
                    </p>
                </section>

                {/* Section 5 */}
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">
                        5. Third-Party Services
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                        We use third-party services such as Supabase and Google
                        APIs. These services may collect and process data
                        according to their own privacy policies.
                    </p>
                </section>

                {/* Section 6 */}
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">
                        6. Cookies & Tracking
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                        We use minimal cookies for authentication and session
                        management. We do not use third-party advertising
                        trackers.
                    </p>
                </section>

                {/* Section 7 */}
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">7. Data Security</h2>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                        We implement industry-standard security measures.
                        However, no system is completely secure, and we cannot
                        guarantee absolute protection.
                    </p>
                </section>

                {/* Section 8 */}
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">8. Your Rights</h2>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                        You may request access, correction, or deletion of your
                        personal data at any time by contacting support.
                    </p>
                </section>

                {/* Contact */}
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

            {/* Footer */}
            <Footer />
        </div>
    );
}
