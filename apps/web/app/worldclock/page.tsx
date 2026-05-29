import { redirect } from 'next/navigation';

export const metadata = { title: 'World Clock' };

export default function Page() {
    redirect('/time?mode=worldclock');
}
