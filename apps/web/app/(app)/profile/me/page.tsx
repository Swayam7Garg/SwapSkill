"use client";

import React, { useState, useEffect } from "react";
import { useAppAuth } from "../../../../components/AuthProvider";
import { apiFetch } from "../../../../lib/api";
import SkillChip from "../../../../components/SkillChip";
import SkillSelector from "../../../../components/SkillSelector";
import { Star, GraduationCap, X, BookOpen, AlertCircle, Save, CheckCircle2 } from "lucide-react";

export default function MyProfilePage() {
  const { user, refreshUser } = useAppAuth();

  // Profile Edit fields
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [bio, setBio] = useState("");
  
  // UI states
  const [activeSelectorType, setActiveSelectorType] = useState<"teach" | "learn" | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ratings history
  const [ratingsData, setRatingsData] = useState<any>(null);
  const [loadingRatings, setLoadingRatings] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setCollege(user.college || "");
      setBio(user.bio || "");
      fetchRatings();
    }
  }, [user]);

  const fetchRatings = async () => {
    if (!user) return;
    try {
      setLoadingRatings(true);
      const res = await apiFetch(`/ratings/user/${user.id}`);
      setRatingsData(res);
    } catch (err) {
      console.error("Failed to fetch ratings:", err);
    } finally {
      setLoadingRatings(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setEditSuccess(false);

      await apiFetch("/users/me", {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          college: college.trim(),
          bio: bio.trim() || null,
        }),
      });

      await refreshUser();
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      setError(err.message || "Failed to update profile info.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (skillId: string) => {
    if (!activeSelectorType) return;
    try {
      await apiFetch("/users/me/skills", {
        method: "POST",
        body: JSON.stringify({
          skillId,
          type: activeSelectorType,
        }),
      });
      await refreshUser();
    } catch (err) {
      console.error("Failed to add skill:", err);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    if (!activeSelectorType) return;
    try {
      await apiFetch(`/users/me/skills/${skillId}?type=${activeSelectorType}`, {
        method: "DELETE",
      });
      await refreshUser();
    } catch (err) {
      console.error("Failed to remove skill:", err);
    }
  };

  const handleRemoveSkillDirect = async (skillId: string, skillType: "teach" | "learn") => {
    try {
      await apiFetch(`/users/me/skills/${skillId}?type=${skillType}`, {
        method: "DELETE",
      });
      await refreshUser();
    } catch (err) {
      console.error("Failed to remove skill directly:", err);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4">
        <div className="w-10 h-10 border-t-2 border-primary border-solid rounded-full animate-spin" />
        <span className="text-xs text-white/50">Fetching profile info...</span>
      </div>
    );
  }

  const teachIds = user.teachSkills.map((s: any) => s.id);
  const learnIds = user.learnSkills.map((s: any) => s.id);

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Manage My Profile</h1>
        <p className="text-xs text-white/50 mt-1">Configure your bio, college affiliation, and skill swapping options.</p>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Span 2) - Profile settings & Skills */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Basic profile info card */}
          <div className="glass-panel border border-white/5 rounded-2xl p-6 space-y-6">
            <h2 className="text-base font-bold text-white border-b border-white/5 pb-4">
              Profile Details
            </h2>

            <form onSubmit={handleProfileSave} className="space-y-4">
              {error && (
                <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {editSuccess && (
                <div className="p-3 text-xs bg-green-500/10 border border-green-500/25 text-green-400 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/60">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/60">College affilliated</label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. UC Berkeley, MIT..."
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60">Bio Description</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell peers about yourself. What are you studying? What are your hobbies?"
                  rows={3}
                  maxLength={500}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-white text-black text-xs font-mono uppercase tracking-wider rounded flex items-center gap-2 hover:bg-white/90 transition-all disabled:opacity-50 self-start"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
              </button>
            </form>
          </div>

          {/* Teach Skills list & selector */}
          <div className="glass-panel border border-white/5 rounded p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Skills I Can Teach</h2>
                <p className="text-[10px] text-white/40 mt-0.5">These will be listed for other students looking to learn.</p>
              </div>
              <button
                onClick={() => setActiveSelectorType(activeSelectorType === "teach" ? null : "teach")}
                className="px-3.5 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono uppercase tracking-wider text-white rounded transition-all"
              >
                {activeSelectorType === "teach" ? "Close Selector" : "Add Tech/Skill"}
              </button>
            </div>

            {activeSelectorType === "teach" && (
              <div className="p-4 rounded border border-white/5 bg-white/[0.01] animate-slide-in">
                <SkillSelector
                  type="teach"
                  existingSkillIds={teachIds}
                  onAddSkill={handleAddSkill}
                  onRemoveSkill={handleRemoveSkill}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2.5">
              {user.teachSkills.length > 0 ? (
                user.teachSkills.map((skill: any) => (
                  <div key={skill.id} className="relative group/tag">
                    <SkillChip name={skill.name} category={skill.category} />
                    <button
                      onClick={() => handleRemoveSkillDirect(skill.id, "teach")}
                      className="absolute -top-1 -right-1 p-0.5 bg-rose-600 hover:bg-rose-500 rounded-full text-white scale-0 group-hover/tag:scale-100 transition-transform duration-200"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-xs text-white/40 italic py-2">
                  No teaching skills added yet. Click Add to select skills you can share!
                </div>
              )}
            </div>
          </div>

          {/* Learn Skills list & selector */}
          <div className="glass-panel border border-white/5 rounded p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Skills I Want to Learn</h2>
                <p className="text-[10px] text-white/40 mt-0.5">We use these to calculate matches with potential teachers.</p>
              </div>
              <button
                onClick={() => setActiveSelectorType(activeSelectorType === "learn" ? null : "learn")}
                className="px-3.5 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono uppercase tracking-wider text-white rounded transition-all"
              >
                {activeSelectorType === "learn" ? "Close Selector" : "Add Tech/Skill"}
              </button>
            </div>

            {activeSelectorType === "learn" && (
              <div className="p-4 rounded border border-white/5 bg-white/[0.01] animate-slide-in">
                <SkillSelector
                  type="learn"
                  existingSkillIds={learnIds}
                  onAddSkill={handleAddSkill}
                  onRemoveSkill={handleRemoveSkill}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2.5">
              {user.learnSkills.length > 0 ? (
                user.learnSkills.map((skill: any) => (
                  <div key={skill.id} className="relative group/tag">
                    <SkillChip name={skill.name} category={skill.category} />
                    <button
                      onClick={() => handleRemoveSkillDirect(skill.id, "learn")}
                      className="absolute -top-1 -right-1 p-0.5 bg-rose-600 hover:bg-rose-500 rounded-full text-white scale-0 group-hover/tag:scale-100 transition-transform duration-200"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-xs text-white/40 italic py-2">
                  No learning goals added yet. Click Add to select skills you want to learn!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Span 1) - Profile Summary & Reviews history */}
        <div className="space-y-8">
          
          {/* User profile card preview */}
          <div className="glass-panel border border-white/5 rounded p-6 text-center space-y-4 flex flex-col items-center">
            <img
              src={user.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg"}
              alt={user.name}
              className="w-16 h-16 rounded border border-white/25 object-cover bg-white/5"
            />
            <div>
              <h3 className="font-extrabold text-sm text-white">{user.name}</h3>
              <p className="text-[10px] text-white/45 flex items-center gap-1 mt-0.5 justify-center font-mono uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 shrink-0 text-white/40" />
                <span>{user.college || "No affiliated college"}</span>
              </p>
            </div>
            
            <div className="flex gap-1 items-center justify-center border-t border-white/5 pt-4 w-full text-xs font-mono uppercase tracking-wider">
              <Star className="w-4 h-4 text-white/60 fill-white/60" />
              <span className="text-sm font-bold text-white">
                {user.avgRating && user.avgRating > 0 ? user.avgRating.toFixed(1) : "New"}
              </span>
              <span className="text-[10px] text-white/40">/ 5 Rating Score</span>
            </div>
          </div>

          {/* Peer Reviews History */}
          <div className="glass-panel border border-white/5 rounded p-6 space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3 font-mono uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-white/70" />
              <span>Peer Tutor Reviews</span>
            </h3>

            {loadingRatings ? (
              <div className="text-center py-4 text-xs text-white/40">Loading reviews...</div>
            ) : !ratingsData?.ratings || ratingsData.ratings.length === 0 ? (
              <div className="text-center py-6 text-xs text-white/40 italic">
                No reviews received yet. Completed sessions rated by peers appear here.
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {ratingsData.ratings.map((rate: any) => (
                  <div key={rate.id} className="p-3 rounded border border-white/5 bg-white/[0.01] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white">{rate.rater.name}</span>
                      <div className="flex items-center gap-0.5 text-white/60">
                        {[...Array(rate.score)].map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-white/60" />
                        ))}
                      </div>
                    </div>
                    {rate.comment && <p className="text-[10px] text-white/60 italic font-mono">"{rate.comment}"</p>}
                    <p className="text-[8px] text-white/35 text-right font-medium font-mono">
                      {new Date(rate.createdAt).toLocaleDateString()} on {rate.session.skill.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
