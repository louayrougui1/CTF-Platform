import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Flag,
  Shield,
  Trophy,
  Users,
  Terminal,
  Puzzle,
  Globe,
  KeyRound,
  Bug,
  Binary,
  FileSearch,
  Eye,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { HomeMiniChallenge } from "@/components/home-mini-challenge";
import { Button } from "@/components/ui/button";
import { userApi } from "@/api/user";
import { useAuthStore } from "@/lib/auth-store";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CaptureBase — Run and play Capture The Flag events" },
      {
        name: "description",
        content:
          "A professional CTF platform: create events, form teams, solve security challenges and climb live leaderboards.",
      },
      { property: "og:title", content: "CaptureBase — Capture The Flag platform" },
      {
        property: "og:description",
        content: "Create events, form teams, solve challenges and climb live leaderboards.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Flag,
    title: "Real challenges",
    description:
      "Web, crypto, pwn, reverse, forensics and OSINT tasks with attachments and instant flag validation.",
  },
  {
    icon: Users,
    title: "Teams & roles",
    description:
      "Captains manage rosters, members join with a team password, owners promote event admins.",
  },
  {
    icon: Trophy,
    title: "Live leaderboards",
    description: "Scores update as flags land, so every team knows where they stand.",
  },
  {
    icon: Shield,
    title: "Private events",
    description: "Keep an event invite-only and share a rotating invite code with your cohort.",
  },
  {
    icon: Terminal,
    title: "Built for organisers",
    description: "Create and edit challenges, upload files, and track solve counts per task.",
  },
  {
    icon: Puzzle,
    title: "Focused UX",
    description: "Challenge cards open in a modal — description, download and submit in one place.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Create",
    description: "Create an event and add your challenges.",
  },
  {
    step: "02",
    title: "Compete",
    description: "Join a team, enter an event and start solving.",
  },
  {
    step: "03",
    title: "Capture",
    description: "Find flags, submit them and climb the leaderboard.",
  },
];

const CATEGORIES = [
  {
    label: "[ WEB ]",
    title: "Web",
    description: "Web vulnerabilities and application security",
    icon: Globe,
  },
  {
    label: "[ CRYPTO ]",
    title: "Crypto",
    description: "Cryptography, ciphers and cryptanalysis",
    icon: KeyRound,
  },
  {
    label: "[ PWN ]",
    title: "Pwn",
    description: "Binary exploitation and memory corruption",
    icon: Bug,
  },
  {
    label: "[ REVERSE ]",
    title: "Reverse",
    description: "Reverse engineering and program analysis",
    icon: Binary,
  },
  {
    label: "[ FORENSICS ]",
    title: "Forensics",
    description: "Digital forensics, files and artifacts",
    icon: FileSearch,
  },
  {
    label: "[ OSINT ]",
    title: "OSINT",
    description: "Open-source intelligence and investigation",
    icon: Eye,
  },
];

