import { WebWidgetsIcon } from '@/icons/WebWidgetsIcon';

export const LogoWordmark = () => {
    return (
        <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#4f6ef7] flex items-center justify-center">
                    <WebWidgetsIcon />
                </div>
                <span className="text-white font-semibold text-lg tracking-tight">
                    Welcome to WebWidgets
                </span>
            </div>
            <p className="text-zinc-500 text-sm">
                Your personal dashboard. Sign in to continue.
            </p>
        </div>
    );
};
