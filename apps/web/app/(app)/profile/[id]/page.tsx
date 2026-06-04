"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppAuth } from "../../../../components/AuthProvider";
import { apiFetch } from "../../../../lib/api";
import SkillChip from "../../../../components/SkillChip";
import ScheduleModal from "../../../../components/ScheduleModal";
import { Star, GraduationCap, Calendar, MessageSquare, Send, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAppAuth();
  const userId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Connection request state
  const [connectionStatus, setConnectionStatus] = useState<"NONE" | "PENDING" | "ACCEPTED" | "REJECTED">("NONE");
  const [requestMessage, setRequestMessage] = useState("Hi, I saw your profile and would love to swap skills! I can teach you my listed skills in return.");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Schedule modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const fetchProfileAndConnection = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile
      const userProfile = await apiFetch(`/users/${userId}`);
      setProfile(userProfile);

      // Check current connection status by looking at our sent / inbox requests
      const sent = await apiFetch("/requests/sent");
      const inbox = await apiFetch("/requests/inbox");

      const outgoing = sent.find((r: any) => r.receiverId === userId);
      const incoming = inbox.find((r: any) => r.senderId === userId);

      if (outgoing) {
        setConnectionStatus(outgoing.status);
      } else if (incoming) {
        setConnectionStatus(incoming.status);
      } else {
        setConnectionStatus("NONE");
      }
    } catch (err: any) {
      console.error("Failed to load profile details:", err);
      setError(err.message || "Failed to load peer profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && userId === currentUser.id) {
      // Redirect to own profile if they visit themselves
      router.push("/profile/me");
      return;
    }
    fetchProfileAndConnection();
  }, [userId, currentUser]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingRequest(true);
      
      await apiFetch("/requests", {
        method: "POST",
        body: JSON.stringify({
          receiverId: userId,
          message: requestMessage.trim(),
        }),
      });

      setRequestSuccess(true);
      setConnectionStatus("PENDING");
    } catch (err) {
      console.error("Failed to send request:", err);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleScheduleSuccess = () => {
    router.push("/sessions");
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4">
        <div className="w-10 h-10 border-t-2 border-primary border-solid rounded-full animate-spin" />
        <span className="text-xs text-white/50">Fetching student portfolio...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-2xl max-w-xl mx-auto text-center">
        <h4 className="font-bold text-sm mb-1">Failed to load peer profile</h4>
        <p className="text-xs">{error || "User not found"}</p>
        <button onClick={fetchProfileAndConnection} className="mt-3 text-xs bg-rose-500 text-white px-4 py-2 rounded-xl font-bold">
          Retry Connection
        </button>
      </div>
    );
  }

  // Combine matching skills list for scheduler modal selection
  const schedulableSkills = [...(profile.teachSkills || []), ...(currentUser?.teachSkills || [])];

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Upper Panel: Avatar, info, quick action banner */}
      <div className="glass-panel border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 bg-gradient-to-l from-primary/10 via-transparent to-transparent w-48 h-48 rounded-bl-full pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <img
            src={profile.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg"}
            alt={profile.name}
            className="w-24 h-24 rounded-full border-4 border-white/10 object-cover bg-white/5"
          />
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{profile.name}</h1>
            <p className="text-sm text-white/50 flex items-center gap-1.5 justify-center md:justify-start">
              <GraduationCap className="w-4.5 h-4.5 text-white/40 shrink-0" />
              <span>{profile.college || "College Affiliated Student"}</span>
            </p>
            <div className="flex gap-1 items-center justify-center md:justify-start text-sm">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-white">
                {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : "New"}
              </span>
              <span className="text-xs text-white/40">
                {profile.ratingsReceived?.length > 0
                  ? `(${profile.ratingsReceived.length} swap reviews)`
                  : "(no reviews yet)"}
              </span>
            </div>
          </div>
        </div>

        {/* Action button status based on relationship */}
        <div className="w-full md:w-auto flex flex-col gap-2 shrink-0">
          {connectionStatus === "ACCEPTED" ? (
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-xs font-bold text-white rounded-xl flex items-center gap-2 hover:opacity-95 transition-all shadow-lg shadow-primary/15 self-stretch justify-center"
            >
              <Calendar className="w-4.5 h-4.5" />
              <span>Schedule Swap Session</span>
            </button>
          ) : connectionStatus === "PENDING" ? (
            <div className="px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 flex items-center gap-2 justify-center">
              <Clock className="w-4.5 h-4.5 animate-pulse" />
              <span>Connection Request Pending</span>
            </div>
          ) : (
            <div className="text-xs text-white/40 font-medium italic text-center md:text-right">
              Send a request below to unlock scheduling!
            </div>
          )}
        </div>
      </div>

      {/* Main Grid details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column details (Span 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Bio info */}
          <div className="glass-panel border border-white/5 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white border-b border-white/5 pb-3">About {profile.name}</h2>
            <p className="text-xs text-white/70 leading-relaxed font-medium">
              {profile.bio || `${profile.name} hasn't written a biography yet.`}
            </p>
          </div>

          {/* Teach Skills */}
          <div className="glass-panel border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3">Skills {profile.name} Can Teach</h3>
            <div className="flex flex-wrap gap-2.5">
              {profile.teachSkills && profile.teachSkills.length > 0 ? (
                profile.teachSkills.map((skill: any) => (
                  <SkillChip key={skill.id} name={skill.name} category={skill.category} />
                ))
              ) : (
                <span className="text-xs text-white/40 italic">No teaching skills listed</span>
              )}
            </div>
          </div>

          {/* Learn Skills */}
          <div className="glass-panel border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3">Skills {profile.name} Wants to Learn</h3>
            <div className="flex flex-wrap gap-2.5">
              {profile.learnSkills && profile.learnSkills.length > 0 ? (
                profile.learnSkills.map((skill: any) => (
                  <SkillChip key={skill.id} name={skill.name} category={skill.category} />
                ))
              ) : (
                <span className="text-xs text-white/40 italic">No learning goals listed</span>
              )}
            </div>
          </div>

          {/* Connect form (If connectionStatus === NONE) */}
          {connectionStatus === "NONE" && (
            <div className="glass-panel border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <MessageSquare className="w-4.5 h-4.5 text-primary" />
                <span>Connect & Swap Skills</span>
              </h3>

              {requestSuccess ? (
                <div className="p-4 bg-green-500/10 border border-green-500/25 text-green-400 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <div>
                    <p className="text-xs font-bold">Request Sent Successfully!</p>
                    <p className="text-[10px] text-green-400/80 mt-0.5">
                      We notified {profile.name}. Once they accept, scheduling will unlock immediately.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendRequest} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/60">Introduce yourself</label>
                    <textarea
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Ask them to swap! Tell them what skills you want to learn from them and what you can teach in return..."
                      rows={3}
                      maxLength={250}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-xs font-bold text-white rounded-xl flex items-center gap-2 hover:opacity-95 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingRequest ? "Sending Request..." : "Send Connection Request"}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right column reviews (Span 1) */}
        <div className="space-y-8">
          {/* Peer Reviews list */}
          <div className="glass-panel border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3">Peer Reviews Received</h3>

            {!profile.ratingsReceived || profile.ratingsReceived.length === 0 ? (
              <div className="text-center py-8 text-xs text-white/40 italic">
                {profile.name} hasn't received any review logs yet.
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {profile.ratingsReceived.map((rate: any) => (
                  <div key={rate.id} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white">{rate.rater.name}</span>
                      <div className="flex items-center gap-0.5 text-yellow-400">
                        {[...Array(rate.score)].map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-yellow-400" />
                        ))}
                      </div>
                    </div>
                    {rate.comment && <p className="text-[10px] text-white/60 italic leading-relaxed">"{rate.comment}"</p>}
                    <p className="text-[8px] text-white/35 text-right font-medium">
                      {new Date(rate.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal (Connected state) */}
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSuccess={handleScheduleSuccess}
        teacherId={profile.id} // Swap partner can act as teacher
        learnerId={currentUser?.id || ""} // Viewer is learner
        skills={schedulableSkills}
      />
    </div>
  );
}
