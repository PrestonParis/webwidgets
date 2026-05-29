import { redirect } from 'next/navigation';

export const metadata = { title: 'Weather' };

export default function Page() {
    redirect('/planning');
}
