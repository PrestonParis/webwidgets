import { GoogleIcon } from '@/icons/GoogleIcon';
import { SettingsIntegrationCardProps } from '@/types/settings';

export function SettingsIntegrationsCard({
    isGmailConnected,
    onConnect,
    onDisconnect,
}: SettingsIntegrationCardProps) {
    return (
        <div className="space-y-4 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                Integrations
            </h2>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                        <GoogleIcon />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                            Gmail
                        </p>
                        <p className="text-xs text-gray-500">
                            {isGmailConnected
                                ? 'Connected to your inbox'
                                : 'Not connected'}
                        </p>
                    </div>
                </div>
                {isGmailConnected ? (
                    <button
                        onClick={onDisconnect}
                        className="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-2"
                    >
                        Disconnect
                    </button>
                ) : (
                    <button
                        onClick={onConnect}
                        className="text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                    >
                        Connect
                    </button>
                )}
            </div>
        </div>
    );
}
