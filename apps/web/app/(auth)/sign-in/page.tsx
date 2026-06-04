"use client";

import React from "react";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { isClerkActive } from "../../../lib/api";
import { Sparkles, ArrowRight, ShieldAlert } from "lucide-react";

export default function SignInPage() {
  const clerkActive = isClerkActive();

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center space-y-2 mb-8 relative z-10">
        <div className="inline-flex w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary items-center justify-center shadow-lg shadow-primary/20 mb-2">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h2 className="font-extrabold text-2xl tracking-tight text-white">
          Skill<span className="text-gradient-primary">Swap</span> Portal
        </h2>
        <p className="text-xs text-white/50">Secure peer-to-peer student exchange dashboard.</p>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {clerkActive ? (
          <div className="flex justify-center">
            <SignIn />
          </div>
        ) : (
          <div className="glass-panel border border-white/10 rounded-2xl p-8 space-y-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-white text-lg">Developer Sandbox Mode</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Clerk credentials are not configured in `.env.local`. The app is running in local sandbox mode with simulated developer logins.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-xs font-bold text-white rounded-xl flex items-center justify-center gap-1.5 hover:opacity-95 transition-all shadow-lg shadow-primary/15"
            >
              <span>Enter Swap Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="text-[10px] text-white/40 pt-2 border-t border-white/5">
              Syncing mock session user: <code className="text-primary bg-white/5 px-1 py-0.5 rounded">user_demo_1</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
