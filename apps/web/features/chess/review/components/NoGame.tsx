import { useRouter } from 'next/navigation';

export function NoGame() {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-400 gap-4">
            <p>Game not found.</p>
            <button
                onClick={() => router.push('/chess')}
                className="text-blue-500 hover:underline text-sm"
            >
                ← Back to library
            </button>
        </div>
    );
}
