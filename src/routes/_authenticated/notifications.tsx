import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Inbox — Point Arena" }] }),
  component: Inbox,
});

type N = { id: string; title: string; message: string; created_at: string; read: boolean; user_id: string | null };

function Inbox() {
  const { user } = useAuth();
  const [items, setItems] = useState<N[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").select("*").or(`user_id.eq.${user.id},user_id.is.null`).order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setItems((data ?? []) as N[]));
  }, [user]);

  return (
    <div>
      <h1 className="text-3xl font-bold flex items-center gap-2"><Bell className="h-7 w-7 text-primary" />Inbox</h1>
      <div className="mt-6 space-y-3 max-w-3xl">
        {items.map((n) => (
          <div key={n.id} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="font-bold">{n.title}</div>
              <div className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
            {n.user_id === null && <div className="mt-2 text-[10px] uppercase tracking-wider text-primary">📣 Announcement</div>}
          </div>
        ))}
        {items.length === 0 && <div className="glass rounded-xl p-8 text-center text-muted-foreground">No notifications.</div>}
      </div>
    </div>
  );
}