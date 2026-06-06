import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Point Arena" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, refresh, signOut } = useAuth();
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setUsername(profile?.username ?? ""); }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    await refresh();
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold">Profile</h1>
      <div className="mt-6 glass rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div className="text-muted-foreground text-xs uppercase">Credits</div><div className="text-2xl font-black neon-text">{profile?.credits ?? 0}</div></div>
          <div><div className="text-muted-foreground text-xs uppercase">Max Quality</div><div className="text-2xl font-black neon-text">{(profile?.max_resolution ?? "244p").toUpperCase()}</div></div>
        </div>
        <div><Label htmlFor="profile-email">Email</Label><Input id="profile-email" value={profile?.email ?? ""} disabled /></div>
        <div><Label htmlFor="profile-uid">User ID (UID)</Label><Input id="profile-uid" value={user?.id ?? ""} disabled className="font-mono text-xs" /></div>
        <div><Label htmlFor="profile-username">Username</Label><Input id="profile-username" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving} className="flex-1 neon-border">{saving ? "Saving…" : "Save changes"}</Button>
          <Button variant="outline" onClick={signOut}>Sign out</Button>
        </div>
      </div>
    </div>
  );
}