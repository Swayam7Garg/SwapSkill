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
        <div className="w-10 h-10 border-t-2 border-white border-solid rounded-full animate-spin" />
        <p className="text-white/60 text-xs font-mono tracking-wider animate-pulse">SYNCING EXCHANGESKILL SECURE SESSION...</p>
      </div>
    );
  }

  // If user is not authenticated and Clerk is active, redirect should happen or show Clerk Sign In
  if (clerkActive && !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center gap-4">
        <p className="text-white/70 text-xs font-mono uppercase tracking-wider">Please sign in to access ExchangeSkill.</p>
        <Link
          href="/sign-in"
          className="px-5 py-2.5 bg-white text-black rounded text-xs font-mono uppercase hover:bg-white/90 transition-all"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-background subtle-border md:border-r border-b md:border-b-0 flex flex-col justify-between shrink-0 h-auto md:h-full crosshairs">
        <div className="flex flex-col flex-1">
          {/* Logo */}
          <div className="h-16 flex items-center gap-2.5 px-6 border-b border-white/5">
            <div className="w-8 h-8 rounded border border-white/20 flex items-center justify-center bg-white/[0.02]">
              <Sparkles className="w-4 h-4 text-white/80" />
            </div>
            <span className="font-bold text-sm tracking-widest font-mono text-white">
              EXCHANGESKILL // PROT
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-2 md:py-6 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded text-xs font-mono uppercase tracking-wider transition-all duration-300 group relative whitespace-nowrap ${
                    isActive
                      ? "text-white border border-white/20 bg-white/[0.02] shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                      : "text-white/50 border border-transparent hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <item.icon
                    className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                      isActive ? "text-white" : "text-white/50 group-hover:text-white"
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer profile summary (Hidden on mobile) */}
        <div className="p-4 border-t border-white/5 bg-white/[0.01] hidden md:block">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <img
              src={user?.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg"}
              alt={user?.name}
              className="w-10 h-10 rounded-full border border-white/10 object-cover bg-white/5"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-white/40 truncate">{user?.college || "ExchangeSkiller"}</p>
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
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 shrink-0 bg-background subtle-border border-b flex items-center justify-between px-4 md:px-8 crosshairs">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 font-medium capitalize">
              {pathname === "/dashboard" ? "Overview" : pathname.replace("/", "").replace("-", " ")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Developer Sandbox User Switcher */}
            {!clerkActive && (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded border border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/50 uppercase tracking-widest">
                  <Users className="w-3.5 h-3.5" />
                  <span>Sandbox Mode:</span>
                </div>
                <select
                  value={mockUserId}
                  onChange={(e) => changeMockUser(e.target.value)}
                  className="bg-background text-[10px] font-mono border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-white"
                >
                  {mockUsersList.map((m) => (
                    <option key={m.id} value={m.id} className="bg-black">
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
        <main className="flex-1 p-4 md:p-8 overflow-y-auto relative crosshairs">
          <div className="crosshairs-inner" />
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
        
        {/* Tracking Overlay (Aesthetic) */}
        <div className="hidden md:flex fixed bottom-4 right-8 gap-8 text-[9px] font-mono text-white/40 uppercase tracking-widest pointer-events-none z-50">
          <div className="flex flex-col gap-1">
            <span className="flex justify-between w-24"><span>Cursor X:</span><span className="text-white/80">SYS</span></span>
            <span className="flex justify-between w-24"><span>Cursor Y:</span><span className="text-white/80">ACT</span></span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="flex justify-between w-24"><span>Scroll:</span><span className="text-white/80">0.00</span></span>
            <span className="flex justify-between w-24"><span>Time:</span><span className="text-white/80">ONL</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
