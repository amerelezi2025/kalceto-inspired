import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { isStrongPassword, passwordChecks } from "@/lib/password-rules";

export const Route = createFileRoute("/_authenticated/set-password")({
  head: () => ({
    meta: [
      { title: "Choose your password — Kalceto Finder" },
      { name: "description", content: "Your email is confirmed. Choose a password to finish creating your account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SetPassword,
});

function SetPassword() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isStrongPassword(password)) return setError("Your password isn't strong enough yet.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password, data: { has_password: true } });
    setBusy(false);
    if (error) {
      if (/pwned|leaked|weak/i.test(error.message)) return setError("This password has appeared in a data leak. Pick a different one.");
      if (/reauth|current password|recent/i.test(error.message)) return setError("For safety, please log in again with an email link, then set your password.");
      return setError(error.message);
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <p className="font-display text-2xl text-primary">Kalceto Finder</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border bg-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-widest text-primary">✓ Email confirmed</p>
        <h1 className="text-5xl">Choose a password</h1>
        <p className="text-sm text-muted-foreground">
          Last step for <span className="text-foreground">{user.email}</span>. You'll use this password to log in next time.
        </p>
        <Input type="password" required placeholder="Password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        <ul className="space-y-1 text-xs">
          {passwordChecks.map((c) => (
            <li key={c.label} className={c.test(password) ? "text-primary" : "text-muted-foreground"}>
              {c.test(password) ? "✓" : "•"} {c.label}
            </li>
          ))}
        </ul>
        <Input type="password" required placeholder="Repeat password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : "Save password"}</Button>
      </form>
    </main>
  );
}
