'use client';

import { useState } from 'react';
import { Video, MapPin, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import {
    CalendarEvent,
    eventColor,
    formatEventTime,
} from '@/features/calendar/types/calendar';

interface ActionsProps {
    onEdit: () => void;
    onDelete: () => void;
}
function EventDetailActions({ onEdit, onDelete }: ActionsProps) {
    const [confirming, setConfirming] = useState(false);
    return (
        <div className="flex items-center gap-0.5 shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
                onClick={onEdit}
                title="Edit event"
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
                <Pencil size={11} className="text-zinc-400" />
            </button>
            {confirming ? (
                <>
                    <button
                        onClick={() => {
                            setConfirming(false);
                            void onDelete();
                        }}
                        className="text-[10px] font-medium text-red-400 hover:text-red-300 px-1"
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => setConfirming(false)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1"
                    >
                        Cancel
                    </button>
                </>
            ) : (
                <button
                    onClick={() => setConfirming(true)}
                    title="Delete event"
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <Trash2
                        size={11}
                        className="text-zinc-400 hover:text-red-400 transition-colors"
                    />
                </button>
            )}
        </div>
    );
}

interface EventDetailProps {
    event: CalendarEvent;
    onEdit: () => void;
    onDelete: () => void;
}
export function EventDetail({ event, onEdit, onDelete }: EventDetailProps) {
    return (
        <div className="py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
            <div className="flex items-start gap-2">
                <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${eventColor(event.colorId)}`}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                        <p className="text-sm font-semibold leading-snug text-gray-800 dark:text-zinc-100">
                            {event.summary}
                        </p>
                        <EventDetailActions
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                        {formatEventTime(event)}
                    </p>
                    {event.location && (
                        <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500 mt-1 truncate">
                            <MapPin size={10} />
                            {event.location}
                        </p>
                    )}
                    {event.description && (
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 line-clamp-2">
                            {event.description.replace(/<[^>]+>/g, '')}
                        </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                        {event.hangoutLink && (
                            <a
                                href={event.hangoutLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                <Video size={10} /> Join
                            </a>
                        )}
                        <a
                            href={event.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400"
                        >
                            <ExternalLink size={10} /> Open
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
