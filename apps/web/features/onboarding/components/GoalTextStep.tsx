'use client';

interface GoalTextStepProps {
    intent: string;
    onIntentChange: (intent: string) => void;
}

export function GoalTextStep({ intent, onIntentChange }: GoalTextStepProps) {
    return (
        <label className="block rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-sm font-semibold">
                What are you trying to accomplish with your workspace?
            </span>
            <textarea
                value={intent}
                onChange={(event) => onIntentChange(event.target.value)}
                rows={8}
                className="mt-4 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#4f6ef7] dark:border-zinc-800 dark:bg-zinc-950"
                placeholder="Example: I want a quiet recovery dashboard with mood check-ins, sleep tracking, a few daily habits, and calendar reminders without clutter."
            />
        </label>
    );
}
