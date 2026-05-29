'use client';

import { type Dispatch, type SetStateAction, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { cn } from '@/lib/utils/utils';
import type { ProjectRecord } from '../hooks/useCreativeStudio';

interface CreativeProjectPanelProps {
    projects: ProjectRecord[];
    selectedProjectId: string;
    setSelectedProjectId: (id: string) => void;
    createProject: (data: {
        title: string;
        description?: string;
        format?: string;
    }) => Promise<unknown>;
    loading: boolean;
    showProjectForm: boolean;
    setShowProjectForm: Dispatch<SetStateAction<boolean>>;
}

export function CreativeProjectPanel({
    projects,
    selectedProjectId,
    setSelectedProjectId,
    createProject,
    loading,
    showProjectForm,
    setShowProjectForm,
}: CreativeProjectPanelProps) {
    const toast = useToastContext();
    const [projTitle, setProjTitle] = useState('');
    const [projDesc, setProjDesc] = useState('');
    const [projFormat, setProjFormat] = useState('1440 x 960');
    const [projSubmitting, setProjSubmitting] = useState(false);

    async function handleCreateProject(e: React.FormEvent) {
        e.preventDefault();
        if (!projTitle.trim()) return;
        setProjSubmitting(true);
        try {
            await createProject({
                title: projTitle.trim(),
                ...(projDesc.trim() ? { description: projDesc.trim() } : {}),
                format: projFormat,
            });
            setProjTitle('');
            setProjDesc('');
            setProjFormat('1440 x 960');
            setShowProjectForm(false);
            toast.success('Project created.');
        } catch {
            toast.error('Failed to create project.');
        } finally {
            setProjSubmitting(false);
        }
    }

    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                    Project
                </h2>
                <Button
                    size="sm"
                    variant="secondary"
                    icon={Plus}
                    onClick={() => setShowProjectForm(true)}
                >
                    New
                </Button>
            </div>

            {showProjectForm && (
                <form
                    onSubmit={(e) => void handleCreateProject(e)}
                    className="mb-3 space-y-2"
                >
                    <input
                        value={projTitle}
                        onChange={(e) => setProjTitle(e.target.value)}
                        placeholder="Project title *"
                        required
                        className="w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                    <input
                        value={projDesc}
                        onChange={(e) => setProjDesc(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                    <select
                        value={projFormat}
                        onChange={(e) => setProjFormat(e.target.value)}
                        className="w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                        <option value="1440 x 960">1440 x 960</option>
                        <option value="1080 x 1080">1080 x 1080</option>
                        <option value="1920 x 1080">1920 x 1080</option>
                    </select>
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={projSubmitting}
                        >
                            {projSubmitting ? 'Creating…' : 'Create'}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setShowProjectForm(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            )}

            {loading ? (
                <p className="text-xs text-zinc-400">Loading…</p>
            ) : projects.length === 0 ? (
                <div className="rounded-lg bg-zinc-50 p-4 text-center dark:bg-zinc-950">
                    <p className="text-xs text-zinc-500">No projects yet.</p>
                    <Button
                        className="mt-2"
                        size="sm"
                        icon={Plus}
                        onClick={() => setShowProjectForm(true)}
                    >
                        Create your first project
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {projects.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedProjectId(p.id)}
                            className={cn(
                                'w-full rounded-lg border p-2 text-left text-sm transition',
                                selectedProjectId === p.id
                                    ? 'border-blue-400 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/25'
                                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700',
                            )}
                        >
                            <p className="font-medium text-zinc-950 dark:text-zinc-50 truncate">
                                {p.title}
                            </p>
                            <p className="text-xs text-zinc-500">{p.format}</p>
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
