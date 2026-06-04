"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "../../../lib/api";
import { useAppAuth } from "../../../components/AuthProvider";
import SessionCard from "../../../components/SessionCard";
import RatingModal from "../../../components/RatingModal";
import { CalendarRange, History, Sparkles } from "lucide-react";

export default function SessionsPage() {
  const { user } = useAppAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<"upcoming" | "past">("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Rating Modal state
  const [activeRatingSessionId, setActiveRatingSessionId] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/sessions");
      setSessions(res || []);
    } catch (err: any) {
      console.error("Failed to fetch sessions:", err);
      setError(err.message || "Failed to load scheduled swap sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await apiFetch(`/sessions/${id}/complete`, { method: "PATCH" });
      fetchSessions();
    } catch (err) {
      console.error("Failed to mark session as complete:", err);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await apiFetch(`/sessions/${id}/cancel`, { method: "PATCH" });
      fetchSessions();
    } catch (err) {
      console.error("Failed to cancel session:", err);
    }
  };

  const handleOpenRatingModal = (sessionId: string) => {
    setActiveRatingSessionId(sessionId);
  };

  const handleRatingSuccess = () => {
    fetchSessions(); // Reload sessions to update reviewed status checkmark
  };

  // Split sessions into upcoming (SCHEDULED) and past (COMPLETED/CANCELLED)
  const upcomingSessions = sessions.filter((s) => s.status === "SCHEDULED");
  const pastSessions = sessions.filter((s) => s.status === "COMPLETED" || s.status === "CANCELLED");

  const displayedSessions = activeFilter === "upcoming" ? upcomingSessions : pastSessions;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-7 h-7 text-white/70" />
          <span>My Swap Sessions</span>
        </h1>
        <p className="text-xs text-white/50 mt-1 font-medium">
          Manage upcoming study meetings, click online links to launch video calls, or review peer tutors.
        </p>
      </div>

      {/* Tabs headers */}
      <div className="flex border-b border-white/5 pb-0.5 max-w-md gap-4">
        <button
          onClick={() => setActiveFilter("upcoming")}
          className={`flex items-center gap-2 pb-3.5 text-xs font-mono uppercase tracking-wider relative transition-all ${
            activeFilter === "upcoming" ? "text-white" : "text-white/40 hover:text-white/70"
          }`}
        >
          <CalendarRange className="w-4 h-4" />
          <span>Upcoming Swaps</span>
          <span className="text-[9px] font-mono uppercase tracking-wider bg-white/10 text-white px-1.5 py-0.5 rounded">
            {upcomingSessions.length}
          </span>
          {activeFilter === "upcoming" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/80 rounded" />
          )}
        </button>

        <button
          onClick={() => setActiveFilter("past")}
          className={`flex items-center gap-2 pb-3.5 text-xs font-mono uppercase tracking-wider relative transition-all ${
            activeFilter === "past" ? "text-white" : "text-white/40 hover:text-white/70"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Completed History</span>
          {activeFilter === "past" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/80 rounded" />
          )}
        </button>
      </div>

      {/* Session listings */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 gap-4">
          <div className="w-10 h-10 border-t-2 border-white border-solid rounded-full animate-spin" />
          <span className="text-xs text-white/50">Fetching schedules...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded max-w-xl mx-auto text-center">
          <h4 className="font-bold text-sm mb-1">Error Loading Sessions</h4>
          <p className="text-xs">{error}</p>
          <button onClick={fetchSessions} className="mt-3 text-xs bg-white text-black px-4 py-2 rounded font-bold uppercase font-mono tracking-wider">
            Retry Connection
          </button>
        </div>
      ) : displayedSessions.length === 0 ? (
        <div className="text-center py-20 glass-panel border border-white/5 border-dashed rounded max-w-xl mx-auto space-y-2">
          <p className="text-sm font-bold text-white/60 font-mono uppercase">
            {activeFilter === "upcoming" ? "No scheduled upcoming sessions" : "No session history recorded"}
          </p>
          <p className="text-xs text-white/40">
            {activeFilter === "upcoming"
              ? "Verify requests are accepted, then select schedule from the peer's public profile page."
              : "Completed or cancelled swaps will show up here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedSessions.map((session) => {
            const isTeacher = session.teacherId === user?.id;
            const partner = isTeacher ? session.learner : session.teacher;
            return (
              <SessionCard
                key={session.id}
                id={session.id}
                date={session.date}
                durationMin={session.durationMin}
                mode={session.mode}
                meetLink={session.meetLink}
                location={session.location}
                status={session.status}
                skill={session.skill}
                partner={{
                  id: partner.id,
                  name: partner.name,
                  avatarUrl: partner.avatarUrl,
                }}
                role={isTeacher ? "teacher" : "learner"}
                hasRating={!!session.rating}
                onComplete={handleComplete}
                onCancel={handleCancel}
                onOpenRatingModal={handleOpenRatingModal}
              />
            );
          })}
        </div>
      )}

      {/* Review Rating Modal */}
      <RatingModal
        sessionId={activeRatingSessionId}
        onClose={() => setActiveRatingSessionId(null)}
        onSuccess={handleRatingSuccess}
      />
    </div>
  );
}
