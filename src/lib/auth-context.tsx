import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Resolution = "244p" | "480p" | "720p" | "1080p" | "2k" | "4k";
type Profile = { id: string; username: string | null; email: string | null; credits: number; avatar_url: string | null; max_resolution: Resolution; can_upload_thumbnails: boolean };

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const [{ data: p, error: profileError }, { data: admin, error: roleError }] = await Promise.all([
      supabase.from("profiles").select("id,username,email,credits,avatar_url,max_resolution,can_upload_thumbnails").eq("id", uid).maybeSingle(),
      supabase.rpc("has_role", { _user_id: uid, _role: "admin" }),
    ]);
    if (profileError) console.error("Profile fetch failed", profileError);
    if (roleError) console.error("Admin role fetch failed", roleError);
    setProfile(p as Profile | null);
    setIsAdmin(!roleError && Boolean(admin));
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    }).catch((error) => {
      console.error("Session fetch failed", error);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const refresh = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };
  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, session, profile, isAdmin, loading, refresh, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}