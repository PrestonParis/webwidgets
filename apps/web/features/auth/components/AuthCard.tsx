import { AuthCardProps } from '@/features/auth/types/auth';

export const AuthCard = ({ children }: AuthCardProps) => {
    return (
        <div className="bg-[#111118] border border-white/8 rounded-2xl p-7 shadow-2xl">
            {children}
        </div>
    );
};
