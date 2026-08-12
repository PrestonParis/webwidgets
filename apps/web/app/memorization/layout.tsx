import type { ReactNode } from 'react';
import { EntertainmentGate } from '@/features/entertainment/components/EntertainmentGate';

export default function MemorizationLayout({
    children,
}: {
    children: ReactNode;
}) {
    return <EntertainmentGate>{children}</EntertainmentGate>;
}
