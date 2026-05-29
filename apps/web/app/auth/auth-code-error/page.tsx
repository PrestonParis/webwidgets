import Link from 'next/link';

export default function AuthCodeError() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
            <div className="text-center text-white">
                <h1 className="text-xl font-bold mb-2">Sign in failed</h1>
                <p className="text-zinc-400 mb-4">
                    Something went wrong during authentication.
                </p>
                <Link href="/" className="text-[#4f6ef7] hover:underline">
                    Try again
                </Link>
            </div>
        </div>
    );
}
