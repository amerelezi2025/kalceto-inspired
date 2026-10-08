import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { requestCode } from "@/lib/auth.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["signup", "login"]).optional() }),
  head: () => ({
    meta: [
      { title: "Sign up or log in — Kalceto Finder" },
      { name: "description", content: "Get a sign-in link by email to enter Kalceto Finder." },
      { property: "og:title", content: "Sign in — Kalceto Finder" },
      { property: "og:description", content: "Get a sign-in link by email to enter Kalceto Finder." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "login">(search.mode ?? "login");
  const [step, setStep] = useState<"email" | "sent">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const send = useServerFn(requestCode);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && navigate({ to: "/dashboard" }));
  }, [navigate]);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true); setError("");
    const r = await send({ data: { email, mode } }).catch(() => ({ ok: false as const, error: "Something went wrong. Try again." }));
    setBusy(false);
    if (!r.ok) { setError(r.error); if ("wait" in r && r.wait) setWait(r.wait); return; }
    setStep("sent"); setWait(60);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link to="/" className="font-display text-2xl text-primary">Kalceto Finder</Link>
      <div className="mt-6 rounded-xl border bg-card p-8 shadow-glow">
        {step === "email" ? (
          <form onSubmit={sendCode} className="space-y-4">
            <h1 className="text-5xl">{mode === "signup" ? "Create account" : "Log in"}</h1>
            <p className="text-sm text-muted-foreground">We'll email you a sign-in link. No password needed.</p>
            <Input type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || wait > 0}>{busy ? "Sending…" : wait > 0 ? `Wait ${wait}s` : "Email me a link"}</Button>
            <p className="text-center text-sm text-muted-foreground">
              {mode === "signup" ? "Already have an account? " : "New here? "}
              <button type="button" className="text-primary underline" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }}>
                {mode === "signup" ? "Log in" : "Sign up"}
              </button>
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <h1 className="text-5xl">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We sent a sign-in link to <span className="text-foreground">{email}</span>.
              Open the email and click the link to continue — it signs you in automatically. Check spam too.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-between text-sm">
              <button type="button" className="text-muted-foreground underline" onClick={() => { setStep("email"); setError(""); }}>Change email</button>
              <button type="button" className="text-primary underline disabled:no-underline disabled:text-muted-foreground" disabled={wait > 0 || busy} onClick={() => sendCode()}>
                {wait > 0 ? `Resend in ${wait}s` : "Resend email"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
