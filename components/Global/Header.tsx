"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
    const pathName = usePathname()
    const isActive = (path: string) => pathName === path
    
    return (
    <>
    <header className="main-header">
        <nav>
        <ul className="nav-tabs">
            <li className="header-link"><Link href="/" className={isActive("/") ? "active": ""}>Home</Link></li>
        </ul>
        </nav>
    </header>
    </>
    )}