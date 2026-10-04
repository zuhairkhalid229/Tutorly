import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getMyProfile } from "@/services/profile";
import type { Profile, Role } from "@/types/database";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  profileImage?: string;
  isVerified: boolean;
  isDemo: boolean;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  /** Resolves `needsConfirmation: true` when the project requires email confirmation. */
  register: (input: RegisterInput, role: "student" | "tutor") => Promise<{ needsConfirmation: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toUser = (session: Session, profile: Profile): User => ({
  id: profile.id,
  email: session.user.email ?? "",
  name: profile.full_name || session.user.email?.split("@")[0] || "there",
  role: profile.role,
  profileImage: profile.profile_image ?? undefined,
  isVerified: profile.is_verified,
  isDemo: profile.is_demo,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  const loadProfile = useCallback(async (s: Session | null) => {
    setSession(s);
    if (!s) {
      setProfile(null);
      return null;
    }
    try {
      const p = await getMyProfile(s.user.id);
      setProfile(p);
      return p;
    } catch (err) {
      console.error("Couldn't load profile", err);
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => loadProfile(data.session).finally(() => setIsLoading(false)));
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        setProfile(null);
      } else if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        setSession(s);
      } else if (event === "SIGNED_IN") {
        // Supabase warns against awaiting its own calls inside this callback.
        setTimeout(() => loadProfile(s), 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [loadProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        throw new Error(/invalid login/i.test(error.message) ? "That email and password don't match." : error.message);
      }
      const p = await loadProfile(data.session);
      if (!p) throw new Error("Signed in, but we couldn't load your profile. Please try again.");
      return toUser(data.session, p);
    },
    [loadProfile],
  );

  const register = useCallback(
    async (input: RegisterInput, role: "student" | "tutor") => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          data: { name: input.name.trim(), role, bio: input.bio?.trim() || null },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;
      if (data.session) {
        await loadProfile(data.session);
        return { needsConfirmation: false };
      }
      return { needsConfirmation: true };
    },
    [loadProfile],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session);
  }, [loadProfile, session]);

  const value = useMemo<AuthContextType>(
    () => ({
      user: session && profile ? toUser(session, profile) : null,
      profile,
      session,
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [session, profile, isLoading, login, register, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const dashboardPath = (role: Role) => `/${role}`;
