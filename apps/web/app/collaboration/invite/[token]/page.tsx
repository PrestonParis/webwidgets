import { AlertCircle, Users } from 'lucide-react';
import { AcceptInviteButton } from './AcceptInviteButton';

interface InviteInfo {
    id: string;
    workspace_id: string;
    email: string;
    role: string;
    status: string;
    expires_at: string;
    workspaceName: string;
    workspaceScope: string;
}

interface InvitePageData {
    invite?: InviteInfo;
    error?: string;
}

async function getInvite(token: string): Promise<InvitePageData> {
    try {
        const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL ??
            (process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : 'http://localhost:3000');
        const res = await fetch(
            `${baseUrl}/api/collaboration/invites/${token}`,
            {
                cache: 'no-store',
            },
        );
        if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
                error?: string;
            };
            return { error: body.error ?? 'Invalid invite link.' };
        }
        const data = (await res.json()) as { invite: InviteInfo };
        return { invite: data.invite };
    } catch {
        return { error: 'Unable to load invite. Please try again later.' };
    }
}

export default async function InvitePage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const { invite, error } = await getInvite(token);

    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    {error ? (
                        <div className="space-y-4 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30">
                                <AlertCircle
                                    size={24}
                                    className="text-rose-500"
                                />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                    Invite unavailable
                                </h1>
                                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                                    {error}
                                </p>
                            </div>
                            <a
                                href="/collaboration"
                                className="inline-flex h-8 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
                            >
                                Go to Collaboration
                            </a>
                        </div>
                    ) : invite ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
                                    <Users
                                        size={20}
                                        className="text-blue-600 dark:text-blue-400"
                                    />
                                </div>
                                <div>
                                    <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                        You&apos;ve been invited
                                    </h1>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Workspace collaboration invite
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-500 dark:text-zinc-400">
                                        Workspace
                                    </span>
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                        {invite.workspaceName}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-500 dark:text-zinc-400">
                                        Scope
                                    </span>
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                        {invite.workspaceScope}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-500 dark:text-zinc-400">
                                        Your role
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium capitalize text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                                        {invite.role}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-500 dark:text-zinc-400">
                                        Sent to
                                    </span>
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                        {invite.email}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-500 dark:text-zinc-400">
                                        Expires
                                    </span>
                                    <span className="text-zinc-700 dark:text-zinc-300">
                                        {new Date(
                                            invite.expires_at,
                                        ).toLocaleDateString(undefined, {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>

                            <AcceptInviteButton token={token} />
                        </div>
                    ) : null}
                </div>
            </div>
        </main>
    );
}
