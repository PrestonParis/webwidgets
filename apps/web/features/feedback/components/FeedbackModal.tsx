'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useState } from 'react';
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from '@/features/ui/components/Modal';
import { FormField, TextArea } from '@/features/ui/components/FormField';
import { Button } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';

interface FeedbackModalProps {
    onClose: () => void;
}

interface FormState {
    whatIDid: string;
    whatIWanted: string;
    wantToSee: string;
    whatConfused: string;
    bugsFound: string;
}

const EMPTY: FormState = {
    whatIDid: '',
    whatIWanted: '',
    wantToSee: '',
    whatConfused: '',
    bugsFound: '',
};

export function FeedbackModal({ onClose }: FeedbackModalProps) {
    const { success, error: showError } = useToastContext();
    const [form, setForm] = useState<FormState>(EMPTY);
    const [submitting, setSubmitting] = useState(false);

    function set(field: keyof FormState, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    const hasContent = Object.values(form).some(
        (v) => typeof v === 'string' && v.trim().length > 0,
    );

    async function handleSubmit() {
        if (!hasContent) return;
        setSubmitting(true);
        try {
            const res = await apiRouteFetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error('Submission failed');
            success('Thanks for your feedback!');
            onClose();
        } catch {
            showError('Could not submit feedback. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal
            open
            onClose={onClose}
            size="md"
            aria-labelledby="feedback-title"
        >
            <ModalHeader
                id="feedback-title"
                title="Share Feedback"
                description="All fields are optional. Answer any that apply."
                onClose={onClose}
            />

            <ModalBody className="space-y-4">
                <FormField label="What did you do?" htmlFor="fb-did">
                    <TextArea
                        id="fb-did"
                        rows={2}
                        placeholder="Describe what you were doing…"
                        value={form.whatIDid}
                        onChange={(e) => set('whatIDid', e.target.value)}
                    />
                </FormField>

                <FormField
                    label="What were you trying to do?"
                    htmlFor="fb-wanted"
                >
                    <TextArea
                        id="fb-wanted"
                        rows={2}
                        placeholder="What was your goal…"
                        value={form.whatIWanted}
                        onChange={(e) => set('whatIWanted', e.target.value)}
                    />
                </FormField>

                <FormField label="What do you want to see?" htmlFor="fb-see">
                    <TextArea
                        id="fb-see"
                        rows={2}
                        placeholder="Feature ideas, improvements…"
                        value={form.wantToSee}
                        onChange={(e) => set('wantToSee', e.target.value)}
                    />
                </FormField>

                <FormField label="What confused you?" htmlFor="fb-confused">
                    <TextArea
                        id="fb-confused"
                        rows={2}
                        placeholder="Anything unclear or frustrating…"
                        value={form.whatConfused}
                        onChange={(e) => set('whatConfused', e.target.value)}
                    />
                </FormField>

                <FormField label="Bugs or broken things?" htmlFor="fb-bugs">
                    <TextArea
                        id="fb-bugs"
                        rows={2}
                        placeholder="Describe what broke…"
                        value={form.bugsFound}
                        onChange={(e) => set('bugsFound', e.target.value)}
                    />
                </FormField>
            </ModalBody>

            <ModalFooter>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    loading={submitting}
                    disabled={!hasContent}
                    onClick={() => void handleSubmit()}
                >
                    Send Feedback
                </Button>
            </ModalFooter>
        </Modal>
    );
}
