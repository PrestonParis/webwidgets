"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
    const pathName = usePathname()
    const isActive = (path: string) => pathName === path
    
    return (
    <>
    <header className="main-header">
        <div className="logo">PKP-II</div>
        <nav>
        <ul className="nav-tabs">
            <li><Link href="/" className={isActive("/") ? "active": ""}>Home</Link></li>
            <li><Link href="/personaldash" className={isActive("/personaldash") ? "active": ""}>Personal Dashboard</Link></li>
            <li><Link href="/chessstudy" className={isActive("/chessstudy") ? "active": ""}>Chess Study</Link></li>
            <li><Link href="/guessvoice" className={isActive("/guessvoice") ? "active": ""}>Guess The Voice</Link></li>
            <li><Link href="/webext" className={isActive("/webext") ? "active": ""}>Web Extension</Link></li>
            <li><Link href="/apicollect" className={isActive("/apicollect") ? "active": ""}>API Collection</Link></li>
        </ul>
        </nav>
    </header>
    </>
    )}