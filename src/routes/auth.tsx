import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Point Arena" },
      { name: "description", content: "Sign in or create your Point Arena account to start generating esports point tables for PUBG, BGMI and Free Fire tournaments." },
      { property: "og:title", content: "Sign in — Point Arena" },
      { property: "og:description", content: "Sign in or create your Point Arena account to start generating esports point tables." },
      { property: "og:url", content: "https://pa-arena.lovable.app/auth" },
    ],
    links: [{ rel: "canonical", href: "https://pa-arena.lovable.app/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) nav({ to: "/dashboard" }); }, [user, nav]);

  const signIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    nav({ to: "/dashboard" });
  };
  const signUp = async () => {
    const normalizedPhone = phone.replace(/\D/g, "");
    if (normalizedPhone.length < 10) return toast.error("Please enter a valid phone number");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin + "/dashboard", data: { username, phone: normalizedPhone } },
    });
    if (error) {
      setLoading(false);
      const msg = /PHONE_ALREADY_USED|duplicate key|profiles_phone_unique/i.test(error.message)
        ? "This phone number is already linked to another account."
        : error.message;
      return toast.error(msg);
    }
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInErr) return toast.success("Account created. Please sign in.");
    toast.success("Welcome to Point Arena!");
    nav({ to: "/dashboard" });
  };
  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass w-full max-w-md rounded-2xl p-8">
        <Link to="/" className="text-sm text-muted-foreground">← Back</Link>
        <h1 className="mt-3 text-3xl font-bold">Welcome to <span className="neon-text">Point Arena</span></h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to create esports point tables.</p>

        <Button variant="outline" className="mt-6 w-full" onClick={google}>Continue with Google</Button>
        <div className="my-4 text-center text-xs text-muted-foreground">— or —</div>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="space-y-3 pt-4">
            <div><Label htmlFor="signin-email">Email</Label><Input id="signin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label htmlFor="signin-password">Password</Label><Input id="signin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button className="w-full neon-border" disabled={loading} onClick={signIn}>Sign in</Button>
          </TabsContent>
          <TabsContent value="signup" className="space-y-3 pt-4">
            <div><Label htmlFor="signup-username">Username</Label><Input id="signup-username" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
            <div><Label htmlFor="signup-phone">Phone number</Label><Input id="signup-phone" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label htmlFor="signup-email">Email</Label><Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label htmlFor="signup-password">Password</Label><Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button className="w-full neon-border" disabled={loading} onClick={signUp}>Create account</Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}