'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldBadgeIcon } from '@/icons/ShieldBadgeIcon';

const MILESTONES = [
    { label: '1d', title: '1 Day', s: 86400 },
    { label: '3d', title: '3 Days', s: 259200 },
    { label: '1wk', title: '1 Week', s: 604800 },
    { label: '2wk', title: '2 Weeks', s: 1209600 },
    { label: '1mo', title: '1 Month', s: 2592000 },
    { label: '2mo', title: '2 Months', s: 5184000 },
    { label: '3mo', title: '3 Months', s: 7776000 },
    { label: '4mo', title: '4 Months', s: 10368000 },
    { label: '6mo', title: '6 Months', s: 15552000 },
    { label: '9mo', title: '9 Months', s: 23328000 },
    { label: '1yr', title: '1 Year', s: 31536000 },
    { label: '18mo', title: '18 Months', s: 47304000 },
    { label: '2yr', title: '2 Years', s: 63072000 },
    { label: '3yr', title: '3 Years', s: 94608000 },
    { label: '5yr', title: '5 Years', s: 157680000 },
    { label: '7yr', title: '7 Years', s: 220752000 },
    { label: '10yr', title: '10 Years', s: 315360000 },
    { label: '15yr', title: '15 Years', s: 473040000 },
    { label: '20yr', title: '20 Years', s: 630720000 },
    { label: '25yr', title: '25 Years', s: 788400000 },
    { label: '50yr', title: '50 Years', s: 1576800000 },
];

export default function MilestoneBadges({
    secondsClean,
}: {
    secondsClean: number;
}) {
    const [showAll, setShowAll] = useState(false);
    const [newlyUnlockedIdx, setNewlyUnlockedIdx] = useState<number | null>(
        null,
    );

    const nextIndex = MILESTONES.findIndex((m) => secondsClean < m.s);
    const achievedCount = nextIndex === -1 ? MILESTONES.length : nextIndex;
    const prevAchievedRef = useRef(achievedCount);

    useEffect(() => {
        if (achievedCount > prevAchievedRef.current) {
            setNewlyUnlockedIdx(achievedCount - 1);
            const t = setTimeout(() => setNewlyUnlockedIdx(null), 2000);
            prevAchievedRef.current = achievedCount;
            return () => clearTimeout(t);
        }
        prevAchievedRef.current = achievedCount;
    }, [achievedCount]);

    const visibleCount = Math.min(achievedCount + 5, MILESTONES.length);
    const visible = showAll ? MILESTONES : MILESTONES.slice(0, visibleCount);
    const hiddenCount = MILESTONES.length - visibleCount;
    const nextMilestone = nextIndex !== -1 ? MILESTONES[nextIndex] : null;
    const daysToNext = nextMilestone
        ? Math.ceil((nextMilestone.s - secondsClean) / 86400)
        : 0;

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap justify-center gap-1.5">
                {visible.map((m, i) => (
                    <div
                        key={m.label}
                        title={m.title}
                        className={`cursor-default transition-transform duration-300 ${newlyUnlockedIdx === i ? 'animate-bounce scale-125' : ''}`}
                    >
                        <ShieldBadgeIcon
                            label={m.label}
                            achieved={secondsClean >= m.s}
                            isNext={i === nextIndex}
                        />
                    </div>
                ))}
            </div>
            {nextMilestone && (
                <p className="text-xs text-gray-400 dark:text-zinc-500 text-center">
                    Next:{' '}
                    <span className="font-semibold text-purple-500 dark:text-purple-400">
                        {nextMilestone.title}
                    </span>{' '}
                    in {daysToNext} day{daysToNext !== 1 ? 's' : ''}
                </p>
            )}
            {!nextMilestone && (
                <p className="text-xs text-purple-500 dark:text-purple-400 text-center font-semibold">
                    All milestones achieved 🏆
                </p>
            )}
            {!showAll && hiddenCount > 0 && (
                <button
                    onClick={() => setShowAll(true)}
                    className="w-full text-xs text-gray-400 dark:text-zinc-600 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
                >
                    +{hiddenCount} more milestones →
                </button>
            )}
            {showAll && (
                <button
                    onClick={() => setShowAll(false)}
                    className="w-full text-xs text-gray-400 dark:text-zinc-600 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
                >
                    Show less ↑
                </button>
            )}
        </div>
    );
}
