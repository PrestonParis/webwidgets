import { GoogleIcon } from '@/icons/GoogleIcon';
import { SettingsIntegrationCardProps } from '@/features/settings/types/settings';

function IntegrationRow({
    icon,
    name,
    statusText,
    isConnected,
    onConnect,
    onDisconnect,
}: {
    icon: React.ReactNode;
    name: string;
    statusText: string;
    isConnected: boolean;
    onConnect?: () => void;
    onDisconnect?: () => void;
}) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                        {name}
                    </p>
                    <p className="text-xs text-gray-500">{statusText}</p>
                </div>
            </div>
            {isConnected ? (
                onDisconnect && (
                    <button
                        onClick={onDisconnect}
                        className="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-2"
                    >
                        Disconnect
                    </button>
                )
            ) : (
                <button
                    onClick={onConnect}
                    className="text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                >
                    Connect
                </button>
            )}
        </div>
    );
}

export function SettingsIntegrationsCard({
    isGmailConnected,
    isCalendarConnected,
    onConnect,
    onDisconnect,
    onConnectCalendar,
}: SettingsIntegrationCardProps) {
    return (
        <div className="space-y-4 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                Integrations
            </h2>

            <IntegrationRow
                icon={<GoogleIcon />}
                name="Gmail"
                statusText={
                    isGmailConnected
                        ? 'Connected to your inbox'
                        : 'Not connected'
                }
                isConnected={isGmailConnected}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />

            <IntegrationRow
                icon={<span className="text-xl">📅</span>}
                name="Google Calendar"
                statusText={
                    isCalendarConnected
                        ? 'Events and deadlines synced'
                        : isGmailConnected
                          ? 'Not connected — connect to surface events from emails'
                          : 'Connect Gmail first'
                }
                isConnected={isCalendarConnected}
                {...(isGmailConnected ? { onConnect: onConnectCalendar } : {})}
            />
        </div>
    );
}
