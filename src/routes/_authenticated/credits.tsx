import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, Sparkles, Video } from "lucide-react";
import { toast } from "sonner";
import type { Resolution } from "@/lib/resolutions";

export const Route = createFileRoute("/_authenticated/credits")({
  head: () => ({ meta: [{ title: "Buy Credits — Point Arena" }] }),
  component: Credits,
});

type Pkg = { id: string; title: string; price: number; credits: number; features: string[]; popular: boolean; max_resolution: Resolution };

function Credits() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [payNumber, setPayNumber] = useState("01957941250");
  const [selected, setSelected] = useState<Pkg | null>(null);
  const [method, setMethod] = useState<"bkash" | "nagad">("bkash");
  const [sender, setSender] = useState("");
  const [txid, setTxid] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("credit_packages").select("*").eq("active", true).order("sort_order")
      .then(({ data }) => setPackages((data ?? []) as Pkg[]));
    supabase.from("app_settings").select("value").eq("key", "site").maybeSingle()
      .then(({ data }) => {
        const n = (data?.value as { payment_number?: string } | null)?.payment_number;
        if (n) setPayNumber(n);
      });
  }, []);

  const submit = async () => {
    if (!selected || !user) return;
    if (!sender || !txid) return toast.error("Sender number and Transaction ID are required");
    setSubmitting(true);
    const { error } = await supabase.from("payment_requests").insert({
      user_id: user.id, package_id: selected.id, package_name: selected.title,
      amount: selected.price, credits: selected.credits, max_resolution: selected.max_resolution,
      payment_method: method, sender_number: sender, transaction_id: txid,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Payment request submitted — awaiting admin approval.");
    setSelected(null); setSender(""); setTxid("");
  };

  return (
    <div>
      <div className="text-center">
        <h1 className="text-4xl font-black">Power up your <span className="neon-text">arena</span></h1>
        <p className="mt-2 text-muted-foreground">1 credit = 1 HD download. No expiry.</p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {packages.map((p) => (
          <div key={p.id} className={`glass rounded-2xl p-6 relative ${p.popular ? "neon-border" : ""}`}>
            {p.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-bold" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
                <Sparkles className="inline h-3 w-3 mr-1" /> POPULAR
              </div>
            )}
            <h3 className="text-lg font-bold">{p.title}</h3>
            <div className="mt-3 flex items-baseline gap-1"><span className="text-4xl font-black neon-text">৳{p.price}</span></div>
            <div className="mt-1 text-sm text-muted-foreground">{p.credits} credits</div>
            <div className="mt-2 text-xs flex items-center gap-1.5 text-primary"><Video className="h-3.5 w-3.5" /> Unlock up to <b>{p.max_resolution?.toUpperCase()}</b></div>
            <ul className="mt-5 space-y-2 text-sm">
              {p.features.map((f, i) => <li key={i} className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> {f}</li>)}
            </ul>
            <Dialog open={selected?.id === p.id} onOpenChange={(o) => setSelected(o ? p : null)}>
              <DialogTrigger asChild>
                <Button className={`mt-6 w-full ${p.popular ? "neon-border" : ""}`}>Buy now</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Pay for {p.title} — ৳{p.price}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="glass rounded-lg p-4 text-sm">
                    Send <b>৳{p.price}</b> to <span className="neon-text font-bold">{payNumber}</span> via bKash or Nagad (Send Money), then enter the Transaction ID below.
                  </div>
                  <div>
                    <Label id={`pay-method-label-${p.id}`}>Payment method</Label>
                    <RadioGroup value={method} onValueChange={(v) => setMethod(v as "bkash" | "nagad")} className="flex gap-4 mt-2" aria-labelledby={`pay-method-label-${p.id}`}>
                      <label className="flex items-center gap-2"><RadioGroupItem value="bkash" id={`pay-bkash-${p.id}`} /> bKash</label>
                      <label className="flex items-center gap-2"><RadioGroupItem value="nagad" id={`pay-nagad-${p.id}`} /> Nagad</label>
                    </RadioGroup>
                  </div>
                  <div><Label htmlFor={`pay-sender-${p.id}`}>Your sender number</Label><Input id={`pay-sender-${p.id}`} value={sender} onChange={(e) => setSender(e.target.value)} placeholder="01XXXXXXXXX" /></div>
                  <div><Label htmlFor={`pay-txid-${p.id}`}>Transaction ID</Label><Input id={`pay-txid-${p.id}`} value={txid} onChange={(e) => setTxid(e.target.value)} placeholder="e.g. 7H4K2L9M3N" /></div>
                  <Button className="w-full neon-border" disabled={submitting} onClick={submit}>Submit payment</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    </div>
  );
}