'use client';

import { ListChecks, RefreshCw } from 'lucide-react';
import { CommitmentCandidateCard } from './CommitmentCandidateCard';
import { useCommitmentCandidates } from '../hooks/useCommitmentCandidates';

export function CommitmentCandidatesPanel() {
    const candidates = useCommitmentCandidates();
    const records = candidates.query.data?.candidates ?? [];
    return (
        <section
            aria-labelledby="commitment-candidates-heading"
            className="mb-8 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2
                        className="flex items-center gap-2 font-semibold"
                        id="commitment-candidates-heading"
                    >
                        <ListChecks aria-hidden size={17} /> Commitment
                        candidates
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500">
                        Editable suggestions from authorized email signals. They
                        never execute themselves.
                    </p>
                </div>
                <button
                    className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950"
                    disabled={candidates.generate.isPending}
                    onClick={() => candidates.generate.mutate()}
                    type="button"
                >
                    <RefreshCw
                        aria-hidden
                        className={
                            candidates.generate.isPending ? 'animate-spin' : ''
                        }
                        size={13}
                    />
                    {candidates.generate.isPending
                        ? 'Reviewing…'
                        : 'Review signals'}
                </button>
            </header>
            {candidates.query.isLoading ? (
                <p className="py-5 text-sm text-zinc-500">
                    Loading candidates…
                </p>
            ) : null}
            {candidates.query.isError || candidates.generate.isError ? (
                <p className="py-5 text-sm text-red-600" role="alert">
                    Candidate review is unavailable. No action was taken.
                </p>
            ) : null}
            {!candidates.query.isLoading && !records.length ? (
                <p className="py-5 text-sm text-zinc-500">
                    No supported dated commitments need review.
                </p>
            ) : null}
            <div className="mt-4 grid gap-3">
                {records.map((candidate) => (
                    <CommitmentCandidateCard
                        candidate={candidate}
                        disabled={candidates.review.isPending}
                        key={candidate.id}
                        onReview={(body) =>
                            candidates.review.mutate({
                                candidateId: candidate.id,
                                body,
                            })
                        }
                    />
                ))}
            </div>
        </section>
    );
}
