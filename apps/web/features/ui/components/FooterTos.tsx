import Link from 'next/link';

export default function FooterTos() {
    return (
        <div className="flex flex-col gap-2">
            <Link
                href="/privacy"
                className="text-sm text-gray-600 dark:text-zinc-400 hover:text-[#4f6ef7] transition-colors"
            >
                Privacy Policy
            </Link>

            <Link
                href="/terms"
                className="text-sm text-gray-600 dark:text-zinc-400 hover:text-[#4f6ef7] transition-colors"
            >
                Terms of Service
            </Link>

            <Link
                href="/settings"
                className="text-sm text-gray-600 dark:text-zinc-400 hover:text-[#4f6ef7] transition-colors"
            >
                Settings
            </Link>
        </div>
    );
}
