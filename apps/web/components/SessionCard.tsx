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
    <div className="card-3d-wrapper h-full">
      <div className="card-3d glass-card rounded p-5 border border-white/5 flex flex-col justify-between gap-4 h-full preserve-3d group">
        {/* Upper section */}
        <div className="flex items-start justify-between gap-3 pop-depth-sm">
          <div className="flex gap-3">
            <img
              src={partner.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg"}
              alt={partner.name}
              className="w-10 h-10 rounded border border-white/10 object-cover bg-white/5 transition-transform group-hover:scale-105"
            />
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[8px] font-mono tracking-wider px-1.5 py-0.5 rounded border uppercase ${
                  role === "teacher" ? "text-white bg-white/10 border-white/20" : "text-white/70 bg-white/5 border-white/10"
                }`}>
                  {role === "teacher" ? "Teaching" : "Learning"}
                </span>
                <span className="text-xs text-white/50">with</span>
                <Link href={`/profile/${partner.id}`} className="text-xs font-bold text-white hover:text-white hover:underline">
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
            <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider border ${
              status === "SCHEDULED" ? "text-white bg-white/15 border-white/30" :
              status === "COMPLETED" ? "text-white/60 bg-white/[0.04] border-white/10" :
              "text-white/30 bg-white/[0.02] border-white/5 line-through"
            }`}>
              <span>{status.toLowerCase()}</span>
            </span>
          </div>
        </div>

        {/* Date & Time / Duration details */}
        <div className="pop-depth-md flex flex-col gap-2 bg-white/[0.01] border border-white/5 rounded p-3.5 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white/50" />
            <span>{formatDate(date)} ({durationMin} min)</span>
          </div>

          {mode === "ONLINE" ? (
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-white/50" />
              {meetLink ? (
                <a
                  href={meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-white hover:underline font-medium truncate"
                >
                  Join Google Meet
                </a>
              ) : (
                <span className="text-white/40 italic">Link not provided</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-white/50" />
              <span className="truncate">{location || "Offline Location (To be discussed)"}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pop-depth-lg flex gap-2 border-t border-white/5 pt-3 mt-1">
          {status === "SCHEDULED" && (
            <>
              {onComplete && (
                <button
                  onClick={() => handleAction(onComplete)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-mono uppercase tracking-wider text-black bg-white hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Complete</span>
                </button>
              )}
              {onCancel && (
                <button
                  onClick={() => handleAction(onCancel)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-mono uppercase tracking-wider text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50"
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
              className="w-full flex items-center justify-center gap-1 py-1.5 rounded text-xs font-mono uppercase tracking-wider text-black bg-white hover:bg-white/90 transition-all"
            >
              <Award className="w-3.5 h-3.5 animate-bounce" />
              <span>Write a Review</span>
            </button>
          )}

          {status === "COMPLETED" && hasRating && (
            <div className="w-full text-center text-[9px] font-mono uppercase tracking-wider text-white/30 py-1.5 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3 text-white/40" />
              <span>Reviewed & Rated</span>
            </div>
          )}

          {status === "CANCELLED" && (
            <span className="w-full text-center text-[9px] font-mono uppercase tracking-wider text-white/30 italic py-1">
              This session was cancelled
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
