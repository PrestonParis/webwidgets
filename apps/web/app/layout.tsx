import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import Providers from './providers';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Smart Dashboard',
    description: 'Customizable, Smart Dashboard',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <Script id="theme-init" strategy="beforeInteractive">{`try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`}</Script>
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                {/* Skip to main content link for keyboard/screen-reader users */}
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-999 focus:px-4 focus:py-2 focus:bg-white focus:text-zinc-900 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-semibold focus:outline-none focus:ring-2 focus:ring-brand"
                >
                    Skip to main content
                </a>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
