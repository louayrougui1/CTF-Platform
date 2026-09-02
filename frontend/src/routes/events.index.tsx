import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { eventsApi } from "@/api/events";
import { AppShell } from "@/components/app-shell";
import { EventCard } from "@/components/event-card";
import { JoinEventButton } from "@/components/join-event-button";
import { JoinByCodeForm } from "@/components/join-by-code";
import { CardSkeletonGrid, EmptyState, ErrorState, PageHeader } from "@/components/ui-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJoinedEvents } from "@/hooks/use-event-access";
import { useSession } from "@/hooks/use-session";
import { apiErrorMessage } from "@/lib/api-client";
import { eventStatus, type EventStatusValue } from "@/lib/format";
import { RequireAuth } from "@/components/require-auth";
export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Browse CTF events — CaptureBase" },
      {
        name: "description",
        content: "Discover public Capture The Flag competitions and join one in a click.",
      },
      { property: "og:title", content: "Browse CTF events — CaptureBase" },
      {
        property: "og:description",
        content: "Discover public Capture The Flag competitions and join one in a click.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <BrowseEventsPage />
    </RequireAuth>
  ),
});

const FILTERS: (EventStatusValue | "All")[] = ["All", "Live", "Upcoming", "Ended"];

function BrowseEventsPage() {
  const { isAuthenticated } = useSession();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const events = useQuery({ queryKey: ["events", "browse"], queryFn: eventsApi.browse });
  const joined = useJoinedEvents(isAuthenticated);
  const joinedIds = new Set((joined.data ?? []).map((e) => e.id));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (events.data ?? []).filter((event) => {
      const matchesQuery =
        !q ||
        event.title.toLowerCase().includes(q) ||
        (event.description ?? "").toLowerCase().includes(q);
      const matchesFilter = filter === "All" || eventStatus(event) === filter;
      return matchesQuery && matchesFilter;
    });
  }, [events.data, query, filter]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Events"
        title="Browse events"
        description="Public competitions open to everyone. Private events need an invite code."
        actions={
          isAuthenticated ? (
            <Button asChild>
              <Link to="/events/new">
                <Plus className="size-4" aria-hidden />
                New event
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/register">Create an account</Link>
            </Button>
          )
        }
      />

      {isAuthenticated ? (
        <section className="surface-card mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold">Have an invite code?</h2>
            <p className="text-sm text-muted-foreground">
              Private events are hidden here — join directly with the code you were given.
            </p>
          </div>
          <JoinByCodeForm />
        </section>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events"
            className="pl-9"
            aria-label="Search events"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={filter === item ? "default" : "outline"}
              onClick={() => setFilter(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {events.isLoading ? (
          <CardSkeletonGrid />
        ) : events.isError ? (
          <ErrorState message={apiErrorMessage(events.error)} onRetry={() => events.refetch()} />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No events match"
            description="Try a different search term or filter."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                extra={
                  eventStatus(event) === "Ended" ? (
                    <p className="w-full rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                      This event has ended — results and leaderboard only. Teams can no longer be
                      created or joined.
                    </p>
                  ) : null
                }
                action={
                  isAuthenticated &&
                  event.isPublic &&
                  !joinedIds.has(event.id) &&
                  eventStatus(event) !== "Ended" ? (
                    <JoinEventButton eventId={event.id} />
                  ) : null
                }
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
