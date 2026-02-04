"use client";
import { House, Users, Plus, MessageSquare, User, Video } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { icon: House, label: "Home", href: "/home" },
        { icon: Users, label: "Communities", href: "/communities" },
        { icon: Video, label: "Videos", href: "/video" },
        { icon: Plus, label: "Create", href: "/communities/create", isMain: true },
        { icon: MessageSquare, label: "Messages", href: "/messages" },
        { icon: User, label: "Profile", href: "/profile" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 md:hidden flex items-center justify-around px-2 py-2 safe-area-bottom">
            {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                if (item.isMain) {
                    return (
                        <Link key={index} href={item.href} className="bg-primary text-white p-3 rounded-full -mt-8 shadow-lg border-4 border-white">
                            <Icon size={24} />
                        </Link>
                    );
                }

                return (
                    <Link
                        key={index}
                        href={item.href}
                        className={`flex flex-col items-center p-2 rounded-lg transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Icon size={24} />
                        <span className="text-xs mt-1">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
