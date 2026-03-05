"use client";
import { House, Users, Plus, MessageSquare, User, Clapperboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { icon: House, label: "Home", href: "/home" },
        { icon: Users, label: "Community", href: "/communities" },
        { icon: Plus, label: "Create", href: "/create", isMain: true },
        { icon: MessageSquare, label: "Messages", href: "/messages" },
        { icon: User, label: "Profile", href: "/profile" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-800/50 z-50 md:hidden flex items-center justify-around px-2 py-2 safe-area-bottom pb-4 transition-all duration-300">
            {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.label === "Video" && pathname.startsWith("/video"));

                if (item.isMain) {
                    return (
                        <Link key={index} href={item.href} className="bg-primary text-white p-3.5 rounded-full -mt-6 shadow-[0_8px_16px_rgba(128,5,23,0.3)] dark:shadow-[0_8px_16px_rgba(235,5,30,0.2)] border-4 border-[#FBFDFF] dark:border-black transform hover:scale-105 active:scale-95 transition-all duration-300">
                            <Icon size={24} strokeWidth={2.5} />
                        </Link>
                    );
                }

                return (
                    <Link
                        key={index}
                        href={item.href}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 group hover:bg-gray-50 dark:hover:bg-gray-900 ${isActive ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Icon
                            size={24}
                            strokeWidth={isActive ? 2.5 : 2}
                            className={`transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-105'}`}
                        />
                        <span className={`text-[10px] mt-1 font-medium transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
