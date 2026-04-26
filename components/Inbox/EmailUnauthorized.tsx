import Link from 'next/link';

export function EmailUnauthorized() {
    return (
        <div className="max-w-2xl mx-auto p-4 mt-10">
            <div className="p-8 rounded-3xl border-2 border-dashed text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    📧
                </div>

                <h2 className="text-xl font-bold">Connect your Gmail</h2>

                <p className="text-gray-500">
                    You need to sync your account first.
                </p>

                <Link
                    href="/settings"
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl"
                >
                    Go to Settings
                </Link>
            </div>
        </div>
    );
}
