import { redirect } from 'next/navigation';

export const metadata = { title: 'Pomodoro Timer' };

export default function Page() {
    redirect('/time?mode=pomodoro');
}
