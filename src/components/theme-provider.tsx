import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type Theme = {
  background?: string;
  foreground?: string;
  primary?: string;
  primary_foreground?: string;
  accent?: string;
  card?: string;
  border?: string;
};

const MAP: Record<keyof Theme, string> = {
  background: "--background",
  foreground: "--foreground",
  primary: "--primary",
  primary_foreground: "--primary-foreground",
  accent: "--accent",
  card: "--card",
  border: "--border",
};

export function ThemeProvider() {
  useEffect(() => {
    let cancelled = false;
    const apply = (t: Theme) => {
      const root = document.documentElement;
      (Object.keys(MAP) as (keyof Theme)[]).forEach((k) => {
        const v = t[k];
        if (v && typeof v === "string" && v.trim()) {
          root.style.setProperty(MAP[k], v);
        } else {
          root.style.removeProperty(MAP[k]);
        }
      });
    };
    supabase.from("app_settings").select("value").eq("key", "site_theme").maybeSingle()
      .then(({ data }) => { if (!cancelled && data?.value) apply(data.value as Theme); });

    const channel = supabase.channel("site_theme_changes")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "app_settings", filter: "key=eq.site_theme" },
        (payload) => {
          const next = (payload.new as { value?: Theme } | null)?.value;
          if (next) apply(next);
        })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);
  return null;
}
