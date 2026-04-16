"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createClient } from "../../utils/supabase/client";
import type { User } from "@supabase/supabase-js";

/* ─── Types ─── */
interface Identity {
  /** Always present — stable UUID for this browser */
  visitor_id: string;
  /** Present only after GitHub login */
  user: User | null;
  /** Convenience flag */
  isLoggedIn: boolean;
  /** True while Supabase is loading the initial session */
  loading: boolean;
  /** Sign in with GitHub OAuth */
  login: () => Promise<void>;
  /** Sign out */
  logout: () => Promise<void>;
  /** Returns the identifier to use in API calls */
  getIdentityPayload: () => { visitor_id?: string; user_id?: string };
}

const IdentityContext = createContext<Identity | null>(null);

/* ─── Visitor ID (guest) ─── */
function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  const key = "visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

/* ─── Provider ─── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [visitor_id, setVisitorId] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const merging = useRef(false);
  const supabase = useRef(createClient());

  // Initialize visitor_id
  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const sb = supabase.current;

    // Get initial session
    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes (login / logout)
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Merge guest → user (ONCE after login)
  useEffect(() => {
    if (loading || !user || !visitor_id) return;

    const mergeKey = `merged_${user.id}`;
    if (localStorage.getItem(mergeKey) === "true") return;
    if (merging.current) return;

    merging.current = true;

    fetch("/api/merge-identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitor_id,
        user_id: user.id,
        github_username:
          user.user_metadata?.user_name ||
          user.user_metadata?.preferred_username ||
          user.email?.split("@")[0] ||
          "user",
        avatar_url: user.user_metadata?.avatar_url || null,
      }),
    })
      .then((res) => {
        if (res.ok) {
          localStorage.setItem(mergeKey, "true");
        }
      })
      .catch(() => {})
      .finally(() => {
        merging.current = false;
      });
  }, [loading, user, visitor_id]);

  // Login with GitHub
  const login = useCallback(async () => {
    await supabase.current.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: window.location.origin,
      },
    });
  }, []);

  // Logout
  const logout = useCallback(async () => {
    await supabase.current.auth.signOut();
    setUser(null);
  }, []);

  // Returns the correct identity payload for API calls
  // Priority: user_id > visitor_id — NEVER both
  const getIdentityPayload = useCallback((): {
    visitor_id?: string;
    user_id?: string;
  } => {
    if (user) return { user_id: user.id };
    return { visitor_id };
  }, [user, visitor_id]);

  return (
    <IdentityContext.Provider
      value={{
        visitor_id,
        user,
        isLoggedIn: !!user,
        loading,
        login,
        logout,
        getIdentityPayload,
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
}

/* ─── Hook ─── */
export function useIdentity(): Identity {
  const ctx = useContext(IdentityContext);
  if (!ctx)
    throw new Error("useIdentity must be used within <AuthProvider>");
  return ctx;
}
