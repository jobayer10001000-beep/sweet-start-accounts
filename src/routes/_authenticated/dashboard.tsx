import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Plus, Image as ImageIcon, Download, CreditCard, Video } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Point Arena" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ tables: 0, downloads: 0 });
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [t, d] = await Promise.all([
        supabase.from("point_tables").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("downloads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setStats({ tables: t.count ?? 0, downloads: d.count ?? 0 });
    })();
  }, [user]);
  const cards = [
    { label: "Credits", value: profile?.credits ?? 0, icon: CreditCard },
    { label: "Max Quality", value: (profile?.max_resolution ?? "244p").toUpperCase(), icon: Video },
    { label: "Point Tables", value: stats.tables, icon: ImageIcon },
    { label: "Downloads", value: stats.downloads, icon: Download },
  ];
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile?.username ?? "Player"}</h1>
          <p className="text-muted-foreground mt-1">Build a tournament point table in under a minute.</p>
        </div>
        <Link to="/create"><Button className="neon-border"><Plus className="h-4 w-4 mr-2" /> New Point Table</Button></Link>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-4xl font-black neon-text">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}