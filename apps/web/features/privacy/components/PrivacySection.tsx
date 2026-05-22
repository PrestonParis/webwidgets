import { PrivacySectionProps } from '@/features/privacy/types/privacy';

export function PrivacySection({ title, children }: PrivacySectionProps) {
    return (
        <section className="space-y-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            <div className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                {children}
            </div>
        </section>
    );
}
