import React, { useState } from "react";
import Link from "next/link";
import { Calendar, Video, MapPin, CheckCircle, XCircle, Award } from "lucide-react";
import SkillChip, { SkillCategory } from "./SkillChip";
import { formatDate } from "../lib/utils";

interface SessionCardProps {
  id: string;
  date: string | Date;
  durationMin: number;
  mode: "ONLINE" | "OFFLINE";
  meetLink?: string | null;
  location?: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  skill: {
    id: string;
    name: string;
    category: SkillCategory;
  };
  partner: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  role: "teacher" | "learner";
  hasRating: boolean;
  onComplete?: (id: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
  onOpenRatingModal?: (sessionId: string) => void;
}

export default function SessionCard({
  id,
  date,
  durationMin,
  mode,
  meetLink,
  location,
  status,
  skill,
  partner,
  role,
  hasRating,
  onComplete,
  onCancel,
  onOpenRatingModal,
}: SessionCardProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (actionFn: ((sessId: string) => Promise<void>) | undefined) => {
    if (!actionFn) return;
    try {
      setLoading(true);
      await actionFn(id);
    } catch (err) {
      console.error("Session action failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col justify-between gap-4">
      {/* Upper section */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <img
            src={partner.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg"}
            alt={partner.name}
            className="w-11 h-11 rounded-full border border-white/10 object-cover bg-white/5"
          />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                role === "teacher" ? "text-primary bg-primary/10" : "text-cyan-400 bg-cyan-400/10"
              }`}>
                {role === "teacher" ? "Teaching" : "Learning"}
              </span>
              <span className="text-xs text-white/50">with</span>
              <Link href={`/profile/${partner.id}`} className="text-xs font-bold text-white hover:underline">
                {partner.name}
              </Link>
            </div>
            {/* Skill */}
            <div className="mt-2">
              <SkillChip name={skill.name} category={skill.category} size="sm" />
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div>
          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
            status === "SCHEDULED" ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" :
            status === "COMPLETED" ? "text-green-400 bg-green-500/10 border-green-500/20" :
            "text-white/30 bg-white/5 border-white/5"
          }`}>
            <span>{status.toLowerCase()}</span>
          </span>
        </div>
      </div>

      {/* Date & Time / Duration details */}
      <div className="flex flex-col gap-2 bg-white/[0.01] border border-white/5 rounded-xl p-3.5 text-xs text-white/70">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span>{formatDate(date)} ({durationMin} min)</span>
        </div>

        {mode === "ONLINE" ? (
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-cyan-400" />
            {meetLink ? (
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline font-medium truncate"
              >
                Join Google Meet
              </a>
            ) : (
              <span className="text-white/40 italic">Link not provided</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span className="truncate">{location || "Offline Location (To be discussed)"}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 border-t border-white/5 pt-3 mt-1">
        {status === "SCHEDULED" && (
          <>
            {onComplete && (
              <button
                onClick={() => handleAction(onComplete)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold text-white bg-green-600 hover:bg-green-500 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Complete</span>
              </button>
            )}
            {onCancel && (
              <button
                onClick={() => handleAction(onCancel)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold text-white/80 bg-white/5 hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-900/30 border border-white/5 transition-all disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </>
        )}

        {status === "COMPLETED" && !hasRating && onOpenRatingModal && (
          <button
            onClick={() => onOpenRatingModal(id)}
            className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-95 transition-all"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Write a Review</span>
          </button>
        )}

        {status === "COMPLETED" && hasRating && (
          <div className="w-full text-center text-[10px] font-semibold text-white/30 py-1.5 flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-400" />
            <span>Reviewed & Rated</span>
          </div>
        )}

        {status === "CANCELLED" && (
          <span className="w-full text-center text-[10px] text-white/30 italic py-1">
            This session was cancelled
          </span>
        )}
      </div>
    </div>
  );
}
