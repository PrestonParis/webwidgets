import type { LucideIcon } from 'lucide-react';

export type CommandStatus = 'healthy' | 'attention' | 'blocked' | 'queued';
export type CommandPriority = 'low' | 'medium' | 'high' | 'critical';
export type CommandDomain =
    | 'Inbox'
    | 'Finance'
    | 'Tracking'
    | 'Calendar'
    | 'Knowledge'
    | 'Automation';

export interface CommandMetric {
    id: string;
    label: string;
    value: string;
    delta: string;
    tone: 'emerald' | 'blue' | 'amber' | 'rose';
    icon: LucideIcon;
}

export interface CommandWorkstream {
    id: string;
    title: string;
    domain: CommandDomain;
    owner: string;
    status: CommandStatus;
    priority: CommandPriority;
    progress: number;
    nextStep: string;
    due: string;
    blockers: number;
    automations: number;
    confidence: number;
}

export interface CommandSignal {
    id: string;
    title: string;
    source: CommandDomain;
    status: CommandStatus;
    timestamp: string;
    summary: string;
    impact: string;
}

export interface CommandAction {
    id: string;
    title: string;
    domain: CommandDomain;
    priority: CommandPriority;
    estimate: string;
    automationReady: boolean;
    completed: boolean;
}

export interface CommandScenario {
    id: string;
    name: string;
    description: string;
    lift: string;
    risk: string;
    selected: boolean;
}

export interface CommandFilters {
    query: string;
    status: CommandStatus | 'all';
    domain: CommandDomain | 'all';
    priority: CommandPriority | 'all';
    sort: 'priority' | 'due' | 'confidence' | 'progress';
}
