import { useState, useEffect, useRef } from 'react';
import type { FormFillerJob, FillFormProps } from '../types';

export function useFillFormRunner({
    profiles,
    onStartFill,
    onPollJob,
}: FillFormProps) {
    const [url, setUrl] = useState('');
    const [profileId, setProfileId] = useState('');
    const [running, setRunning] = useState(false);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [result, setResult] = useState<FormFillerJob | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = () => {
        if (!pollRef.current) return;
        clearInterval(pollRef.current);
        pollRef.current = null;
    };

    useEffect(() => {
        if (!profileId && profiles.length > 0) {
            const id = setTimeout(() => setProfileId(profiles[0]?.id ?? ''), 0);
            return () => clearTimeout(id);
        }
    }, [profiles, profileId]);

    useEffect(() => () => stopPolling(), []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim() || !profileId || running) return;

        setRunning(true);
        setResult(null);
        const jobId = await onStartFill(url.trim(), profileId);
        if (!jobId) {
            setRunning(false);
            return;
        }

        setActiveJobId(jobId);
        pollRef.current = setInterval(() => {
            void pollJob(
                jobId,
                onPollJob,
                stopPolling,
                setResult,
                setRunning,
                setActiveJobId,
            );
        }, 1500);
    };

    return {
        activeJobId,
        handleSubmit,
        profileId,
        result,
        running,
        setProfileId,
        setUrl,
        url,
    };
}

async function pollJob(
    jobId: string,
    onPollJob: FillFormProps['onPollJob'],
    stopPolling: () => void,
    setResult: (job: FormFillerJob) => void,
    setRunning: (running: boolean) => void,
    setActiveJobId: (jobId: string | null) => void,
): Promise<void> {
    const job = await onPollJob(jobId);
    if (!job || (job.status !== 'done' && job.status !== 'failed')) return;
    stopPolling();
    setResult(job);
    setRunning(false);
    setActiveJobId(null);
}
