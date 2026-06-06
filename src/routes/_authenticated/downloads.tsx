import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/downloads")({
  head: () => ({
    meta: [
      { title: "Downloads — Point Arena" },
      { name: "description", content: "Review your Point Arena download history and credit usage activity." },
    ],
  }),
  component: DownloadsPage,
});

type D = { id: string; resolution: string; credits_used: number; created_at: string };
type L = { id: string; delta: number; reason: string; created_at: string };

function DownloadsPage() {
  const { user } = useAuth();
  const [downloads, setDownloads] = useState<D[]>([]);
  const [ledger, setLedger] = useState<L[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("downloads").select("id,resolution,credits_used,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setDownloads((data ?? []) as D[]));
    supabase.from("credit_ledger").select("id,delta,reason,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setLedger((data ?? []) as L[]));
  }, [user]);

  return (
    <>
      <h1 className="sr-only">Download and Credit History</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">Download History</h2>
          <div className="mt-4 space-y-2">
            {downloads.map((d) => (
              <div key={d.id} className="glass rounded-lg p-3 flex items-center justify-between">
                <div>
                  <Badge className="mr-2">{d.resolution?.toUpperCase()}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</span>
                </div>
                <span className="text-sm">−{d.credits_used} credit</span>
              </div>
            ))}
            {downloads.length === 0 && <div className="glass rounded-lg p-6 text-center text-muted-foreground">No downloads yet.</div>}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Credit History</h2>
          <div className="mt-4 space-y-2">
            {ledger.map((l) => (
              <div key={l.id} className="glass rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-sm">{l.reason}</span>
                  <div className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</div>
                </div>
                <span className={`font-bold ${l.delta > 0 ? "text-primary" : "text-destructive"}`}>{l.delta > 0 ? "+" : ""}{l.delta}</span>
              </div>
            ))}
            {ledger.length === 0 && <div className="glass rounded-lg p-6 text-center text-muted-foreground">No credit activity yet.</div>}
          </div>
        </div>
      </div>
    </>
  );
}
