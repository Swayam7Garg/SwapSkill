"use client";

import React, { useState } from "react";
import { X, Calendar, Video, MapPin, Clock } from "lucide-react";
import { apiFetch } from "../lib/api";
import { SkillCategory } from "./SkillChip";

interface SkillItem {
  id: string;
  name: string;
  category: SkillCategory;
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teacherId: string;
  learnerId: string;
  skills: SkillItem[]; // The skills list relevant to this swap
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  teacherId,
  learnerId,
  skills = [],
}: ScheduleModalProps) {
  const [skillId, setSkillId] = useState(skills[0]?.id || "");
  const [date, setDate] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [mode, setMode] = useState<"ONLINE" | "OFFLINE">("ONLINE");
  const [meetLink, setMeetLink] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (!skillId) {
        throw new Error("Please select a skill for this session.");
      }

      if (!date) {
        throw new Error("Please pick a date and time.");
      }

      const isoDate = new Date(date).toISOString();

      await apiFetch("/sessions", {
        method: "POST",
        body: JSON.stringify({
          teacherId,
          learnerId,
          skillId,
          date: isoDate,
          durationMin,
          mode,
          meetLink: mode === "ONLINE" ? (meetLink.trim() || "https://meet.google.com/abc-defg-hij") : null,
          location: mode === "OFFLINE" ? location.trim() : null,
        }),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to schedule session:", err);
      setError(err.message || "Failed to schedule session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="font-bold text-white text-base">Schedule Learning Session</h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg">
              {error}
            </div>
          )}

          {/* Skill Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/60">Choose Skill to Swap</label>
            <select
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="" disabled>Select a skill...</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category.toLowerCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/60">Date & Time</label>
            <div className="relative">
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Duration & Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/60 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-white/40" />
                <span>Duration</span>
              </label>
              <select
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value={30}>30 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/60">Session Mode</label>
              <div className="flex bg-background border border-white/10 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setMode("ONLINE")}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    mode === "ONLINE"
                      ? "bg-primary text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Online
                </button>
                <button
                  type="button"
                  onClick={() => setMode("OFFLINE")}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    mode === "OFFLINE"
                      ? "bg-primary text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Offline
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Link or Location inputs */}
          {mode === "ONLINE" ? (
            <div className="space-y-1.5 animate-slide-in">
              <label className="text-xs font-semibold text-white/60 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-cyan-400" />
                <span>Google Meet Link</span>
              </label>
              <input
                type="url"
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij (optional)"
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          ) : (
            <div className="space-y-1.5 animate-slide-in">
              <label className="text-xs font-semibold text-white/60 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Location Detail</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Science Library, Study Room 4"
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white/80 bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-95 transition-all disabled:opacity-50"
            >
              {loading ? "Scheduling..." : "Schedule Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
