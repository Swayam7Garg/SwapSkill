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
    classes: "text-blue-400 bg-blue-500/10 border-blue-500/25",
  },
  DESIGN: {
    icon: Palette,
    classes: "text-pink-400 bg-pink-500/10 border-pink-500/25",
  },
  MUSIC: {
    icon: Music,
    classes: "text-violet-400 bg-violet-500/10 border-violet-500/25",
  },
  LANGUAGE: {
    icon: Languages,
    classes: "text-green-400 bg-green-500/10 border-green-500/25",
  },
  SPORTS: {
    icon: Activity,
    classes: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  },
  ACADEMICS: {
    icon: BookOpen,
    classes: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25",
  },
  COMMUNICATION: {
    icon: MessageSquare,
    classes: "text-rose-400 bg-rose-500/10 border-rose-500/25",
  },
  OTHER: {
    icon: Sparkles,
    classes: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
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
