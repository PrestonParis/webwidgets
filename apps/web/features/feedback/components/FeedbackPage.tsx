'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

const FEEDBACK_TYPES = [
    { value: 'bug', label: 'Bug Report' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'general', label: 'General Feedback' },
    { value: 'question', label: 'Question' },
];

const FEATURE_AREAS = [
    'Dashboard',
    'Files & View',
    'Finance',
    'Chat',
    'Reading',
    'Tracking',
    'Command Center',
    'Settings',
    'Onboarding',
    'Other',
];

const HOW_HEARD_OPTIONS = [
    'Word of mouth',
    'Search engine',
    'Social media',
    'Newsletter',
    'Conference or event',
    'Other',
];

interface FormState {
    feedbackType: string;
    featureArea: string;
    satisfactionRating: number;
    whatIDid: string;
    whatIWanted: string;
    whatHappened: string;
    wantToSee: string;
    whatConfused: string;
    bugsFound: string;
    generalComment: string;
    howHeard: string;
}

const EMPTY: FormState = {
    feedbackType: '',
    featureArea: '',
    satisfactionRating: 0,
    whatIDid: '',
    whatIWanted: '',
    whatHappened: '',
    wantToSee: '',
    whatConfused: '',
    bugsFound: '',
    generalComment: '',
    howHeard: '',
};

function StarRating({
    value,
    onChange,
}: {
    value: number;
    onChange: (v: number) => void;
}) {
    const [hovered, setHovered] = useState(0);
    const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
    const active = hovered || value;
    return (
        <div className="flex items-center gap-3">
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                    <button
                        key={n}
                        type="button"
                        aria-label={`${n} star${n !== 1 ? 's' : ''}`}
                        onMouseEnter={() => setHovered(n)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => onChange(n === value ? 0 : n)}
                        className="text-2xl leading-none transition-transform hover:scale-110 focus:outline-none"
                    >
                        <span className={n <= active ? 'text-yellow-400' : 'text-gray-200 dark:text-zinc-700'}>
                            ★
                        </span>
                    </button>
                ))}
            </div>
            {active > 0 && (
                <span className="text-sm text-gray-500 dark:text-zinc-400">
                    {labels[active]}
                </span>
            )}
        </div>
    );
}