function Landing() {
  const { isAuthenticated, hydrated } = useSession();
  const setSession = useAuthStore((s) => s.setSession);

  // Google OAuth callback returns to "/?token=<access_token>".
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;
    setSession(token);
    window.history.replaceState({}, "", "/");
    // The callback only carries a token, so load the profile before
    // navigating — otherwise the app renders with user = null.
    void userApi
      .profile()
      .then((profile) => {
        useAuthStore.getState().setUser({
          id: profile.id,
          email: profile.email,
          username: profile.username,
          googleId: profile.googleId,
        });
      })
      .catch(() => {
        // ignore — protected pages will refetch the profile
      })
      .finally(() => {
        window.location.replace("/dashboard");
      });
  }, [setSession]);

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 sm:px-12 sm:py-20">
        <div className="grid-backdrop pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative max-w-2xl space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-primary-soft-foreground">
            <span
              className="inline-block size-1.5 animate-pulse rounded-full bg-current"
              aria-hidden
            />
            Capture the flag
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Run serious CTF events. Play them even better.
          </h1>
          <p className="font-mono text-sm text-muted-foreground">
            $ ./capturebase --start
            <span
              className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-primary"
              aria-hidden
            />
          </p>
          <p className="text-base text-muted-foreground sm:text-lg">
            CaptureBase gives organisers full control over events, challenges and teams — and gives
            players a clean, fast surface to hunt flags and climb the scoreboard.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to={hydrated && isAuthenticated ? "/dashboard" : "/register"}>
                {hydrated && isAuthenticated ? "Go to dashboard" : "Create your account"}
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/events">Browse events</Link>
            </Button>
          </div>
          <p className="pt-2 font-mono text-sm text-muted-foreground">
            No account needed to try —{" "}
            <a
              href="#mini-challenge"
              className="inline-flex items-center gap-1.5 font-medium text-primary transition-colors hover:text-primary/80"
            >
              Solve your first challenge
              <span aria-hidden>→</span>
            </a>
          </p>
        </div>
      </section>

      <section
        aria-labelledby="try-challenge-title"
        className="mt-16 scroll-mt-24 rounded-2xl border border-border bg-card/50 px-4 py-10 sm:px-8"
      >
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Try a challenge
          </p>
          <h2 id="try-challenge-title" className="font-display text-2xl font-semibold sm:text-3xl">
            Don’t just read about it — capture your first flag
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            A real mini challenge, right here on the page. No account, no setup — just you and the
            intercepted transmission.
          </p>
        </div>
        <div id="mini-challenge" className="mt-8">
          <HomeMiniChallenge />
        </div>
      </section>

      <section aria-labelledby="how-it-works-title" className="mt-16">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">How it works</p>
          <h2 id="how-it-works-title" className="font-display text-2xl font-semibold sm:text-3xl">
            Three steps to your first flag
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ step, title, description }) => (
            <div
              key={step}
              className="surface-card group space-y-3 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)]"
            >
              <span className="block font-mono text-3xl font-semibold text-primary/60 transition-colors group-hover:text-primary">
                {step}
              </span>
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="challenge-categories-title" className="mt-16">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Pick your battlefield
          </p>
          <h2
            id="challenge-categories-title"
            className="font-display text-2xl font-semibold sm:text-3xl"
          >
            Challenge categories
          </h2>
          <p className="text-sm text-muted-foreground">
            From web vulnerabilities to cryptography and reverse engineering, build and solve
            challenges across the CTF spectrum.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
            <span className="size-2 rounded-full bg-muted-foreground/30" aria-hidden />
            <span className="size-2 rounded-full bg-muted-foreground/30" aria-hidden />
            <span className="size-2 rounded-full bg-muted-foreground/30" aria-hidden />
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              $ ls /challenge-categories
            </span>
          </div>
          <ul className="divide-y divide-border">
            {CATEGORIES.map(({ label, title, description, icon: Icon }) => (
              <li
                key={label}
                className="group flex items-center gap-4 px-4 py-4 transition-colors duration-200 hover:bg-primary-soft/40 sm:px-6"
              >
                <Icon
                  className="size-4 shrink-0 text-primary/70 transition-colors group-hover:text-primary"
                  aria-hidden
                />
                <span className="whitespace-nowrap w-20 shrink-0 font-mono text-xs uppercase tracking-widest text-primary sm:w-24">
                  {label}
                </span>
                <div className="min-w-0 ml-4">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="truncate text-sm text-muted-foreground">{description}</p>
                </div>
                <span
                  className="ml-auto font-mono text-xs text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  aria-hidden
                >
                  →
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="platform-features-title" className="mt-16">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">The platform</p>
          <h2
            id="platform-features-title"
            className="font-display text-2xl font-semibold sm:text-3xl"
          >
            Everything a CTF needs
          </h2>
        </div>
        <div className="mx-auto mt-6 max-w-3xl divide-y divide-border border-y border-border">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="group flex items-start gap-4 py-5 sm:gap-5">
              <Icon
                className="mt-0.5 size-5 shrink-0 text-primary/80 transition-colors duration-200 group-hover:text-primary"
                aria-hidden
              />
              <div>
                <h3 className="font-display text-base font-semibold">{title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {!hydrated || isAuthenticated ? null : (
        <section className="mt-16 flex flex-col items-center gap-4 rounded-2xl border border-border bg-elevated px-6 py-12 text-center">
          <h2 className="font-display text-2xl font-semibold">Ready for your next competition?</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Register, verify your email and join a public event in under a minute.
          </p>
          <Button asChild size="lg">
            <Link to="/register">Get started</Link>
          </Button>
        </section>
      )}
    </AppShell>
  );
}
