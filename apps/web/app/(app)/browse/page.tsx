"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "../../../lib/api";
import BrowseFilters from "../../../components/BrowseFilters";
import UserCard from "../../../components/UserCard";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export default function BrowsePage() {
  // Filter States
  const [category, setCategory] = useState("");
  const [teachQuery, setTeachQuery] = useState("");
  const [learnQuery, setLearnQuery] = useState("");
  
  // Pagination & Loading States
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debouncing effect: fetch users whenever filters or page change
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (category) queryParams.set("category", category);
      if (teachQuery) queryParams.set("teach", teachQuery);
      if (learnQuery) queryParams.set("learn", learnQuery);
      queryParams.set("page", page.toString());
      queryParams.set("limit", "8"); // 8 per page fits nicely in a 4x2 grid

      const data = await apiFetch(`/users/browse?${queryParams.toString()}`);
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: any) {
      console.error("Failed to browse peers:", err);
      setError(err.message || "Failed to retrieve student directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset page back to 1 when changing search filters
    setPage(1);
  }, [category, teachQuery, learnQuery]);

  useEffect(() => {
    // Fetch users when parameters change
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300); // 300ms debounce on keystrokes

    return () => clearTimeout(delayDebounceFn);
  }, [category, teachQuery, learnQuery, page]);

  const handleResetFilters = () => {
    setCategory("");
    setTeachQuery("");
    setLearnQuery("");
    setPage(1);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-primary" />
            <span>Discover SkillSwap Peers</span>
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Browse students, matching compatibility score is weighted higher for mutual teach/learn overlaps.
          </p>
        </div>
        <div className="text-xs text-white/40 font-semibold self-end md:self-auto bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
          Showing <span className="text-primary font-bold">{totalCount}</span> peers available
        </div>
      </div>

      {/* Filters Widget */}
      <BrowseFilters
        category={category}
        teachQuery={teachQuery}
        learnQuery={learnQuery}
        onCategoryChange={setCategory}
        onTeachQueryChange={setTeachQuery}
        onLearnQueryChange={setLearnQuery}
        onReset={handleResetFilters}
      />

      {/* Results Section */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 gap-4">
          <div className="w-10 h-10 border-t-2 border-primary border-solid rounded-full animate-spin" />
          <span className="text-xs text-white/50">Filtering peers catalog...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-2xl max-w-xl mx-auto text-center">
          <h4 className="font-bold text-sm mb-1">Error Loading Directory</h4>
          <p className="text-xs">{error}</p>
          <button onClick={fetchUsers} className="mt-3 text-xs bg-rose-500 text-white px-4 py-2 rounded-xl font-bold">
            Retry Search
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-2xl border border-white/5 border-dashed max-w-lg mx-auto space-y-3">
          <p className="text-sm text-white/70 font-semibold">No peers found matching your criteria</p>
          <p className="text-xs text-white/45">Try clearing filters or looking up broader keywords.</p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-xs font-semibold text-white rounded-xl"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* User Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {users.map((peer) => (
              <UserCard
                key={peer.id}
                id={peer.id}
                name={peer.name}
                avatarUrl={peer.avatarUrl}
                college={peer.college}
                teachSkills={peer.teachSkills}
                learnSkills={peer.learnSkills}
                avgRating={peer.avgRating}
                compatibilityScore={peer.compatibilityScore}
                matchExplanation={peer.matchExplanation}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 border-t border-white/5 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-white/5 bg-white/5 text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-white/60">
                Page <span className="text-white font-bold">{page}</span> of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-white/5 bg-white/5 text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
