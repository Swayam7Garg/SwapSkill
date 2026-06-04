"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { apiFetch, isClerkActive, getActiveMockUser, setActiveMockUser } from "../lib/api";

interface UserProfile {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  bio?: string | null;
  avatarUrl?: string | null;
  college?: string | null;
  teachSkills: any[];
  learnSkills: any[];
  avgRating?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  clerkActive: boolean;
  mockUserId: string;
  changeMockUser: (id: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Inner provider to handle syncing
const InnerAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const clerkActive = isClerkActive();
  const mockUserId = getActiveMockUser();

  const { isLoaded: clerkAuthLoaded, getToken } = clerkActive ? useAuth() : { isLoaded: true, getToken: async () => null };
  const { user: clerkUser, isLoaded: clerkUserLoaded } = clerkActive ? useUser() : { user: null, isLoaded: true };

  const syncUserWithBackend = async () => {
    try {
      setLoading(true);
      
      if (clerkActive) {
        if (!clerkUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        const token = await getToken();
        // Sync Clerk user with backend DB
        const syncedUser = await apiFetch("/users/sync", {
          method: "POST",
          clerkToken: token,
          body: JSON.stringify({
            name: clerkUser.fullName || clerkUser.username || "SkillSwapper",
            email: clerkUser.primaryEmailAddress?.emailAddress || "",
            avatarUrl: clerkUser.imageUrl || "",
            college: "", // Filled in profile edit
          })
        });

        // Now fetch complete profile including average rating
        const profile = await apiFetch("/users/me", { clerkToken: token });
        setUser(profile);
      } else {
        // Sync/retrieve mock user details using mock user ID header
        const mockClerkId = getActiveMockUser();
        // First sync/create the mock user profile
        await apiFetch("/users/sync", {
          method: "POST",
          body: JSON.stringify({
            name: mockClerkId.split("_").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
            email: `${mockClerkId}@college.edu`,
            avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${mockClerkId}`,
            college: "Stanford University",
          })
        });

        const profile = await apiFetch("/users/me");
        setUser(profile);
      }
    } catch (error) {
      console.error("Failed to sync auth user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clerkActive) {
      if (clerkAuthLoaded && clerkUserLoaded) {
        syncUserWithBackend();
      }
    } else {
      syncUserWithBackend();
    }
  }, [clerkAuthLoaded, clerkUserLoaded, clerkUser, mockUserId]);

  const changeMockUser = (userId: string) => {
    setActiveMockUser(userId);
  };

  const refreshUser = async () => {
    try {
      let profile;
      if (clerkActive) {
        const token = await getToken();
        profile = await apiFetch("/users/me", { clerkToken: token });
      } else {
        profile = await apiFetch("/users/me");
      }
      setUser(profile);
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || (clerkActive && (!clerkAuthLoaded || !clerkUserLoaded)),
        clerkActive,
        mockUserId,
        changeMockUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  if (isClerkActive()) {
    return (
      <ClerkProvider>
        <InnerAuthProvider>{children}</InnerAuthProvider>
      </ClerkProvider>
    );
  }

  return <InnerAuthProvider>{children}</InnerAuthProvider>;
};

export const useAppAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAppAuth must be used within an AuthProvider");
  }
  return context;
};
