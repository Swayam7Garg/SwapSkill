"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppAuth } from "../../components/AuthProvider";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Search,
  Inbox,
  Calendar,
  Trophy,
  User,
  Users,
  Moon,
  Sparkles,
} from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, clerkActive, mockUserId, changeMockUser } = useAppAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Browse peers", href: "/browse", icon: Search },
    { name: "Requests inbox", href: "/requests", icon: Inbox },
    { name: "My sessions", href: "/sessions", icon: Calendar },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "My profile", href: "/profile/me", icon: User },
  ];

  // List of mock users matching seed data for easy switcher
  const mockUsersList = [
    { id: "user_demo_1", name: "Alex (React & TypeScript)" },
    { id: "user_demo_2", name: "Sofia (Figma & UI/UX)" },
    { id: "user_demo_3", name: "Carlos (Guitar & Spanish)" },
    { id: "user_demo_4", name: "Elena (Calculus & Stats)" },
    { id: "user_demo_5", name: "Jordan (Cooking & Yoga)" },
    { id: "user_demo_6", name: "Liam (Python & AWS)" },
    { id: "user_demo_7", name: "Maya (Public Speaking)" },
    { id: "user_demo_8", name: "David (Photography)" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
          <div className="absolute inset-2 rounded-full border-t-2 border-secondary animate-spin [animation-delay:0.2s]" />
        </div>
        <p className="text-white/60 text-sm animate-pulse">Syncing SkillSwap secure session...</p>
      </div>
    );
  }

  // If user is not authenticated and Clerk is active, redirect should happen or show Clerk Sign In
  if (clerkActive && !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center gap-4">
        <p className="text-white/80">Please sign in to access SkillSwap.</p>
        <Link
          href="/sign-in"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-95 transition-all font-semibold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 glass-panel border-r border-white/5 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 shadow-[5px_0_25px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col flex-1">
          {/* Logo */}
          <div className="h-16 flex items-center gap-2.5 px-6 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary via-secondary to-accent flex items-center justify-center shadow-lg shadow-accent/20 animate-pulse">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              Skill<span className="text-gradient-cyan">Swap</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/5 border border-white/10 text-white shadow-[0_0_15px_rgba(0,242,254,0.08)]"
                      : "text-white/60 hover:text-white hover:bg-white/[0.03] hover:translate-x-1"
                  }`}
                >
                  {/* Left glow line for active state */}
                  {isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-primary via-secondary to-accent shadow-[0_0_10px_rgba(0,242,254,0.6)]" />
                  )}
                  <item.icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? "text-accent animate-pulse" : "text-white/60 group-hover:text-white"
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer profile summary */}
        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <img
              src={user?.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg"}
              alt={user?.name}
              className="w-10 h-10 rounded-full border border-white/10 object-cover bg-white/5"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-white/40 truncate">{user?.college || "SkillSwapper"}</p>
            </div>
            {clerkActive && (
              <div className="scale-90">
                <UserButton />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 glass-panel border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 font-medium capitalize">
              {pathname === "/dashboard" ? "Overview" : pathname.replace("/", "").replace("-", " ")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Developer Sandbox User Switcher */}
            {!clerkActive && (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                  <Users className="w-3.5 h-3.5" />
                  <span>Sandbox Mode:</span>
                </div>
                <select
                  value={mockUserId}
                  onChange={(e) => changeMockUser(e.target.value)}
                  className="bg-background/80 text-xs border border-white/10 rounded-lg px-2 py-1 text-white font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {mockUsersList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dark Mode Icon Indicator */}
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/70">
              <Moon className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
