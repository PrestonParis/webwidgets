'use client';

import {
    BookOpen,
    Brain,
    Cable,
    FolderOpen,
    Globe,
    HelpCircle,
    LayoutDashboard,
    LockKeyhole,
    MessageSquare,
    Newspaper,
    PlugZap,
    Search,
    Smile,
    Sparkles,
    Timer,
} from 'lucide-react';

const sections = [
    {
        id: 'dashboard',
        icon: LayoutDashboard,
        title: 'Dashboard',
        items: [
            'Add widgets using the + Add button in the top right — search by name or browse by category.',
            'Drag widgets to reorder them in Grid mode, or freely position them in Free canvas mode.',
            'Group related widgets into folders to keep your dashboard tidy.',
            'Save different arrangements as Scenes and switch between them instantly.',
            'Hide a widget without deleting it using the context menu (⋯ on the widget).',
            'Use the floating bucket to temporarily stash widgets you want to access quickly later.',
        ],
    },
    {
        id: 'search',
        icon: Search,
        title: 'Search & Command',
        items: [
            'Press ⌘K (or Ctrl+K) to open the command palette from anywhere.',
            'Search for widgets, pages, settings, and recent files in one place.',
            'Navigate to any page or feature without using the menu.',
            'The command center also surfaces suggested actions based on your current context.',
        ],
    },
    {
        id: 'reading',
        icon: BookOpen,
        title: 'Reading',
        items: [
            'Open the Reading widget to browse your document library — Bible, Quran, uploaded PDFs, and ebooks.',
            'Highlight text by selecting it while reading; highlights are saved automatically.',
            'Add notes to any highlighted passage or any chapter.',
            'Bookmark any position to return to it quickly.',
            'Search within a document using the search panel icon in the toolbar.',
            'Compare Bible translations side-by-side using the version selector.',
            'Upload PDFs through the Files widget and they will appear in your Reading library.',
        ],
    },
    {
        id: 'tracking',
        icon: Timer,
        title: 'Tracking',
        items: [
            'Log sleep, workouts, meals, mood, supplements, or any custom category from the Tracking page.',
            'The left column shows your log and filters; the right column shows insights and automation.',
            'Use the Quick Entry form to add an entry in seconds.',
            'Set goals per category in the Goals tab to see progress over time.',
            'The Insights panel surfaces AI-generated observations about your tracking patterns.',
            'Recovery Trackers (streaks) live in the Recovery tab — add one from the + Add tracker button.',
        ],
    },
    {
        id: 'mood',
        icon: Smile,
        title: 'Mood',
        items: [
            'Log your daily mood from the Mood widget on the dashboard.',
            'Tap any of the past 7 days at the bottom of the widget to log or edit an earlier day.',
            'The Mood page shows your full history with weekly trends.',
            'Duplicate mood widgets can be added to your dashboard — they all reflect the same data.',
        ],
    },
    {
        id: 'memorization',
        icon: Brain,
        title: 'Memorization',
        items: [
            'The Memorization page uses spaced repetition to help you retain information.',
            'Review cards are drawn from your reading highlights, knowledge graph, and uploaded documents.',
            'Grade each card after reviewing: Again, Hard, Medium, or Easy.',
            'Cards you mark Easy appear less often; cards marked Again appear sooner.',
            'Use the "Generate cards" button to create new cards from recent highlights.',
            'Enable review routines to build a daily recall habit.',
        ],
    },
    {
        id: 'news',
        icon: Newspaper,
        title: 'News',
        items: [
            'The News widget shows your personalized feed — the most recent articles appear first.',
            'Click Refresh to fetch the latest updates.',
            'Use "View all →" to open the full news page with filtering options.',
            'Manage news sources and topics from the integrations settings.',
        ],
    },
    {
        id: 'automation',
        icon: Cable,
        title: 'Automation',
        items: [
            'The Automation widget surfaces actions extracted from your emails and calendar.',
            'Review each action before approving — no action is taken without your confirmation.',
            'Approve to execute, dismiss to ignore, or snooze for later.',
            'Configure automation workflows in the Automation page.',
        ],
    },
    {
        id: 'view',
        icon: FolderOpen,
        title: 'View Workspace',
        items: [
            'The View page is a document inspection workspace for uploaded files.',
            'Upload files using the Upload button in the file browser sidebar.',
            'Supported file types: PDF, images, CSV, and text files.',
            'Use the layer toggle in the inspector to control what is rendered.',
            'Add comments to any document using the comment button in the toolbar.',
        ],
    },
    {
        id: 'files',
        icon: FolderOpen,
        title: 'Files',
        items: [
            'Upload files from the Files widget on your dashboard.',
            'Uploaded files are available across Reading, View, and the Context Diagram.',
            'Files are stored securely in your private storage bucket.',
            'Delete files from the Files widget by hovering and clicking the trash icon.',
        ],
    },
    {
        id: 'integrations',
        icon: PlugZap,
        title: 'Integrations',
        items: [
            'Connect Gmail, Google Calendar, and Google Drive from Settings → Integrations.',
            'Connected Gmail surfaces email actions, summaries, and inbox intelligence.',
            'Connected Calendar enables event creation, reminders, and scheduling from automation.',
            'Connected Drive makes your documents available in Files and Reading.',
            'Each integration can be disconnected at any time without deleting your data.',
        ],
    },
    {
        id: 'privacy',
        icon: LockKeyhole,
        title: 'Privacy & Permissions',
        items: [
            'Sensitive widgets (Finance, Recovery, Health) can be blurred when sharing your screen.',
            'Enable low-profile display mode from the widget context menu.',
            'Your data is stored in your own account — never shared with other users.',
            'Feedback submitted from the feedback page is fully anonymous.',
            'You can delete your account and all data from Settings → Account.',
        ],
    },
    {
        id: 'ai',
        icon: Sparkles,
        title: 'AI & Intelligence',
        items: [
            'AI features run in the background and never block the page.',
            'Suggestions in tracking, memorization, and automation are generated from your data only.',
            'AI summaries of documents and emails are surfaced in context — not sent anywhere.',
            'You can disable AI features per-surface from the relevant settings page.',
        ],
    },
    {
        id: 'web',
        icon: Globe,
        title: 'Browser & Mobile',
        items: [
            'webwidgets works in Chrome, Firefox, Safari, and Edge.',
            'On mobile, a bottom navigation bar replaces the sidebar.',
            'Add webwidgets to your home screen from your browser\'s "Add to Home Screen" option.',
            'Your dashboard syncs across devices automatically.',
        ],
    },
];

