import {
    Activity,
    BellRing,
    CircleDollarSign,
    Files,
    LayoutDashboard,
    ShieldCheck,
    Workflow,
} from 'lucide-react';

export const scopeIcons: Record<string, typeof Activity> = {
    Dashboard: LayoutDashboard,
    Widgets: Activity,
    Files,
    Automations: Workflow,
    Knowledge: ShieldCheck,
    Finance: CircleDollarSign,
    General: Activity,
};

export const notificationIcon = BellRing;
