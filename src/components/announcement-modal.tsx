import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  body: string;
  bg_color: string;
  text_color: string;
  updated_at: string;
};

const STORAGE_KEY = "pa_announcements_seen_v2";

const getSeen = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
};
const markSeen = (id: string, updated_at: string) => {
  const s = getSeen(); s[id] = updated_at;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
};

export function AnnouncementModal() {
  const [queue, setQueue] = useState<Announcement[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase.from("announcements").select("id,title,body,bg_color,text_color,updated_at")
      .eq("active", true).order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled || !data) return;
        const seen = getSeen();
        const unseen = (data as Announcement[]).filter((a) => seen[a.id] !== a.updated_at);
        setQueue(unseen);
      });
    return () => { cancelled = true; };
  }, []);

  const current = queue[0] ?? null;
  const dismiss = () => {
    if (current) markSeen(current.id, current.updated_at);
    setQueue((q) => q.slice(1));
  };

  if (!current) return null;
  return (
    <Dialog open onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent
        className="max-w-md border-0"
        style={{ background: current.bg_color, color: current.text_color }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: current.text_color }}>
            <Megaphone className="h-5 w-5" /> {current.title}
          </DialogTitle>
        </DialogHeader>
        <div className="whitespace-pre-wrap text-sm leading-relaxed py-2" style={{ color: current.text_color, opacity: 0.95 }}>
          {current.body}
        </div>
        <DialogFooter>
          <Button
            className="w-full"
            onClick={dismiss}
            style={{ background: current.text_color, color: current.bg_color }}
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
