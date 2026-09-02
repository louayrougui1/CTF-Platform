import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Flag, Plus, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { EventCard } from "@/components/event-card";
import { RequireAuth } from "@/components/require-auth";
import { JoinByCodeForm } from "@/components/join-by-code";
import { CardSkeletonGrid, EmptyState, ErrorState, PageHeader } from "@/components/ui-states";
import { Button } from "@/components/ui/button";
import { useJoinedEvents, useOwnedEvents } from "@/hooks/use-event-access";
import { useSession } from "@/hooks/use-session";
import { apiErrorMessage } from "@/lib/api-client";
import { eventStatus } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CaptureBase" },
      { name: "description", content: "Your live CTF events, teams and organiser tools." },
      { property: "og:title", content: "Dashboard — CaptureBase" },
      { property: "og:description", content: "Your live CTF events, teams and organiser tools." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

function DashboardPage() {
  const { user } = useSession();
  const joined = useJoinedEvents();
  const owned = useOwnedEvents();

  const live = (joined.data ?? []).filter((e) => eventStatus(e) === "Live");
  const upcoming = (joined.data ?? []).filter((e) => eventStatus(e) === "Upcoming");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${user?.username ?? "hacker"}`}
        description="Everything you're competing in and everything you run, in one place."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/events">Browse events</Link>
            </Button>
            <Button asChild>
              <Link to="/events/new">
                <Plus className="size-4" aria-hidden />
                New event
              </Link>
            </Button>
          </>
        }
      />

      <section className="surface-card mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold">Have an invite code?</h2>
          <p className="text-sm text-muted-foreground">
            Private events don't appear in browse — join directly with the code you were given.
          </p>
        </div>
        <JoinByCodeForm />
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatTile icon={Flag} label="Events joined" value={joined.data?.length ?? 0} />
        <StatTile icon={Trophy} label="Events owned" value={owned.data?.length ?? 0} />
        <StatTile icon={CalendarClock} label="Live right now" value={live.length} />
      </div>

      <Section title="Live events" className="mt-10">
        {joined.isLoading ? (
          <CardSkeletonGrid count={3} />
        ) : joined.isError ? (
          <ErrorState message={apiErrorMessage(joined.error)} onRetry={() => joined.refetch()} />
        ) : live.length === 0 ? (
          <EmptyState
            title="Nothing running yet"
            description="Join a public event or wait for an upcoming one to start."
            action={
              <Button asChild size="sm">
                <Link to="/events">Browse events</Link>
              </Button>
            }
          />
        ) : (
          <Grid>
            {live.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </Grid>
        )}
      </Section>

      {upcoming.length > 0 ? (
        <Section title="Upcoming" className="mt-10">
          <Grid>
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </Grid>
        </Section>
      ) : null}

      <Section title="Events you own" className="mt-10">
        {owned.isLoading ? (
          <CardSkeletonGrid count={3} />
        ) : owned.data && owned.data.length > 0 ? (
          <Grid>
            {owned.data.map((event) => (
              <EventCard key={event.id} event={event} manage />
            ))}
          </Grid>
        ) : (
          <EmptyState
            title="You haven't created an event"
            description="Create an event to write challenges, invite teams and run a scoreboard."
            action={
              <Button asChild size="sm">
                <Link to="/events/new">Create an event</Link>
              </Button>
            }
          />
        )}
      </Section>
    </AppShell>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flag;
  label: string;
  value: number;
}) {
  return (
    <div className="surface-card flex items-center gap-4 p-5">
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Section({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={className}>
      <h2 className="mb-4 font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
