import Link from 'next/link';
import { cn } from '@/lib/utils/utils';
import { colorMap } from '@/lib/constants/widget-styles';
import { WidgetFooterProps } from '@/types/widgets';

export function WidgetFooter({ href, label, settings }: WidgetFooterProps) {
    const c = colorMap[settings.color];

    return (
        <Link
            href={href}
            className={cn(
                'mt-6 block text-center py-2.5 rounded-xl text-sm font-semibold',
                'bg-gray-50 dark:bg-zinc-900/50 text-gray-600 dark:text-zinc-400',
                c.footerHover,
            )}
        >
            {label}
        </Link>
    );
}
