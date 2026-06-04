"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { Star, Trophy, GraduationCap, Medal, Sparkles } from "lucide-react";
import Link from "next/link";

interface LeaderboardUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
  college?: string | null;
  completedSessions: number;
  avgRating: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/users/leaderboard");
      setLeaderboard(res || []);
    } catch (err: any) {
      console.error("Failed to load leaderboard:", err);
      setError(err.message || "Failed to load leaderboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-7 h-7 text-white/70" />
          <span>Campus Leaderboard</span>
        </h1>
        <p className="text-xs text-white/50 mt-1 font-medium">
          Top skill exchangers ranked by completed swap sessions and tutor ratings. Gain campus reputation!
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 gap-4">
          <div className="w-10 h-10 border-t-2 border-white border-solid rounded-full animate-spin" />
          <span className="text-xs text-white/50">Computing scoreboard...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded max-w-xl mx-auto text-center">
          <h4 className="font-bold text-sm mb-1">Failed to Load Rankings</h4>
          <p className="text-xs">{error}</p>
          <button onClick={fetchLeaderboard} className="mt-3 text-xs bg-white text-black px-4 py-2 rounded font-bold uppercase font-mono tracking-wider">
            Retry Connection
          </button>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-20 glass-panel border border-white/5 border-dashed rounded max-w-xl mx-auto">
          <p className="text-sm font-bold text-white/60 font-mono uppercase">Scoreboard is empty</p>
          <p className="text-xs text-white/40 mt-1">Complete a learning session to appear on the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-8 max-w-4xl mx-auto">
          
          {/* Top 3 Spotlight podium cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
            
            {/* Podium Spot 2: Silver */}
            {leaderboard[1] && (
              <div className="glass-card rounded p-6 border border-white/5 flex flex-col items-center gap-4 text-center order-2 md:order-1 md:h-[220px] justify-center relative">
                <div className="absolute top-3 left-3 flex items-center justify-center w-7 h-7 rounded border border-white/10 bg-white/5 text-white/70">
                  <Medal className="w-4 h-4" />
                </div>
                <img
                  src={leaderboard[1].avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg"}
                  alt={leaderboard[1].name}
                  className="w-12 h-12 rounded border border-white/20 object-cover"
                />
                <div>
                  <Link href={`/profile/${leaderboard[1].id}`} className="font-bold text-sm text-white hover:underline block truncate max-w-[150px]">
                    {leaderboard[1].name}
                  </Link>
                  <p className="text-[10px] text-white/45 truncate max-w-[150px] mt-0.5">{leaderboard[1].college}</p>
                </div>
                <div className="flex gap-4 border-t border-white/5 pt-3 w-full justify-center text-xs">
                  <div>
                    <span className="font-extrabold text-white">{leaderboard[1].completedSessions}</span>
                    <span className="text-[9px] text-white/40 block uppercase">Swaps</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-white/80 flex items-center gap-0.5 justify-center">
                      <Star className="w-3.5 h-3.5 text-white/60 fill-white/60" />
                      {leaderboard[1].avgRating > 0 ? leaderboard[1].avgRating.toFixed(1) : "N/A"}
                    </span>
                    <span className="text-[9px] text-white/40 block uppercase">Rating</span>
                  </div>
                </div>
              </div>
            )}

            {/* Podium Spot 1: Gold */}
            {leaderboard[0] && (
              <div className="glass-panel rounded p-8 border border-white/40 flex flex-col items-center gap-4 text-center order-1 md:order-2 md:h-[260px] justify-center relative shadow-lg shadow-white/5">
                <div className="absolute -top-4 bg-white text-black font-mono text-[9px] uppercase tracking-widest px-3.5 py-1 rounded flex items-center gap-1 shadow-md">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Rank #1 Exchanger</span>
                </div>
                <img
                  src={leaderboard[0].avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg"}
                  alt={leaderboard[0].name}
                  className="w-16 h-16 rounded border-2 border-white object-cover"
                />
                <div>
                  <Link href={`/profile/${leaderboard[0].id}`} className="font-black text-base text-white hover:underline block truncate max-w-[180px]">
                    {leaderboard[0].name}
                  </Link>
                  <p className="text-xs text-white/50 truncate max-w-[180px] mt-0.5">{leaderboard[0].college}</p>
                </div>
                <div className="flex gap-6 border-t border-white/5 pt-4.5 w-full justify-center text-sm">
                  <div>
                    <span className="font-black text-white text-base">{leaderboard[0].completedSessions}</span>
                    <span className="text-[9px] text-white/45 block uppercase font-bold">Swaps</span>
                  </div>
                  <div>
                    <span className="font-black text-white flex items-center gap-0.5 justify-center text-base">
                      <Star className="w-4 h-4 text-white/80 fill-white/80" />
                      {leaderboard[0].avgRating > 0 ? leaderboard[0].avgRating.toFixed(1) : "N/A"}
                    </span>
                    <span className="text-[9px] text-white/45 block uppercase font-bold">Rating</span>
                  </div>
                </div>
              </div>
            )}

            {/* Podium Spot 3: Bronze */}
            {leaderboard[2] && (
              <div className="glass-card rounded p-6 border border-white/5 flex flex-col items-center gap-4 text-center order-3 md:h-[200px] justify-center relative">
                <div className="absolute top-3 left-3 flex items-center justify-center w-7 h-7 rounded border border-white/10 bg-white/5 text-white/50">
                  <Medal className="w-4 h-4" />
                </div>
                <img
                  src={leaderboard[2].avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg"}
                  alt={leaderboard[2].name}
                  className="w-10 h-10 rounded border border-white/20 object-cover"
                />
                <div>
                  <Link href={`/profile/${leaderboard[2].id}`} className="font-bold text-sm text-white hover:underline block truncate max-w-[150px]">
                    {leaderboard[2].name}
                  </Link>
                  <p className="text-[10px] text-white/45 truncate max-w-[150px] mt-0.5">{leaderboard[2].college}</p>
                </div>
                <div className="flex gap-4 border-t border-white/5 pt-3 w-full justify-center text-xs">
                  <div>
                    <span className="font-extrabold text-white">{leaderboard[2].completedSessions}</span>
                    <span className="text-[9px] text-white/40 block uppercase">Swaps</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-white/80 flex items-center gap-0.5 justify-center">
                      <Star className="w-3.5 h-3.5 text-white/60 fill-white/60" />
                      {leaderboard[2].avgRating > 0 ? leaderboard[2].avgRating.toFixed(1) : "N/A"}
                    </span>
                    <span className="text-[9px] text-white/40 block uppercase">Rating</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Table List (Ranks 4-10) */}
          {leaderboard.length > 3 && (
            <div className="glass-panel border border-white/5 rounded overflow-hidden mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-white/45 uppercase tracking-wider">
                      <th className="px-6 py-4.5 text-center w-16">Rank</th>
                      <th className="px-6 py-4.5">Student</th>
                      <th className="px-6 py-4.5">College</th>
                      <th className="px-6 py-4.5 text-center w-28">Swaps Finished</th>
                      <th className="px-6 py-4.5 text-center w-24">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leaderboard.slice(3).map((user, idx) => {
                      const rank = idx + 4;
                      return (
                        <tr key={user.id} className="hover:bg-white/[0.01] transition-all">
                          <td className="px-6 py-4.5 font-extrabold text-center text-white/50">{rank}</td>
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg"}
                                alt={user.name}
                                className="w-8 h-8 rounded border border-white/10"
                              />
                              <Link href={`/profile/${user.id}`} className="font-bold text-white hover:underline">
                                {user.name}
                              </Link>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 text-white/60">
                            <div className="flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-white/30 shrink-0" />
                              <span className="truncate max-w-[180px]">{user.college}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 text-center font-bold text-white">
                            <span className="px-2.5 py-0.5 rounded bg-white/5 border border-white/5">
                              {user.completedSessions}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-center">
                            <div className="inline-flex items-center gap-1 font-bold text-white/80">
                              <Star className="w-3.5 h-3.5 text-white/60 fill-white/60" />
                              <span>{user.avgRating > 0 ? user.avgRating.toFixed(1) : "New"}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
