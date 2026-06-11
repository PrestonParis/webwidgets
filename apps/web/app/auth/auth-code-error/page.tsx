import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
import { LogoIsometric } from '@/icons/LogoIsometric';

export default function AuthCodeError() {
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

            {/* Radial glow — red tint for error state */}
            <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full opacity-10 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(circle, #ef4444 0%, transparent 70%)',
                }}
            />

            <div className="relative z-10 text-center max-w-sm w-full">
                {/* Logo */}
                <div className="inline-flex items-center gap-2 mb-10">
                    <div className="w-8 h-8 rounded-lg bg-[#4f6ef7] flex items-center justify-center">
                        <LogoIsometric size={32} />
                    </div>
                    <span className="text-white font-semibold text-lg tracking-tight">
                        WebWidgets
                    </span>
                </div>

                {/* Lock icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <LockKeyhole
                            size={24}
                            color="#ef4444"
                            strokeWidth={1.75}
                        />
                    </div>
                </div>

                <p className="text-red-400 text-sm font-medium tracking-widest uppercase mb-3">
                    Sign-in failed
                </p>
                <h1 className="text-white text-2xl font-semibold mb-3">
                    Authentication error
                </h1>
                <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                    We couldn&apos;t complete sign-in. This can happen if the
                    link expired, you cancelled the request, or there was a
                    temporary issue with Google.
                </p>

                {/* Common reasons */}
                <div className="text-left bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 mb-8 space-y-2">
                    <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">
                        Common reasons
                    </p>
                    {[
                        'The sign-in link expired (links are one-time use)',
                        'You cancelled the Google permission prompt',
                        'Cookies or pop-ups are blocked in your browser',
                        "A temporary issue with Google's servers",
                    ].map((reason) => (
                        <div key={reason} className="flex items-start gap-2.5">
                            <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-zinc-600" />
                            <span className="text-zinc-500 text-sm leading-snug">
                                {reason}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                    <Link
                        href="/"
                        className="w-full px-4 py-2.5 rounded-lg bg-[#4f6ef7] text-white text-sm font-medium hover:bg-[#3d5ce0] transition-colors text-center"
                    >
                        Try signing in again
                    </Link>
                    <a
                        href="mailto:hello@webwidgets.com"
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-800 text-zinc-400 text-sm font-medium hover:border-zinc-600 hover:text-zinc-200 transition-colors text-center"
                    >
                        Contact support
                    </a>
                </div>
            </div>
        </div>
    );
}
