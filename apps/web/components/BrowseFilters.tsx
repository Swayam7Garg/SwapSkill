"use client";

import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { SkillCategory } from "./SkillChip";

interface BrowseFiltersProps {
  category: string;
  teachQuery: string;
  learnQuery: string;
  onCategoryChange: (category: string) => void;
  onTeachQueryChange: (q: string) => void;
  onLearnQueryChange: (q: string) => void;
  onReset: () => void;
}

export default function BrowseFilters({
  category,
  teachQuery,
  learnQuery,
  onCategoryChange,
  onTeachQueryChange,
  onLearnQueryChange,
  onReset,
}: BrowseFiltersProps) {
  const categories: { label: string; value: string }[] = [
    { label: "All Categories", value: "" },
    { label: "Technology", value: "TECHNOLOGY" },
    { label: "Design", value: "DESIGN" },
    { label: "Music", value: "MUSIC" },
    { label: "Language", value: "LANGUAGE" },
    { label: "Sports", value: "SPORTS" },
    { label: "Academics", value: "ACADEMICS" },
    { label: "Communication", value: "COMMUNICATION" },
    { label: "Other", value: "OTHER" },
  ];

  const hasActiveFilters = category !== "" || teachQuery !== "" || learnQuery !== "";

  return (
    <div className="glass-panel border border-white/5 rounded-2xl p-6 space-y-6">
      {/* Category Tabs (Horizontal Scrollable) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-white/50 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>Filter by Skill Category</span>
          </label>
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-bold"
            >
              <X className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {categories.map((cat) => {
            const isSelected = category === cat.value;
            return (
              <button
                key={cat.label}
                onClick={() => onCategoryChange(cat.value)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                  isSelected
                    ? "bg-gradient-to-r from-primary to-secondary text-white border-transparent shadow-lg shadow-primary/10"
                    : "bg-background/40 border-white/5 text-white/60 hover:text-white hover:border-white/10"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dual Skill Search Query Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Teach query */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/60">Search what they teach</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
            <input
              type="text"
              value={teachQuery}
              onChange={(e) => onTeachQueryChange(e.target.value)}
              placeholder="e.g. React, Next.js, Calculus..."
              className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Learn query */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/60">Search what they want to learn</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
            <input
              type="text"
              value={learnQuery}
              onChange={(e) => onLearnQueryChange(e.target.value)}
              placeholder="e.g. Photography, Spanish, Yoga..."
              className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
export type { SkillCategory };
