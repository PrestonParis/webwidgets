"use client";

import Header from "@/components/Global/Header";
import LogoutButton from "@/components/Global/SignOut";
import EmailWidget from "@/components/Widgets/EmailWidget";
import JournalWidget from "@/components/Widgets/JournalWidget";
import SoberWidget from "@/components/Widgets/RecoveryWidget";
import StockWidget from "@/components/Widgets/StockWidget";

export default function Page() {
    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto p-6 lg:p-12">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
                    <p className="text-gray-500">Welcome back, Preston.</p>
                </div>
                <LogoutButton />
            </div>
            {/* The Grid: 1 col on mobile, 2 on tablet, 3-4 on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    
                    {/* Widget 1: Journal Snapshot */}
                    <JournalWidget />

                    {/* Widget 2: Email Inbox Snapshot */}
                    <EmailWidget />

                    {/* Widget 3: Addiction Recovery Timer */}
                    <SoberWidget startTime={null} />
                    
                    {/* Future - Stock Volatility (NVIDIA/AMD) */}
                    <StockWidget />

                    {/* Crypto Tracker (AVAX) */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm opacity-50 flex flex-col justify-center items-center border-dashed">
                        <span className="text-gray-400 font-medium">Add New Widget</span>
                    </div>
                </div>
            </main>
        </div>
        </>
        
    );
}