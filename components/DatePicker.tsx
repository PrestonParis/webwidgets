"use client";
import { useRef, useState } from "react";

interface Props {
    value: string;
    onChange: (iso: string) => void;
    onCancel: () => void;
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const snapMinute = (m: number) => Math.round(m / 5) * 5;

export default function DatePicker({ value, onChange, onCancel }: Props) {
    const initial = new Date(value);

    const [viewYear, setViewYear] = useState(initial.getFullYear());
    const [viewMonth, setViewMonth] = useState(initial.getMonth());

    const [selDay, setSelDay] = useState(initial.getDate());
    const [selMonth, setSelMonth] = useState(initial.getMonth());
    const [selYear, setSelYear] = useState(initial.getFullYear());

    const [hour, setHour] = useState(initial.getHours() % 12 || 12);
    const [minute, setMinute] = useState<number>(snapMinute(initial.getMinutes()));

    const [ampm, setAmpm] = useState<"AM" | "PM">(
        initial.getHours() >= 12 ? "PM" : "AM"
    );

    const ref = useRef<HTMLDivElement>(null);

    const today = new Date();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const changeMonth = (dir: number) => {
        const d = new Date(viewYear, viewMonth + dir);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
    };

    const setQuick = (type: string) => {
        const now = new Date();
        let t: Date;

        if (type === "now") t = now;
        else if (type === "sod")
            t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        else if (type === "1hago")
            t = new Date(now.getTime() - 3600000);
        else
            t = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

        setViewYear(t.getFullYear());
        setViewMonth(t.getMonth());

        setSelYear(t.getFullYear());
        setSelMonth(t.getMonth());
        setSelDay(t.getDate());

        const h = t.getHours();
        setAmpm(h >= 12 ? "PM" : "AM");
        setHour(h % 12 || 12);
        setMinute(snapMinute(t.getMinutes()));
    };

    const handleSave = () => {
        const h24 =
            ampm === "PM"
                ? (hour === 12 ? 12 : hour + 12)
                : (hour === 12 ? 0 : hour);

        const d = new Date(selYear, selMonth, selDay, h24, minute);
        onChange(d.toISOString());
    };

    const monthLabel = new Date(viewYear, viewMonth).toLocaleString("default", {
        month: "long",
        year: "numeric",
    });

    return (
        <div
            ref={ref}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm w-72 overflow-hidden z-50"
        >
            {/* Month nav */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <button
                    onClick={() => changeMonth(-1)}
                    className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-50 text-sm"
                >
                    ‹
                </button>

                <span className="text-sm font-bold text-gray-800">
                    {monthLabel}
                </span>

                <button
                    onClick={() => changeMonth(1)}
                    className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-50 text-sm"
                >
                    ›
                </button>
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 px-3 pt-2 pb-1">
                {DAYS.map((d, i) => (
                    <div key={i} className="text-center text-xs text-gray-400 py-1">
                        {d}
                    </div>
                ))}

                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`e${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;

                    const isSelected =
                        day === selDay &&
                        viewMonth === selMonth &&
                        viewYear === selYear;

                    const isToday =
                        day === today.getDate() &&
                        viewMonth === today.getMonth() &&
                        viewYear === today.getFullYear();

                    const isFuture =
                        new Date(viewYear, viewMonth, day) > today;

                    return (
                        <div
                            key={day}
                            onClick={() => {
                                if (!isFuture) {
                                    setSelDay(day);
                                    setSelMonth(viewMonth);
                                    setSelYear(viewYear);
                                }
                            }}
                            className={`text-center text-xs py-1.5 rounded-full cursor-pointer transition-colors
                                ${
                                    isSelected
                                        ? "bg-purple-600 text-white"
                                        : isToday
                                        ? "text-purple-600 font-bold hover:bg-purple-50"
                                        : isFuture
                                        ? "text-gray-200 cursor-default"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                {[
                    ["now", "Now"],
                    ["sod", "Start of day"],
                    ["1hago", "1 hr ago"],
                    ["yesterday", "Yesterday"],
                ].map(([k, label]) => (
                    <button
                        key={k}
                        onClick={() => setQuick(k)}
                        className="text-xs px-2.5 py-1 rounded-lg border transition-colors border-gray-200 text-gray-500 hover:bg-gray-50"
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 px-3 pb-3 border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-400 w-8">Time</span>

                <select
                    value={hour}
                    onChange={(e) => setHour(Number(e.target.value))}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-purple-200"
                >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={h}>
                            {h}
                        </option>
                    ))}
                </select>

                <span className="text-gray-400 text-sm">:</span>

                <select
                    value={minute}
                    onChange={(e) => setMinute(Number(e.target.value))}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-purple-200"
                >
                    {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                        <option key={m} value={m}>
                            {m.toString().padStart(2, "0")}
                        </option>
                    ))}
                </select>

                <div className="flex rounded-lg overflow-hidden border border-gray-200 ml-auto">
                    {(["AM", "PM"] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setAmpm(v)}
                            className={`text-xs px-2.5 py-1 transition-colors ${
                                ampm === v
                                    ? "bg-purple-600 text-white"
                                    : "text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-3 pb-3">
                <button
                    onClick={onCancel}
                    className="flex-1 py-2 border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-50"
                >
                    Cancel
                </button>

                <button
                    onClick={handleSave}
                    className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700"
                >
                    Save start date
                </button>
            </div>
        </div>
    );
}