import { redirect } from 'next/navigation';

export default function Page() {
    redirect('/texteditor?mode=journal');
}
