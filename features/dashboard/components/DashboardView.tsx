import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { Tracker } from '@/features/recovery/types/recovery';
import { useAuth } from '@/features/auth/hooks/useAuth';
import Header from '@/features/ui/components/Header';
import DashboardGrid from './DashboardGrid';
import HiddenWidgetsTray from './HiddenWidgetsTray';
import { useDashboardLayout } from '@/features/dashboard/hooks/useDashboardLayout';
import Footer from '@/features/ui/components/Footer';
import { useGreeting } from '@/features/dashboard/hooks/useGreeting';

export default function Dashboard() {
    const { firstName } = useAuth();
    const [trackers, setTrackers] = useState<Tracker[] | null>(null);
    const { layout, updateLayout, toggleVisibility, ready } =
        useDashboardLayout(trackers);
    const greeting = useGreeting(firstName);

    // This function now handles the database operations AND updates local state
    const handleReset = async (id: string, newStartTime: string) => {
        // Update the database
        await supabase
            .from('relapses')
            .insert({ relapsed_at: newStartTime, tracker_id: id });
        await supabase
            .from('recovery_profiles')
            .update({ start_time: newStartTime })
            .eq('id', id);

        // Update local state
        setTrackers((prev) =>
            prev
                ? prev.map((t) =>
                      t.id === id ? { ...t, start_time: newStartTime } : t,
                  )
                : prev,
        );
    };

    useEffect(() => {
        const fetchTrackers = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from('recovery_profiles')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });
            setTrackers(data || []);
        };
        fetchTrackers();
    }, []);

    const hiddenWidgets = layout.filter((w) => !w.visible);

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
                <main className="max-w-7xl mx-auto p-6 lg:p-12">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">
                                Command Center
                            </h1>
                            <p className="text-gray-500 dark:text-zinc-400">
                                {greeting || `Welcome back, ${firstName}.`}
                            </p>
                        </div>
                    </div>

                    {ready ? (
                        <DashboardGrid
                            layout={layout}
                            onLayoutChange={updateLayout}
                            onToggleVisible={toggleVisibility}
                            onReset={handleReset} // ← Now using the correct handler
                        />
                    ) : (
                        <div className="flex justify-center py-24">
                            <div className="w-5 h-5 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Tray for re-showing hidden widgets */}
                    {hiddenWidgets.length > 0 && (
                        <HiddenWidgetsTray
                            hidden={hiddenWidgets}
                            onRestore={toggleVisibility}
                        />
                    )}
                </main>
            </div>
            <Footer />
        </>
    );
}
