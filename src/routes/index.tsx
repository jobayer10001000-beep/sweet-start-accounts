import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, Download, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Point Arena — Esports Point Table Generator" },
      { name: "description", content: "Generate stunning PUBG, BGMI & Free Fire point tables in seconds. Live preview, HD download, neon esports templates." },
      { property: "og:title", content: "Point Arena — Esports Point Table Generator" },
      { property: "og:description", content: "Generate stunning PUBG, BGMI & Free Fire point tables in seconds. Live preview, HD download, neon esports templates." },
      { property: "og:url", content: "https://pa-arena.lovable.app/" },
    ],
    links: [
      { rel: "canonical", href: "https://pa-arena.lovable.app/" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <header className="container mx-auto flex items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg" style={{ background: "var(--gradient-primary)" }} />
          <span className="text-xl font-bold tracking-tight">POINT <span className="neon-text">ARENA</span></span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/auth"><Button variant="ghost">Login</Button></Link>
          <Link to="/auth"><Button className="neon-border">Get Started</Button></Link>
        </nav>
      </header>

      <main className="container mx-auto px-6 pt-16 pb-24 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> AI-powered esports templates
        </div>
        <h1 className="mt-6 text-5xl md:text-7xl font-black tracking-tight">
          Create <span className="neon-text">Pro Esports</span><br/>Point Tables Instantly
        </h1>
        <p className="mt-6 mx-auto max-w-2xl text-lg text-muted-foreground">
          Build, preview and download stunning HD point tables for PUBG, BGMI, Free Fire and any battle-royale tournament — in under a minute.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link to="/auth"><Button size="lg" className="neon-border h-12 px-8 text-base">Start free — 5 credits</Button></Link>
          <Link to="/auth"><Button size="lg" variant="outline" className="h-12 px-8 text-base">See templates</Button></Link>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            { icon: Zap, title: "Live Preview", body: "Type team names, kills and positions — the table updates in real time with auto-ranking." },
            { icon: Trophy, title: "Auto Ranking", body: "Highest total wins, ties broken by kill count. Zero manual sorting." },
            { icon: Download, title: "HD Download", body: "Export crystal-clear PNG. 1 credit per download. Buy credits anytime." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="glass rounded-2xl p-6 text-left">
              <Icon className="h-7 w-7 text-primary" />
              <h2 className="mt-4 text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="container mx-auto px-6 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Point Arena. All rights reserved.
      </footer>
    </div>
  );
}
