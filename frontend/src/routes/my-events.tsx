import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EventCard } from "@/components/event-card";
import { EventResult } from "@/components/event-result";
import { RequireAuth } from "@/components/require-auth";
import { CardSkeletonGrid, EmptyState, ErrorState, PageHeader } from "@/components/ui-states";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJoinedEvents, useOwnedEvents } from "@/hooks/use-event-access";
import { apiErrorMessage } from "@/lib/api-client";
import { eventStatus } from "@/lib/format";

export const Route = createFileRoute("/my-events")({
  head: () => ({
    meta: [
      { title: "My events — CaptureBase" },
      { name: "description", content: "Events you have joined and events you organise." },
      { property: "og:title", content: "My events — CaptureBase" },
      { property: "og:description", content: "Events you have joined and events you organise." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MyEventsPage />
    </RequireAuth>
  ),
});

function MyEventsPage() {
  const joined = useJoinedEvents();
  const owned = useOwnedEvents();
  const ownedIds = new Set((owned.data ?? []).map((e) => e.id));
  const participating = (joined.data ?? []).filter((e) => !ownedIds.has(e.id));

  return (
    <AppShell>
      <PageHeader
        eyebrow="My events"
        title="Your competitions"
        description="Switch between the events you play and the ones you run."
        actions={
          <Button asChild>
            <Link to="/events/new">
              <Plus className="size-4" aria-hidden />
              New event
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="playing" className="mt-6">
        <TabsList>
          <TabsTrigger value="playing">Playing ({participating.length})</TabsTrigger>
          <TabsTrigger value="organising">Organising ({owned.data?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="playing" className="mt-6">
          {joined.isLoading ? (
            <CardSkeletonGrid count={3} />
          ) : joined.isError ? (
            <ErrorState message={apiErrorMessage(joined.error)} onRetry={() => joined.refetch()} />
          ) : participating.length === 0 ? (
            <EmptyState
              title="You haven't joined an event"
              description="Public events can be joined instantly from the browse page."
              action={
                <Button asChild size="sm">
                  <Link to="/events">Browse events</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {participating.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  extra={
                    eventStatus(event) === "Ended" ? <EventResult eventId={event.id} /> : null
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="organising" className="mt-6">
          {owned.isLoading ? (
            <CardSkeletonGrid count={3} />
          ) : owned.isError ? (
            <ErrorState message={apiErrorMessage(owned.error)} onRetry={() => owned.refetch()} />
          ) : (owned.data?.length ?? 0) === 0 ? (
            <EmptyState
              title="No events yet"
              description="Create an event to publish challenges and run a leaderboard."
              action={
                <Button asChild size="sm">
                  <Link to="/events/new">Create an event</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {owned.data?.map((event) => (
                <EventCard key={event.id} event={event} manage />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
