import {
    Activity,
    BellRing,
    BrainCircuit,
    CalendarClock,
    CircleDollarSign,
    Inbox,
} from 'lucide-react';

export const domainIcons: Record<string, typeof Activity> = {
    Inbox,
    Finance: CircleDollarSign,
    Tracking: Activity,
    Calendar: CalendarClock,
    Knowledge: BrainCircuit,
    Automation: BellRing,
    General: Activity,
};
