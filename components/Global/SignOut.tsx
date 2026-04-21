"use client";
import { useAuth } from "@/hooks/useAuth";

export default function LogoutButton() {
    const { signOut } = useAuth();

    return (
        <button 
            onClick={signOut}
            className="px-4 py-2 bg-red-600 text-white rounded"
        >
            Sign Out
        </button>
    );
}