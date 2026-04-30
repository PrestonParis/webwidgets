import { CountdownDisplayProps } from '@/types/countdown';

export default function CountdownDisplay({ timeLeft }: CountdownDisplayProps) {
    const { days, hours, minutes, seconds } = timeLeft;

    const slots =
        days > 0
            ? [
                  { v: days, l: 'd' },
                  { v: hours, l: 'h' },
                  { v: minutes, l: 'm' },
              ]
            : [
                  { v: hours, l: 'h' },
                  { v: minutes, l: 'm' },
                  { v: seconds, l: 's' },
              ];

    return (
        <div className="flex gap-3">
            {slots.map(({ v, l }) => (
                <div key={l} className="text-center">
                    <p className="text-2xl font-bold tabular-nums text-stone-800 dark:text-zinc-100 leading-none">
                        {String(v).padStart(2, '0')}
                    </p>
                    <p className="text-[10px] text-stone-400 dark:text-zinc-600">
                        {l}
                    </p>
                </div>
            ))}
        </div>
    );
}
