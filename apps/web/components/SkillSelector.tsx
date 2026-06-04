"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Check } from "lucide-react";
import { apiFetch } from "../lib/api";
import { SkillCategory } from "./SkillChip";

interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
}

interface SkillSelectorProps {
  type: "teach" | "learn";
  existingSkillIds: string[];
  onAddSkill: (skillId: string) => Promise<void>;
  onRemoveSkill: (skillId: string) => Promise<void>;
}

export default function SkillSelector({
  type,
  existingSkillIds = [],
  onAddSkill,
  onRemoveSkill,
}: SkillSelectorProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [groupedSkills, setGroupedSkills] = useState<Record<string, Skill[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/skills");
      setSkills(res.skills || []);
      setGroupedSkills(res.grouped || {});
    } catch (error) {
      console.error("Failed to fetch skills in selector:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  // Filter skills based on query
  const filteredSkills = skills.filter((skill) =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered skills
  const filteredGrouped = filteredSkills.reduce((acc, skill) => {
    const cat = skill.category;
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const handleToggle = async (skillId: string) => {
    const isAdded = existingSkillIds.includes(skillId);
    if (isAdded) {
      await onRemoveSkill(skillId);
    } else {
      await onAddSkill(skillId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search skills to ${type === "teach" ? "teach" : "learn"} (e.g. Figma, Python)...`}
          className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Skills list grouped by category */}
      {loading ? (
        <div className="text-center py-6 text-xs text-white/40">Loading skills...</div>
      ) : Object.keys(filteredGrouped).length === 0 ? (
        <div className="text-center py-6 text-xs text-white/35 italic">No matching skills found.</div>
      ) : (
        <div className="max-h-60 overflow-y-auto border border-white/5 rounded-xl p-3 bg-white/[0.01] divide-y divide-white/5 space-y-4">
          {Object.entries(filteredGrouped).map(([category, items]) => (
            <div key={category} className="pt-3 first:pt-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/35 block mb-2 px-1">
                {category.toLowerCase()}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {items.map((skill) => {
                  const isAdded = existingSkillIds.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      onClick={() => handleToggle(skill.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left ${
                        isAdded
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : "bg-background/45 border-white/5 text-white/70 hover:text-white hover:border-white/10"
                      }`}
                    >
                      <span>{skill.name}</span>
                      {isAdded ? (
                        <Check className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-white/30 hover:text-white shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
