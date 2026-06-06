import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/my-tables")({
  head: () => ({ meta: [{ title: "My Tables — Point Arena" }] }),
  component: MyTables,
});

type T = { id: string; tournament_name: string; created_at: string; data: { rows?: Array<{ name: string; total: number }> } };

function MyTables() {
  const { user } = useAuth();
  const [list, setList] = useState<T[]>([]);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("point_tables").select("id,tournament_name,created_at,data").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setList((data ?? []) as T[]);
  };
  useEffect(() => { load(); }, [user]);

  const remove = async (id: string) => {
    if (!confirm("Delete this table?")) return;
    const { error } = await supabase.from("point_tables").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">My Point Tables</h1>
      <p className="text-muted-foreground mt-1">Every tournament you've generated.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => {
          const winner = t.data?.rows?.[0];
          return (
            <div key={t.id} className="glass rounded-xl p-4">
              <div className="font-bold truncate">{t.tournament_name}</div>
              <div className="text-xs text-muted-foreground mt-1">{new Date(t.created_at).toLocaleString()}</div>
              {winner && <div className="mt-2 text-sm">🏆 <span className="neon-text font-bold">{winner.name}</span> · {winner.total} pts</div>}
              <Button size="sm" variant="destructive" className="mt-3" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
            </div>
          );
        })}
        {list.length === 0 && <div className="glass rounded-xl p-8 text-center text-muted-foreground sm:col-span-2 lg:col-span-3">No tables yet — create your first one!</div>}
      </div>
    </div>
  );
}