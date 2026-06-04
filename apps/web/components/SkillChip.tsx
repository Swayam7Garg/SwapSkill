import React from "react";
import {
  Laptop,
  Palette,
  Music,
  Languages,
  Activity,
  BookOpen,
  MessageSquare,
  Sparkles,
} from "lucide-react";

type SkillCategory =
  | "TECHNOLOGY"
  | "DESIGN"
  | "MUSIC"
  | "LANGUAGE"
  | "SPORTS"
  | "ACADEMICS"
  | "COMMUNICATION"
  | "OTHER";

interface SkillChipProps {
  name: string;
  category: SkillCategory;
  size?: "sm" | "md";
}

const categoryStyles: Record<
  SkillCategory,
  { icon: React.ComponentType<any>; classes: string }
> = {
  TECHNOLOGY: {
    icon: Laptop,
    classes: "text-white/90 bg-white/[0.04] border-white/10",
  },
  DESIGN: {
    icon: Palette,
    classes: "text-white/90 bg-white/[0.04] border-white/10",
  },
  MUSIC: {
    icon: Music,
    classes: "text-white/90 bg-white/[0.04] border-white/10",
  },
  LANGUAGE: {
    icon: Languages,
    classes: "text-white/90 bg-white/[0.04] border-white/10",
  },
  SPORTS: {
    icon: Activity,
    classes: "text-white/90 bg-white/[0.04] border-white/10",
  },
  ACADEMICS: {
    icon: BookOpen,
    classes: "text-white/90 bg-white/[0.04] border-white/10",
  },
  COMMUNICATION: {
    icon: MessageSquare,
    classes: "text-white/90 bg-white/[0.04] border-white/10",
  },
  OTHER: {
    icon: Sparkles,
    classes: "text-white/90 bg-white/[0.04] border-white/10",
  },
};

export default function SkillChip({ name, category, size = "md" }: SkillChipProps) {
  const config = categoryStyles[category] || categoryStyles.OTHER;
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-all ${
        config.classes
      } ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      }`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>{name}</span>
    </div>
  );
}
export type { SkillCategory };
