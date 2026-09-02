import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Flag, Globe, Loader2, Lock, LogOut, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { eventsApi } from "@/api/events";
import { AppShell } from "@/components/app-shell";
import { EventStatusBadge } from "@/components/event-card";
import { EventNav } from "@/components/event-nav";
import { JoinEventButton, JoinWithCode } from "@/components/join-event-button";
import { ErrorState, LoadingBlock, PageHeader } from "@/components/ui-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEventAccess } from "@/hooks/use-event-access";
import { useSession } from "@/hooks/use-session";
import { apiErrorMessage } from "@/lib/api-client";
import { eventStatus, formatDate } from "@/lib/format";

export const Route = createFileRoute("/events/$eventId/")({
  head: () => ({
    meta: [
      { title: "Event details — CaptureBase" },
      { name: "description", content: "Event schedule, teams, challenges and how to join." },
      { property: "og:title", content: "Event details — CaptureBase" },
      { property: "og:description", content: "Event schedule, teams, challenges and how to join." },
    ],
  }),
  component: EventDetailsPage,
});

function EventDetailsPage() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSession();
  const access = useEventAccess(eventId);

  const event = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsApi.byId(eventId),
  });

  const stats = useQuery({
    queryKey: ["event", eventId, "stats"],
    queryFn: () => eventsApi.stats(eventId),
    enabled: access.isMember,
    retry: false,
  });

  const leave = useMutation({
    mutationFn: () => eventsApi.leave(eventId),
    onSuccess: () => {
      toast.success("You left the event.");
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate({ to: "/my-events" });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  if (event.isLoading) {
    return (
      <AppShell>
        <LoadingBlock label="Loading event…" />
      </AppShell>
    );
  }

  if (event.isError || !event.data) {
    return (
      <AppShell>
        <ErrorState message={apiErrorMessage(event.error)} onRetry={() => event.refetch()} />
      </AppShell>
    );
  }

  const data = event.data;
  const hasEnded = eventStatus(data) === "Ended";

  return (
    <AppShell>
      <PageHeader
        eyebrow="Event"
        title={data.title}
        description={data.description ?? ""}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <EventStatusBadge event={data} />
            <Badge variant="outline" className="gap-1.5 font-normal">
              {data.isPublic ? (
                <>
                  <Globe className="size-3" aria-hidden /> Public
                </>
              ) : (
                <>
                  <Lock className="size-3" aria-hidden /> Private
                </>
              )}
            </Badge>
            {isAuthenticated && access.isMember && !access.isOwner ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => leave.mutate()}
                disabled={leave.isPending}
              >
                {leave.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <LogOut className="size-3.5" aria-hidden />
                )}
                Leave event
              </Button>
            ) : null}
          </div>
        }
      />

      {access.isMember ? <EventNav eventId={eventId} isAdmin={access.isAdmin} /> : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="surface-card space-y-4 p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">About this event</h2>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {data.description || "The organiser hasn't added a description yet."}
          </p>

          <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
            <InfoRow icon={CalendarDays} label="Starts" value={formatDate(data.startDate)} />
            <InfoRow icon={CalendarDays} label="Ends" value={formatDate(data.endDate)} />
          </div>

          {access.isMember && stats.data ? (
            <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
              <Stat label="Members" value={stats.data.memberCount} />
              <Stat label="Teams" value={stats.data.teamCount} />
              <Stat label="Challenges" value={stats.data.challengeCount} />
              <Stat label="Solves" value={stats.data.solveCount} />
            </div>
          ) : null}
        </section>

        <aside className="surface-card space-y-4 p-6">
          {hasEnded && access.isMember && !access.isAdmin ? (
            <>
              <h2 className="font-display text-lg font-semibold">Event finished</h2>
              <p className="text-sm text-muted-foreground">
                This competition is over. Check the final standings to see how your team did.
              </p>
              <Button asChild className="w-full">
                <Link to="/events/$eventId/leaderboard" params={{ eventId }}>
                  <Trophy className="size-4" aria-hidden />
                  View leaderboard
                </Link>
              </Button>
            </>
          ) : (
          <>
          <h2 className="font-display text-lg font-semibold">
            {access.isMember ? "You're in" : "Join this event"}
          </h2>

          {!isAuthenticated ? (
            <>
              <p className="text-sm text-muted-foreground">
                Log in or create an account to join this competition.
              </p>
              <Button asChild className="w-full">
                <Link to="/login">Log in to join</Link>
              </Button>
            </>
          ) : access.isMember ? (
            <>
              <p className="text-sm text-muted-foreground">
                {access.isOwner
                  ? "You own this event."
                  : access.role === "ADMIN"
                    ? "You're an event admin."
                    : "You're a participant. Join or create a team, then start solving."}
              </p>
              <div className="grid gap-2">
                <Button asChild variant="outline" className="w-full">
                  <Link to="/events/$eventId/challenges" params={{ eventId }}>
                    <Flag className="size-4" aria-hidden />
                    Challenges
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/events/$eventId/teams" params={{ eventId }}>
                    <Users className="size-4" aria-hidden />
                    Teams
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/events/$eventId/leaderboard" params={{ eventId }}>
                    <Trophy className="size-4" aria-hidden />
                    Leaderboard
                  </Link>
                </Button>
              </div>
            </>
          ) : data.isPublic ? (
            <>
              <p className="text-sm text-muted-foreground">
                This event is public — join instantly and pick a team.
              </p>
              <JoinEventButton eventId={eventId} size="default" label="Join event" />
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                This event is private. Enter the invite code the organiser gave you.
              </p>
              <JoinWithCode eventId={eventId} />
            </>
          )}
          </>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
