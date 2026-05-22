import Link from 'next/link';
import { LogoIsometric } from '@/icons/LogoIsometric';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Background grid */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />

            {/* Radial glow */}
            <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full opacity-10 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(circle, #4f6ef7 0%, transparent 70%)',
                }}
            />

            <div className="relative z-10 text-center max-w-sm">
                <div className="inline-flex items-center gap-2 mb-10">
                    <div className="w-8 h-8 rounded-lg bg-[#4f6ef7] flex items-center justify-center">
                        <LogoIsometric size={32} />
                    </div>
                    <span className="text-white font-semibold text-lg tracking-tight">
                        WebWidgets
                    </span>
                </div>

                <p className="text-[#4f6ef7] text-sm font-medium tracking-widest uppercase mb-3">
                    404
                </p>
                <h1 className="text-white text-2xl font-semibold mb-3">
                    Page not found
                </h1>
                <p className="text-zinc-500 text-sm mb-8">
                    The page you&apos;re looking for doesn&apos;t exist or has
                    been moved.
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4f6ef7] text-white text-sm font-medium hover:bg-[#3d5ce0] transition-colors"
                >
                    Back to dashboard
                </Link>
            </div>
        </div>
    );
}
