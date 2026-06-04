import React from "react";
import Link from "next/link";
import { Star, GraduationCap, ArrowRight, CheckCircle2 } from "lucide-react";
import SkillChip, { SkillCategory } from "./SkillChip";

interface SkillItem {
  id: string;
  name: string;
  category: SkillCategory;
}

interface UserCardProps {
  id: string;
  name: string;
  avatarUrl?: string | null;
  college?: string | null;
  teachSkills: SkillItem[];
  learnSkills: SkillItem[];
  avgRating: number;
  compatibilityScore?: number;
}

export default function UserCard({
  id,
  name,
  avatarUrl,
  college,
  teachSkills = [],
  learnSkills = [],
  avgRating = 0,
  compatibilityScore = 0,
}: UserCardProps) {
  // Translate compatibility score into visual match score
  // If compatibilityScore > 0, it means we have overlaps! Let's display a badge.
  const hasCompatibility = compatibilityScore > 0;

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-full relative overflow-hidden group">
      {/* High Compatibility Glow indicator */}
      {hasCompatibility && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-primary/20 via-secondary/10 to-transparent w-36 h-36 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500" />
      )}

      <div>
        {/* Header: Avatar, Info, Compatibility badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg"}
              alt={name}
              className="w-14 h-14 rounded-full border border-white/10 object-cover bg-white/5"
            />
            <div className="min-w-0">
              <h3 className="font-bold text-base text-white truncate leading-tight">{name}</h3>
              <p className="text-xs text-white/50 truncate flex items-center gap-1 mt-0.5">
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                <span>{college || "College Student"}</span>
              </p>
            </div>
          </div>

          {/* Compatibility badge */}
          {hasCompatibility && (
            <div className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-1 text-[10px] font-bold text-primary animate-pulse shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              <span>{compatibilityScore * 10}% Match</span>
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-5">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-semibold text-white">
            {avgRating > 0 ? avgRating.toFixed(1) : "New"}
          </span>
          <span className="text-[10px] text-white/40">
            {avgRating > 0 ? "rating" : "no reviews yet"}
          </span>
        </div>

        {/* Skills Lists */}
        <div className="space-y-4 mb-6">
          {/* Can Teach */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-2">
              Can Teach
            </span>
            <div className="flex flex-wrap gap-1.5">
              {teachSkills.length > 0 ? (
                teachSkills.slice(0, 3).map((skill) => (
                  <SkillChip
                    key={skill.id}
                    name={skill.name}
                    category={skill.category}
                    size="sm"
                  />
                ))
              ) : (
                <span className="text-xs text-white/30 italic">No skills listed</span>
              )}
              {teachSkills.length > 3 && (
                <span className="text-[10px] text-white/50 px-2 py-0.5 bg-white/5 rounded-full border border-white/5 self-center">
                  +{teachSkills.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Wants to Learn */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-2">
              Wants to Learn
            </span>
            <div className="flex flex-wrap gap-1.5">
              {learnSkills.length > 0 ? (
                learnSkills.slice(0, 3).map((skill) => (
                  <SkillChip
                    key={skill.id}
                    name={skill.name}
                    category={skill.category}
                    size="sm"
                  />
                ))
              ) : (
                <span className="text-xs text-white/30 italic">No skills listed</span>
              )}
              {learnSkills.length > 3 && (
                <span className="text-[10px] text-white/50 px-2 py-0.5 bg-white/5 rounded-full border border-white/5 self-center">
                  +{learnSkills.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Action button */}
      <Link
        href={`/profile/${id}`}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-gradient-to-r hover:from-primary hover:to-secondary text-xs font-semibold text-white transition-all duration-300"
      >
        <span>View Profile</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