function PillGroup({
    options,
    value,
    onChange,
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(value === opt.value ? '' : opt.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        value === opt.value
                            ? 'bg-[#4f6ef7] border-[#4f6ef7] text-white'
                            : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-[#4f6ef7] hover:text-[#4f6ef7] dark:hover:text-[#7b93f9]'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

function AreaGrid({
    options,
    value,
    onChange,
}: {
    options: string[];
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(value === opt ? '' : opt)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                        value === opt
                            ? 'bg-[#4f6ef7]/10 border-[#4f6ef7] text-[#4f6ef7] dark:text-[#7b93f9] font-medium'
                            : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600'
                    }`}
                >
                    {opt}
                </button>
            ))}
        </div>
    );
}

function TextArea({
    id,
    placeholder,
    value,
    onChange,
    rows = 3,
}: {
    id: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    rows?: number;
}) {
    return (
        <textarea
            id={id}
            rows={rows}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#4f6ef7]/40 focus:border-[#4f6ef7]"
        />
    );
}

function Field({
    label,
    htmlFor,
    optional,
    children,
}: {
    label: string;
    htmlFor?: string;
    optional?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <label
                htmlFor={htmlFor}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-zinc-300"
            >
                {label}
                {optional && (
                    <span className="text-xs font-normal text-gray-400 dark:text-zinc-500">
                        optional
                    </span>
                )}
            </label>
            {children}
        </div>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                {title}
            </h2>
            {children}
        </div>
    );
}

export function FeedbackPage() {
    const router = useRouter();
    const [form, setForm] = useState<FormState>(EMPTY);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState('');

    function set<K extends keyof FormState>(field: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    const hasContent =
        form.feedbackType ||
        form.featureArea ||
        form.satisfactionRating > 0 ||
        form.whatIDid.trim() ||
        form.whatIWanted.trim() ||
        form.whatHappened.trim() ||
        form.wantToSee.trim() ||
        form.whatConfused.trim() ||
        form.bugsFound.trim() ||
        form.generalComment.trim();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!hasContent) return;
        setSubmitting(true);
        setSubmitError('');
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feedbackType: form.feedbackType || undefined,
                    featureArea: form.featureArea || undefined,
                    satisfactionRating: form.satisfactionRating || undefined,
                    whatIDid: form.whatIDid || undefined,
                    whatIWanted: form.whatIWanted || undefined,
                    whatHappened: form.whatHappened || undefined,
                    wantToSee: form.wantToSee || undefined,
                    whatConfused: form.whatConfused || undefined,
                    bugsFound: form.bugsFound || undefined,
                    generalComment: form.generalComment || undefined,
                    howHeard: form.howHeard || undefined,
                }),
            });
            if (!res.ok) throw new Error('Submission failed');
            setSubmitted(true);
        } catch {
            setSubmitError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    if (submitted) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="flex justify-center">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
                        Thanks for your feedback!
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Your response is completely anonymous and helps us improve
                        the product.
                    </p>
                    <div className="flex gap-3 justify-center pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setForm(EMPTY);
                                setSubmitted(false);
                            }}
                            className="px-4 py-2 rounded-lg text-sm border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Submit another
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/')}
                            className="px-4 py-2 rounded-lg text-sm bg-[#4f6ef7] text-white hover:bg-[#3a58e0] transition-colors"
                        >
                            Back to dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                    Share your feedback
                </h1>
                <p className="mt-1.5 text-sm text-gray-500 dark:text-zinc-400">
                    All responses are completely anonymous — no account information
                    is attached. Fill in any fields that apply.
                </p>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-10">
                <Section title="About your feedback">
                    <Field label="Type of feedback">
                        <PillGroup
                            options={FEEDBACK_TYPES}
                            value={form.feedbackType}
                            onChange={(v) => set('feedbackType', v)}
                        />
                    </Field>

                    <Field label="Which area?" optional>
                        <AreaGrid
                            options={FEATURE_AREAS}
                            value={form.featureArea}
                            onChange={(v) => set('featureArea', v)}
                        />
                    </Field>

                    <Field label="Overall satisfaction" optional>
                        <StarRating
                            value={form.satisfactionRating}
                            onChange={(v) => set('satisfactionRating', v)}
                        />
                    </Field>
                </Section>

                <div className="border-t border-gray-100 dark:border-zinc-800" />

                <Section title="Your experience">
                    <Field label="What were you doing?" htmlFor="fb-did" optional>
                        <TextArea
                            id="fb-did"
                            placeholder="Describe what you were doing when this came up…"
                            value={form.whatIDid}
                            onChange={(v) => set('whatIDid', v)}
                        />
                    </Field>

                    <Field
                        label="What were you trying to accomplish?"
                        htmlFor="fb-wanted"
                        optional
                    >
                        <TextArea
                            id="fb-wanted"
                            placeholder="What was your goal or expected outcome…"
                            value={form.whatIWanted}
                            onChange={(v) => set('whatIWanted', v)}
                        />
                    </Field>

                    <Field
                        label="What actually happened?"
                        htmlFor="fb-happened"
                        optional
                    >
                        <TextArea
                            id="fb-happened"
                            placeholder="Describe what happened instead — errors, unexpected behavior…"
                            value={form.whatHappened}
                            onChange={(v) => set('whatHappened', v)}
                        />
                    </Field>
                </Section>

                <div className="border-t border-gray-100 dark:border-zinc-800" />

                <Section title="Improvements">
                    <Field
                        label="What would you like to see?"
                        htmlFor="fb-see"
                        optional
                    >
                        <TextArea
                            id="fb-see"
                            placeholder="Feature ideas, improvements, things that would make this better…"
                            value={form.wantToSee}
                            onChange={(v) => set('wantToSee', v)}
                        />
                    </Field>

                    <Field
                        label="What was confusing or frustrating?"
                        htmlFor="fb-confused"
                        optional
                    >
                        <TextArea
                            id="fb-confused"
                            placeholder="Anything unclear, hard to find, or that didn't make sense…"
                            value={form.whatConfused}
                            onChange={(v) => set('whatConfused', v)}
                        />
                    </Field>

                    <Field
                        label="Any bugs or broken things?"
                        htmlFor="fb-bugs"
                        optional
                    >
                        <TextArea
                            id="fb-bugs"
                            placeholder="Describe what broke, including steps to reproduce if you know them…"
                            value={form.bugsFound}
                            onChange={(v) => set('bugsFound', v)}
                        />
                    </Field>
                </Section>

                <div className="border-t border-gray-100 dark:border-zinc-800" />

                <Section title="Anything else?">
                    <Field label="Additional comments" htmlFor="fb-general" optional>
                        <TextArea
                            id="fb-general"
                            rows={4}
                            placeholder="Anything else you'd like us to know…"
                            value={form.generalComment}
                            onChange={(v) => set('generalComment', v)}
                        />
                    </Field>

                    <Field label="How did you hear about us?" htmlFor="fb-heard" optional>
                        <select
                            id="fb-heard"
                            value={form.howHeard}
                            onChange={(e) => set('howHeard', e.target.value)}
                            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f6ef7]/40 focus:border-[#4f6ef7]"
                        >
                            <option value="">Select an option…</option>
                            {HOW_HEARD_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </Field>
                </Section>

                {submitError && (
                    <p className="text-sm text-red-500">{submitError}</p>
                )}

                <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                        Responses are anonymous and never linked to your account.
                    </p>
                    <button
                        type="submit"
                        disabled={!hasContent || submitting}
                        className="px-5 py-2 rounded-lg text-sm font-medium bg-[#4f6ef7] text-white hover:bg-[#3a58e0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        {submitting ? 'Sending…' : 'Send feedback'}
                    </button>
                </div>
            </form>
        </main>
    );
}
