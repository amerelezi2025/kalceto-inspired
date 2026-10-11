import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  // Accounts must choose a password before entering.
  beforeLoad: ({ context }) => {
    if (!context.user.user_metadata?.has_password) throw redirect({ to: "/set-password" });
  },
  head: () => ({ meta: [{ title: "My account — Kalceto Finder" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6">
      <p className="text-sm uppercase tracking-widest text-primary">Members only</p>
      <h1 className="mt-2 text-6xl">Mirë se erdhe!</h1>
      <p className="mt-4 text-muted-foreground">You're signed in as <span className="text-foreground">{user.email}</span>. Pitch bookings in Shkodër will live here.</p>
      <Button variant="outline" className="mt-8 w-fit" onClick={signOut}>Log out</Button>
    </main>
  );
}
