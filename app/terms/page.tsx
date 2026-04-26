'use client';

import Header from '@/components/Global/Header';
import Footer from '@/components/Global/Footer';

export default function TermsPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
            {/* Header */}
            <Header />

            {/* Content */}
            <main className="flex-1 max-w-3xl mx-auto px-6 lg:px-12 py-14 space-y-10">
                {/* Title */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Terms of Service
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </div>

                {/* Section */}
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">1. Overview</h2>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                        By using webwidgets, you agree to these terms. If you do
                        not agree, do not use the service. This platform
                        provides dashboard tools for managing personal widgets
                        and data integrations.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">2. User Accounts</h2>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                        You are responsible for your account and all activity
                        under it. You must provide accurate information and keep
                        your credentials secure.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">3. Data Usage</h2>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                        We may store user-generated content, preferences, and
                        integration tokens solely to operate the service. We do
                        not sell personal data.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">
                        4. Third-Party Services
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                        Some features rely on third-party services (e.g., Google
                        APIs, Supabase). We are not responsible for outages or
                        changes to those services.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">5. Termination</h2>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                        We may suspend or terminate accounts that violate these
                        terms or misuse the platform.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">6. Changes</h2>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                        We may update these terms at any time. Continued use of
                        the platform means acceptance of the updated terms.
                    </p>
                </section>

                {/* Contact 
                <div className="pt-6 border-t border-gray-100 dark:border-zinc-800">
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Questions? Contact{" "}
                        <a
                            href="mailto:legal@webwidgets.com"
                            className="text-[#4f6ef7] hover:underline"
                        >
                            legal@webwidgets.com
                        </a>
                    </p>
                </div> */}
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
