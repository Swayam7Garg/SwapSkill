import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Compass, MessageSquare, Award } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative overflow-hidden">
      {/* Background Neon Glows */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full bg-secondary/10 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="h-20 flex items-center justify-between px-8 md:px-16 border-b border-white/5 relative z-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">
            Skill<span className="text-gradient-primary">Swap</span>
          </span>
        </div>

        <Link
          href="/sign-in"
          className="px-4 py-2 border border-white/10 hover:border-primary/50 rounded-xl text-xs font-bold text-white transition-all bg-white/5"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto py-16 relative z-10 space-y-8">
        {/* Banner Announcement */}
        <div className="px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-[10px] font-bold text-primary tracking-wide uppercase animate-pulse">
          🚀 peer-to-peer student marketplace
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
          Exchange Skills. <br />
          Grow Together. <br />
          <span className="text-gradient-primary">Zero Cost.</span>
        </h1>

        {/* Hero Description */}
        <p className="text-sm md:text-base text-white/60 max-w-xl mx-auto leading-relaxed font-medium">
          The ultimate peer-to-peer learning network for college students. Swap your knowledge in programming, languages, UI/UX, or music with fellow campus peers.
        </p>

        {/* Hero CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-4">
          <Link
            href="/sign-in"
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-primary to-secondary text-xs font-bold text-white rounded-xl flex items-center justify-center gap-1.5 hover:opacity-95 transition-all shadow-lg shadow-primary/20 hover:scale-[1.02]"
          >
            <span>Start Swapping Today</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </Link>
          <Link
            href="/browse"
            className="w-full sm:w-auto px-8 py-3.5 border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold text-white transition-all bg-white/5 hover:scale-[1.02]"
          >
            Explore Student Directory
          </Link>
        </div>

        {/* Product Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-16 w-full text-left">
          {/* Feature 1 */}
          <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary">
              <Compass className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-sm text-white">Smart Matchmaking</h3>
            <p className="text-xs text-white/55 leading-relaxed">
              Find partners whose teaching skills match your learning goals, sorted automatically by overlap.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <MessageSquare className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-sm text-white">Real-Time Alerts</h3>
            <p className="text-xs text-white/55 leading-relaxed">
              Receive live notifications for swap request updates and class timers over Socket.io.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-green-500/15 border border-green-500/20 flex items-center justify-center text-green-400">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-sm text-white">Easy Scheduling</h3>
            <p className="text-xs text-white/55 leading-relaxed">
              Schedule meetings with integrated Google Meet links. Stay structured with custom duration limits.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <Award className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-sm text-white">Campus Reputation</h3>
            <p className="text-xs text-white/55 leading-relaxed">
              Collect star ratings and reviews from classmates. Scale the ranks on the public leaderboard.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 flex items-center justify-center text-[10px] text-white/30 border-t border-white/5 mt-8 relative z-10 max-w-7xl mx-auto w-full">
        <span>© 2026 SkillSwap P2P Network. Built for student collaboration.</span>
      </footer>
    </div>
  );
}
