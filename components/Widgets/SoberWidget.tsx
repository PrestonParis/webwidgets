"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function formatTime(seconds: number) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

export default function AddictionWidget({ startTime }: { startTime: string | null }) {
    const [secondsClean, setSecondsClean] = useState(0);

    useEffect(() => {
        if (!startTime) return;

        const start = new Date(startTime).getTime();

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = Math.floor((now - start) / 1000);
            setSecondsClean(diff);
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-800 text-lg group-hover:text-purple-600 transition-colors">
                    Recovery
                </h3>

                <div className="bg-purple-50 text-purple-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    LIVE
                </div>
            </div>

            {/* Main Content */}
            <div className="grow flex flex-col justify-center items-center text-center space-y-3">
                {startTime ? (
                    <>
                        <p className="text-xs font-mono text-gray-400">
                            CLEAN TIME
                        </p>

                        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                            {formatTime(secondsClean)}
                        </h2>

                        <p className="text-xs text-gray-500 italic">
                            Since {new Date(startTime).toLocaleDateString()}
                        </p>
                    </>
                ) : (
                    <p className="text-gray-400 text-sm italic py-4">
                        Start your recovery timer
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2">
                
                {/* Primary Action */}
                <Link
                    href="/personaldash/recovery"
                    className="block text-center py-3 bg-purple-600 text-white rounded-2xl text-sm font-bold hover:bg-purple-700 transition-all active:scale-[0.98]"
                >
                    View Progress
                </Link>

                {/* Secondary Action */}
                <Link
                    href="/personaldash/recovery"
                    className="block text-center py-2 text-xs font-semibold text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100 transition-all active:scale-[0.98]"
                >
                    Log / View Urges
                </Link>
            </div>
        </div>
    );
}