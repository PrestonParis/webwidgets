import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { Tracker } from "@/types/recovery";
import Header from "@/components/Global/Header";
import LogoutButton from "@/components/Global/SignOut";
import DashboardGrid from "./DashboardGrid";
import HiddenWidgetsTray from "./HiddenWidgetsTray";
import { useSession } from "next-auth/react";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";

export default function Dashboard() {
  const { data: session } = useSession();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const userId = (session?.user as { id?: string })?.id;

  const { layout, updateLayout, toggleVisibility, ready } =
    useDashboardLayout(userId, trackers);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const handleUpdateStart = (id: string, newStart: string) => {
    setTrackers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, start_time: newStart } : t))
    );
  };

  useEffect(() => {
    const fetchTrackers = async () => {
      const { data } = await supabase
        .from("recovery_profiles")
        .select("*")
        .order("created_at", { ascending: true });
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
                Welcome back, {firstName}.
              </p>
            </div>
            <LogoutButton />
          </div>

          {ready ? (
            <DashboardGrid
              layout={layout}
              onLayoutChange={updateLayout}
              onToggleVisible={toggleVisibility}
              onReset={handleUpdateStart}
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
    </>
  );
}