import { LogoIsometric } from '@/icons/LogoIsometric';

export const LogoWordmark = () => {
    return (
        <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 mb-3">
                <LogoIsometric size={32} />
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
