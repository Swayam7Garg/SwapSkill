"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import {
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Inbox,
  UserCheck,
  Zap,
  TrendingUp,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import SkillChip from "../../../components/SkillChip";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/dashboard");
      setData(res);
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
      setError(err.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleAcceptRequest = async (id: string) => {
    try {
      await apiFetch(`/requests/${id}/accept`, { method: "PATCH" });
      fetchDashboard(); // reload statistics
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await apiFetch(`/requests/${id}/reject`, { method: "PATCH" });
      fetchDashboard(); // reload statistics
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to format countdowns
  const getCountdown = (dateString: string) => {
    const diff = new Date(dateString).getTime() - Date.now();
    if (diff <= 0) return "Starting now";
    
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `In ${minutes} minutes`;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `In ${hours} hours`;
    
    const days = Math.floor(hours / 24);
    return `In ${days} days`;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4">
        <div className="w-10 h-10 border-t-2 border-primary border-solid rounded-full animate-spin" />
        <span className="text-xs text-white/50">Assembling metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-2xl max-w-xl mx-auto">
        <h4 className="font-bold text-sm mb-1">Failed to load overview data</h4>
        <p className="text-xs">{error}</p>
        <button onClick={fetchDashboard} className="mt-3 text-xs bg-rose-500 text-white px-3 py-1.5 rounded-lg font-bold">
          Retry Connection
        </button>
      </div>
    );
  }

  const { stats, pendingRequests, upcomingSessions, suggestedMatches, recentActivity } = data || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Welcome back, <span className="text-gradient-primary">{data?.stats ? "Member" : "Student"}</span>
        </h1>
        <p className="text-xs text-white/50 mt-1">Here is what is happening with your skill swaps today.</p>
      </div>

      {/* Widget 1: Swap Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Completed */}
        <div className="glass-card rounded-2xl p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Completed Sessions</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{stats?.completedSessions || 0}</h3>
          </div>
        </div>

        {/* Avg Rating */}
        <div className="glass-card rounded-2xl p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Average Rating</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">
              {stats?.avgRating > 0 ? stats.avgRating.toFixed(1) : "New"}
            </h3>
          </div>
        </div>

        {/* Skills count */}
        <div className="glass-card rounded-2xl p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-[#e91e8c]/10 border border-[#e91e8c]/25 flex items-center justify-center text-primary">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Skills Shared</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{stats?.skillsCount || 0}</h3>
          </div>
        </div>
      </div>

      {/* Main Widgets layout: Two column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Span 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Upcoming Sessions widget */}
          <div className="glass-panel border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Upcoming Sessions</span>
              </h2>
              <Link href="/sessions" className="text-xs text-primary hover:underline font-bold">
                View all
              </Link>
            </div>

            {upcomingSessions && upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((session: any) => {
                  const isTeacher = session.teacherId === data.suggestedMatches[0]?.id; // mock logic or check role
                  return (
                    <div key={session.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] flex items-center justify-between gap-4 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-xs font-bold text-primary">
                          {session.skill.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{session.skill.name}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">
                            Partner: {session.teacher.name} ({session.mode.toLowerCase()})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{getCountdown(session.date)}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-white/40 italic bg-white/[0.01] border border-white/5 border-dashed rounded-xl">
                No upcoming sessions scheduled. Go to "Browse peers" to connect!
              </div>
            )}
          </div>

          {/* Pending Requests Inbox */}
          <div className="glass-panel border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Inbox className="w-5 h-5 text-secondary" />
                <span>Pending Requests</span>
                {pendingRequests?.count > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
                    {pendingRequests.count} new
                  </span>
                )}
              </h2>
              <Link href="/requests" className="text-xs text-primary hover:underline font-bold">
                Open inbox
              </Link>
            </div>

            {pendingRequests?.list && pendingRequests.list.length > 0 ? (
              <div className="space-y-4">
                {pendingRequests.list.map((req: any) => (
                  <div key={req.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={req.sender.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg"}
                          alt={req.sender.name}
                          className="w-9 h-9 rounded-full border border-white/10"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">{req.sender.name}</p>
                          <p className="text-[10px] text-white/40">{req.sender.college}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-500 text-[10px] font-bold text-white rounded-lg transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/80 border border-white/5 rounded-lg transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                    {req.message && (
                      <p className="text-[11px] text-white/60 italic bg-white/[0.01] border border-white/[0.03] rounded-lg p-2.5">
                        "{req.message}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-white/40 italic bg-white/[0.01] border border-white/5 border-dashed rounded-xl">
                Your request inbox is clear. Good job!
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-8">
          
          {/* Suggested matches */}
          <div className="glass-panel border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span>Suggested Matches</span>
              </h2>
            </div>

            {suggestedMatches && suggestedMatches.length > 0 ? (
              <div className="space-y-4 card-3d-wrapper">
                {suggestedMatches.map((m: any) => (
                  <div key={m.id} className="card-3d glass-card p-4 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col gap-3 transition-all group preserve-3d">
                    <div className="flex items-center gap-3 pop-depth-sm">
                      <img
                        src={m.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg"}
                        alt={m.name}
                        className="w-10 h-10 rounded-full border border-white/10 object-cover bg-white/5 transition-transform group-hover:scale-105"
                      />
                      <div className="min-w-0 flex-1">
                        <Link href={`/profile/${m.id}`} className="text-xs font-bold text-white hover:text-accent hover:underline truncate block">
                          {m.name}
                        </Link>
                        <p className="text-[10px] text-white/40 truncate">{m.college}</p>
                      </div>
                      <span className="text-[10px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-md animate-pulse shrink-0">
                        {m.compatibilityScore * 10}% match
                      </span>
                    </div>

                    {m.matchExplanation && (
                      <div className="pop-depth-md p-2.5 rounded-lg bg-accent/[0.02] border border-accent/10 text-[9px] text-accent/80 leading-relaxed shadow-[0_0_10px_rgba(0,242,254,0.02)]">
                        <div className="flex items-center gap-1 font-semibold text-accent uppercase tracking-wider text-[8px] mb-0.5">
                          <Zap className="w-2.5 h-2.5 text-accent animate-pulse" />
                          <span>AI Explanation</span>
                        </div>
                        {m.matchExplanation}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 pop-depth-sm">
                      {m.teachSkills.slice(0, 2).map((s: any) => (
                        <SkillChip key={s.id} name={s.name} category={s.category} size="sm" />
                      ))}
                    </div>

                    <Link href={`/profile/${m.id}`} className="pop-depth-md text-[10px] font-bold text-white/80 hover:text-accent flex items-center gap-1 self-end group-hover:gap-1.5 transition-all">
                      <span>Send Request</span>
                      <ArrowRight className="w-3 h-3 text-accent" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-white/40 italic">
                No matches found. Try editing your wants/teaches.
              </div>
            )}
          </div>

          {/* Recent Activity Feed */}
          <div className="glass-panel border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#e91e8c]" />
                <span>Recent Activity</span>
              </h2>
            </div>

            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4 relative pl-3.5 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
                {recentActivity.map((act: any, idx: number) => (
                  <div key={idx} className="relative flex flex-col gap-0.5">
                    {/* Bullet node */}
                    <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full border border-white/20 bg-background" />
                    <p className="text-xs font-bold text-white leading-snug">{act.title}</p>
                    <p className="text-[10px] text-white/50 leading-relaxed">{act.description}</p>
                    <span className="text-[9px] text-white/30 font-medium">
                      {new Date(act.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-white/40 italic">
                No recent activity logged.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
