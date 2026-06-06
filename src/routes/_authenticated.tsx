import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { AnnouncementModal } from "@/components/announcement-modal";

export const Route = createFileRoute("/_authenticated")({ component: Layout });

function Layout() {
  const { user, loading, profile, signOut, isAdmin, refresh } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [loading, user, nav]);
  useEffect(() => { if (user) refresh(); }, [user?.id]);
  if (loading || !user) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/create", label: "Create" },
    { to: "/my-tables", label: "My Tables" },
    { to: "/downloads", label: "Downloads" },
    { to: "/notifications", label: "Inbox" },
    { to: "/credits", label: "Buy Credits" },
    { to: "/profile", label: "Profile" },
  ] as const;

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-30 border-b">
        <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="h-7 w-7 rounded-md" style={{ background: "var(--gradient-primary)" }} />
            <span className="font-bold text-sm sm:text-base">POINT <span className="neon-text">ARENA</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="px-3 py-1.5 rounded hover:bg-muted">{l.label}</Link>
            ))}
            {isAdmin && <Link to="/admin" className="px-3 py-1.5 rounded hover:bg-muted neon-text font-semibold">Admin</Link>}
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm hidden xs:inline whitespace-nowrap">
              <span className="neon-text font-bold">{profile?.credits ?? 0}</span>
              <span className="hidden sm:inline"> credits · max <b className="text-primary">{(profile?.max_resolution ?? "244p").toUpperCase()}</b></span>
            </span>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={signOut}>Logout</Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden h-9 w-9">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[260px] p-0">
                <div className="flex flex-col h-full">
                  <div className="border-b p-4">
                    <div className="text-sm font-bold">POINT <span className="neon-text">ARENA</span></div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="neon-text font-bold">{profile?.credits ?? 0}</span> credits · max <b className="text-primary">{(profile?.max_resolution ?? "244p").toUpperCase()}</b>
                    </div>
                  </div>
                  <nav className="flex flex-col p-2 gap-1 flex-1">
                    {links.map((l) => (
                      <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="px-3 py-2.5 rounded hover:bg-muted text-sm">{l.label}</Link>
                    ))}
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded hover:bg-muted text-sm neon-text font-semibold">Admin</Link>
                    )}
                  </nav>
                  <div className="border-t p-3">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => { setOpen(false); signOut(); }}>Logout</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 sm:py-8"><Outlet /></main>
      <AnnouncementModal />
    </div>
  );
}
