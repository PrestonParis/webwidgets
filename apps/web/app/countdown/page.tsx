import { redirect } from 'next/navigation';

export const metadata = { title: 'Countdowns' };

export default function Page() {
    redirect('/time?mode=countdown');
}