export default function HelpPage() {
    return (
        <main id="main-content" className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-6 py-8 lg:px-12">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex h-7 items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                            <HelpCircle size={13} />
                            Help
                        </span>
                    </div>
                    <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                        How webwidgets works
                    </h1>
                    <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm">
                        Everything you need to get the most out of your dashboard.
                    </p>
                </div>

                <div className="space-y-6">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <section
                                key={section.id}
                                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                            >
                                <div className="flex items-center gap-2.5 mb-4">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                        <Icon size={16} />
                                    </span>
                                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                        {section.title}
                                    </h2>
                                </div>
                                <ul className="space-y-2">
                                    {section.items.map((item, i) => (
                                        <li
                                            key={i}
                                            className="flex gap-2.5 text-sm text-zinc-600 dark:text-zinc-400 leading-6"
                                        >
                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        );
                    })}
                </div>

                <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center gap-2.5 mb-3">
                        <MessageSquare size={16} className="text-zinc-400" />
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            Something missing?
                        </h2>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        If you can&apos;t find what you&apos;re looking for or found a bug, submit feedback from the{' '}
                        <a href="/feedback" className="text-[#4f6ef7] hover:underline">feedback page</a>.
                        All responses are anonymous.
                    </p>
                </div>
            </div>
        </main>
    );
}
