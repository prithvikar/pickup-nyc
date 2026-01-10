"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, List, PlusCircle, User } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Navbar() {
    const pathname = usePathname();

    const navItems = [
        {
            name: "Map",
            href: "/",
            icon: Map,
        },
        {
            name: "Courts",
            href: "/courts",
            icon: List,
        },
        {
            name: "Check-in",
            href: "/check-in",
            icon: PlusCircle,
            primary: true,
        },
        {
            name: "Profile",
            href: "/profile",
            icon: User,
        },
    ];

    return (
        <nav className="fixed bottom-6 left-4 right-4 z-50">
            <div className="glassmorphism mx-auto max-w-md rounded-2xl px-6 py-4 shadow-lg backdrop-blur-xl">
                <div className="flex items-center justify-between">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={twMerge(
                                    clsx(
                                        "flex flex-col items-center justify-center transition-all duration-300",
                                        isActive
                                            ? "text-tennis-green drop-shadow-[0_0_8px_rgba(204,255,0,0.4)]"
                                            : "text-zinc-400 hover:text-white"
                                    )
                                )}
                            >
                                <Icon
                                    size={item.primary ? 32 : 24}
                                    className={twMerge(
                                        clsx("transition-transform duration-300", isActive && "scale-110", item.primary && !isActive && "text-white")
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className="mt-1 text-[10px] font-medium tracking-wide">
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
