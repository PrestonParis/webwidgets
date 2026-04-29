'use client';

import { useState, useEffect, FormEvent } from 'react';
import { CalendarClock, Plus, X } from 'lucide-react';
import WidgetShell from '@/components/widgets/WidgetShell';
import { useWidgetSettings } from '@/hooks/dashboard/useWidgetSettings';
import { useCountdowns } from '@/hooks/tracking/useCountdowns';

const EMOJI_OPTIONS = [
    '🎯',
    '🎂',
    '🎉',
    '✈️',
    '🏖️',
    '🎓',
    '💼',
    '🏃',
    '💍',
    '🏠',
    '🎵',
    '⭐',
];

function getTimeLeft(
    targetDate: string,
): { days: number; hours: number; minutes: number; seconds: number } | null {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    const seconds = Math.floor((diff % 60_000) / 1_000);
    return { days, hours, minutes, seconds };
}

export default function CountdownWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'countdown',
        'countdown',
    );
    const { countdowns, loading, addCountdown, deleteCountdown } =
        useCountdowns();
    const [now, setNow] = useState(Date.now());
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newEmoji, setNewEmoji] = useState('🎯');

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const handleAdd = async (e: FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newDate) return;
        await addCountdown(newName, new Date(newDate).toISOString(), newEmoji);
        setNewName('');
        setNewDate('');
        setNewEmoji('🎯');
        setAdding(false);
    };

    const upcoming = countdowns.filter(
        (c) => new Date(c.target_date).getTime() > now,
    );
    const nearest = upcoming[0] ?? null;
    const rest = upcoming.slice(1);

    return (
        <WidgetShell
            icon={<CalendarClock size={16} />}
            title="Countdowns"
            settings={settings}
            onSettingsChange={updateSettings}
        >
            {loading ? (
                <div className="space-y-2 animate-pulse">
                    <div className="h-20 bg-stone-100 dark:bg-zinc-800 rounded-xl" />
                </div>
            ) : (
                <>
                    {/* Nearest countdown — hero */}
                    {nearest
                        ? (() => {
                              const t = getTimeLeft(nearest.target_date);
                              if (!t) return null;
                              return (
                                  <div className="group relative bg-stone-50 dark:bg-zinc-800/50 rounded-2xl p-4 mb-3">
                                      <button
                                          onClick={() =>
                                              deleteCountdown(nearest.id)
                                          }
                                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-all"
                                      >
                                          <X size={12} />
                                      </button>
                                      <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xl">
                                              {nearest.emoji}
                                          </span>
                                          <span className="text-sm font-semibold text-stone-700 dark:text-zinc-300 truncate">
                                              {nearest.name}
                                          </span>
                                      </div>
                                      {t.days > 0 ? (
                                          <div className="flex gap-3">
                                              {[
                                                  { v: t.days, l: 'd' },
                                                  { v: t.hours, l: 'h' },
                                                  { v: t.minutes, l: 'm' },
                                              ].map(({ v, l }) => (
                                                  <div
                                                      key={l}
                                                      className="text-center"
                                                  >
                                                      <p className="text-2xl font-bold tabular-nums text-stone-800 dark:text-zinc-100 leading-none">
                                                          {String(v).padStart(
                                                              2,
                                                              '0',
                                                          )}
                                                      </p>
                                                      <p className="text-[10px] text-stone-400 dark:text-zinc-600">
                                                          {l}
                                                      </p>
                                                  </div>
                                              ))}
                                          </div>
                                      ) : (
                                          <div className="flex gap-3">
                                              {[
                                                  { v: t.hours, l: 'h' },
                                                  { v: t.minutes, l: 'm' },
                                                  { v: t.seconds, l: 's' },
                                              ].map(({ v, l }) => (
                                                  <div
                                                      key={l}
                                                      className="text-center"
                                                  >
                                                      <p className="text-2xl font-bold tabular-nums text-stone-800 dark:text-zinc-100 leading-none">
                                                          {String(v).padStart(
                                                              2,
                                                              '0',
                                                          )}
                                                      </p>
                                                      <p className="text-[10px] text-stone-400 dark:text-zinc-600">
                                                          {l}
                                                      </p>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              );
                          })()
                        : !adding && (
                              <div className="flex flex-col items-center gap-2 py-4 text-stone-400 dark:text-zinc-600">
                                  <CalendarClock
                                      size={28}
                                      className="opacity-40"
                                  />
                                  <p className="text-xs">
                                      No upcoming countdowns.
                                  </p>
                              </div>
                          )}

                    {/* Rest */}
                    {rest.length > 0 && (
                        <ul className="space-y-1.5 mb-3">
                            {rest.map((c) => {
                                const t = getTimeLeft(c.target_date);
                                if (!t) return null;
                                return (
                                    <li
                                        key={c.id}
                                        className="group flex items-center justify-between px-1"
                                    >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-sm">
                                                {c.emoji}
                                            </span>
                                            <span className="text-xs text-stone-600 dark:text-zinc-400 truncate">
                                                {c.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs font-semibold tabular-nums text-stone-700 dark:text-zinc-300">
                                                {t.days}d
                                            </span>
                                            <button
                                                onClick={() =>
                                                    deleteCountdown(c.id)
                                                }
                                                className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 dark:text-zinc-600 transition-all"
                                            >
                                                <X size={11} />
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {/* Add form */}
                    {adding ? (
                        <form onSubmit={handleAdd} className="space-y-2 mt-1">
                            <div className="flex flex-wrap gap-1">
                                {EMOJI_OPTIONS.map((e) => (
                                    <button
                                        key={e}
                                        type="button"
                                        onClick={() => setNewEmoji(e)}
                                        className={`text-base w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                            newEmoji === e
                                                ? 'bg-sky-100 dark:bg-sky-900/30'
                                                : 'hover:bg-stone-100 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                            <input
                                autoFocus
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Event name…"
                                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 placeholder:text-stone-400 outline-none focus:border-sky-400 transition-colors"
                            />
                            <input
                                type="datetime-local"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 outline-none focus:border-sky-400 transition-colors"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={!newName.trim() || !newDate}
                                    className="flex-1 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAdding(false)}
                                    className="px-3 py-2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 text-sm"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setAdding(true)}
                            className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-zinc-600 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                        >
                            <Plus size={12} /> Add countdown
                        </button>
                    )}
                </>
            )}
        </WidgetShell>
    );
}
