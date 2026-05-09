'use client';

import Header from '@/features/ui/components/Header';
import Footer from '@/features/ui/components/Footer';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { SettingsIntegrationsCard } from './SettingsIntegrationsCard';
import { SettingsProfileCard } from './SettingsProfileCard';
import { EmailIntelligenceCard } from './EmailIntelligenceCard';

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

    if (loading) {
        return (
            <div className="p-6 text-sm text-gray-400">Loading settings...</div>
        );
    }

    return (
        <>
            <Header />
            <div className="max-w-2xl mx-auto p-6 space-y-8 min-h-[80vh]">
                <div>
                    <h1 className="text-xl font-bold">Settings</h1>
                    <p className="text-sm text-gray-500">
                        Manage your account and preferences
                    </p>
                </div>
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
            <Footer />
        </>
    );
}
