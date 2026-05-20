'use client';

import Link from 'next/link';
import { WandSparkles, Network, Shield } from 'lucide-react';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { useIsAdmin } from '@/features/admin/hooks/useIsAdmin';
import { SettingsIntegrationsCard } from './SettingsIntegrationsCard';
import { SettingsProfileCard } from './SettingsProfileCard';
import { EmailIntelligenceCard } from './EmailIntelligenceCard';
import { BackgroundPickerPanel } from './BackgroundPickerPanel';
import { WidgetManagerCard } from './WidgetManagerCard';
import { BillingCard } from '@/features/billing/components/BillingCard';
import { ApiKeyConfigPanel } from '@/features/chatbot/components/ApiKeyConfigPanel';

export default function SettingsHomePage() {
    const {
        user,
        fullName,
        setFullName,
        loading,
        saving,
        isGmailConnected,
        isCalendarConnected,
        useAIEmail,
        anthropicApiKey,
        setAnthropicApiKey,
        handleGoogleConnect,
        handleConnectCalendar,
        handleGoogleDisconnect,
        handleSave,
        handleToggleAIEmail,
        handleSaveApiKey,
    } = useSettings();
    const { isAdmin } = useIsAdmin();

    if (loading) {
        return (
            <div className="p-6 text-sm text-gray-400">Loading settings...</div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-xl font-bold">Settings</h1>
                <p className="text-sm text-gray-500">
                    Manage your account and preferences
                </p>
            </div>
            {isAdmin && (
                <Link
                    href="/admin"
                    className="flex items-center justify-between rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 p-5 transition hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                >
                    <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            Admin Suite
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage users, feature flags, audit logs, metrics,
                            and system settings.
                        </p>
                    </div>
                    <Shield className="h-5 w-5 text-indigo-500" />
                </Link>
            )}
            <Link
                href="/onboarding"
                className="flex items-center justify-between rounded-lg border border-gray-200 p-5 transition hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
                <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        Workspace setup
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                        Revisit goals, integrations, automations, and layout
                        recommendations.
                    </p>
                </div>
                <WandSparkles className="h-5 w-5 text-[#4f6ef7]" />
            </Link>
            <Link
                href="/context"
                className="flex items-center justify-between rounded-lg border border-gray-200 p-5 transition hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
                <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        Context diagram
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                        View and edit your knowledge graph — goals, widgets,
                        integrations, and AI memory.
                    </p>
                </div>
                <Network className="h-5 w-5 text-[#4f6ef7]" />
            </Link>
            <EmailIntelligenceCard
                useAI={useAIEmail}
                apiKey={anthropicApiKey}
                saving={saving}
                onToggleAI={handleToggleAIEmail}
                onApiKeyChange={setAnthropicApiKey}
                onSave={() => {
                    void handleSaveApiKey();
                }}
            />
            <SettingsIntegrationsCard
                isGmailConnected={isGmailConnected}
                isCalendarConnected={isCalendarConnected}
                onConnect={() => {
                    void handleGoogleConnect();
                }}
                onDisconnect={() => {
                    void handleGoogleDisconnect();
                }}
                onConnectCalendar={() => {
                    void handleConnectCalendar();
                }}
            />
            <BillingCard />
            <ApiKeyConfigPanel />
            <WidgetManagerCard />
            <div className="p-6 rounded-2xl border border-gray-200 dark:border-zinc-800">
                <BackgroundPickerPanel />
            </div>
            {user && (
                <SettingsProfileCard
                    user={user}
                    fullName={fullName}
                    saving={saving}
                    onNameChange={setFullName}
                    onSave={() => {
                        void handleSave();
                    }}
                />
            )}
        </div>
    );
}
