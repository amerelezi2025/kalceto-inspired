import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kalceto Finder — Book football pitches in Shkodër" },
      { name: "description", content: "Find and book kalceto pitches in Shkodër, Albania." },
      { property: "og:title", content: "Kalceto Finder — Shkodër" },
      { property: "og:description", content: "Find and book kalceto pitches in Shkodër, Albania." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6">
      <p className="text-sm uppercase tracking-[0.3em] text-accent">Shkodër · Albania</p>
      <h1 className="mt-3 text-7xl leading-none md:text-9xl">Kalceto<br /><span className="text-primary">Finder</span></h1>
      <p className="mt-6 max-w-md text-lg text-muted-foreground">Find a pitch, grab your friends, play tonight.</p>
      <div className="mt-10 flex gap-3">
        <Button asChild size="lg" className="shadow-glow"><Link to="/auth" search={{ mode: "signup" }}>Sign up</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/auth" search={{ mode: "login" }}>Log in</Link></Button>
      </div>
    </main>
  );
}
