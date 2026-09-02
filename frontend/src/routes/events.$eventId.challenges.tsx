import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Flag, Trophy } from "lucide-react";
import axios from "axios";
import { useMemo, useRef, useState } from "react";
import { challengesApi } from "@/api/challenges";
import { eventsApi } from "@/api/events";
import { CHALLENGE_CATEGORIES, type Challenge } from "@/api/types";
import { AppShell } from "@/components/app-shell";
import { ChallengeCard } from "@/components/challenge-card";
import { ChallengeModal } from "@/components/challenge-modal";
import { EventNav } from "@/components/event-nav";
import { RequireAuth } from "@/components/require-auth";
import { CardSkeletonGrid, EmptyState, ErrorState, PageHeader } from "@/components/ui-states";
import { Button } from "@/components/ui/button";
import { useEventAccess, useMyTeam } from "@/hooks/use-event-access";
import { apiErrorMessage } from "@/lib/api-client";
import { eventStatus } from "@/lib/format";

export const Route = createFileRoute("/events/$eventId/challenges")({
  head: () => ({
    meta: [
      { title: "Challenges — CaptureBase" },
      { name: "description", content: "Browse event challenges and submit flags." },
      { property: "og:title", content: "Challenges — CaptureBase" },
      { property: "og:description", content: "Browse event challenges and submit flags." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ChallengesPage />
    </RequireAuth>
  ),
});

function ChallengesPage() {
  const { eventId } = Route.useParams();
  const access = useEventAccess(eventId);
  const [selected, setSelected] = useState<Challenge | null>(null);
  const [category, setCategory] = useState<string>("ALL");
  const eventNotStartedRef = useRef(false);

  const event = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsApi.byId(eventId),
  });

  const status = event.data ? eventStatus(event.data) : null;
  const isUpcoming = status === "Upcoming";
  const isLive = status === "Live";
  const isEnded = status === "Ended";

  // The backend only serves /teams/me and the challenge list to normal members
  // while the event is live; before start and after end it rejects with 400.
  // Skip those calls entirely outside of the live window so the backend's
  // expected responses never surface as console network errors.
  const myTeam = useMyTeam(eventId, !access.isAdmin && access.isMember && isLive);
  const teamId = access.isAdmin ? undefined : myTeam.data?.id;
  const ready = access.isAdmin || Boolean(teamId);

  const challenges = useQuery({
    queryKey: ["event", eventId, "challenges", teamId ?? "admin"],
    queryFn: async () => {
      try {
        eventNotStartedRef.current = false;
        return await challengesApi.list(eventId, teamId);
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 400 &&
          (error.response.data as { message?: string })?.message === "Event did not start yet"
        ) {
          eventNotStartedRef.current = true;
          return [];
        }
        throw error;
      }
    },
    enabled: access.isMember && ready && (access.isAdmin || isLive),
  });

  const visible = useMemo(
    () =>
      (challenges.data ?? []).filter((c) => category === "ALL" || c.category === category),
    [challenges.data, category],
  );

  const isEventNotStarted =
    eventNotStartedRef.current && challenges.isSuccess && (challenges.data ?? []).length === 0;

  // When "ALL" is selected, group challenges under their category header
  // instead of showing one unordered list.
  const groups = useMemo(() => {
    const order = [...CHALLENGE_CATEGORIES] as string[];
    const byCategory = new Map<string, Challenge[]>();
    for (const challenge of visible) {
      const list = byCategory.get(challenge.category) ?? [];
      list.push(challenge);
      byCategory.set(challenge.category, list);
    }
    return [...byCategory.entries()]
      .sort((a, b) => {
        const ai = order.indexOf(a[0]);
        const bi = order.indexOf(b[0]);
        return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
      })
      .map(([name, items]) => ({
        name,
        items: [...items].sort((a, b) => a.points - b.points || a.title.localeCompare(b.title)),
      }));
  }, [visible]);

  const solved = (challenges.data ?? []).filter((c) => c.solved).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow={event.data?.title ?? "Event"}
        title="Challenges"
        description={
          access.isAdmin
            ? "You see every challenge as an organiser."
            : `${solved} of ${challenges.data?.length ?? 0} solved by your team.`
        }
      />
      <EventNav eventId={eventId} isAdmin={access.isAdmin} />

      {!access.isMember ? (
        <div className="mt-6">
          <EmptyState
            title="Join the event first"
            description="Challenges are only visible to event members."
          />
        </div>
      ) : !access.isAdmin && isUpcoming ? (
        <div className="mt-6 rounded-lg border border-border bg-muted/50 p-6 text-center text-sm text-muted-foreground">
          Event did not start yet.
        </div>
      ) : !access.isAdmin && isEnded ? (
        <div className="mt-6">
          <EmptyState
            title="This event has ended"
            description="Teams can no longer be created or joined — check the final standings."
            icon={<Trophy className="size-5" aria-hidden />}
            action={
              <Button asChild size="sm">
                <Link to="/events/$eventId/leaderboard" params={{ eventId }}>
                  View leaderboard
                </Link>
              </Button>
            }
          />
        </div>
      ) : !access.isAdmin && !myTeam.isLoading && !teamId ? (
        <div className="mt-6">
          <EmptyState
            title="You need a team"
            description="Create or join a team in this event to see and solve challenges."
            icon={<Flag className="size-5" aria-hidden />}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-1.5">
            {["ALL", ...CHALLENGE_CATEGORIES].map((item) => (
              <Button
                key={item}
                size="sm"
                variant={category === item ? "default" : "outline"}
                onClick={() => setCategory(item)}
              >
                {item}
              </Button>
            ))}
          </div>

          <div className="mt-6">
            {challenges.isLoading || myTeam.isLoading ? (
              <CardSkeletonGrid />
            ) : isEventNotStarted ? (
              <div className="mt-6 rounded-lg border border-border bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                Event did not start yet.
              </div>
            ) : challenges.isError ? (
              <ErrorState
                message={apiErrorMessage(challenges.error)}
                onRetry={() => challenges.refetch()}
              />
            ) : visible.length === 0 ? (
              <EmptyState
                title={access.isAdmin ? "No challenges yet" : "No challenges here yet"}
                description={
                  access.isAdmin
                    ? "Create your first challenge to get started."
                    : "Check back once the organiser publishes tasks."
                }
              />
            ) : (
              <div className="space-y-8">
                {groups.map((group) => (
                  <section key={group.name}>
                    <div className="mb-3 flex items-center gap-3">
                      <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {group.name}
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        {group.items.length}
                      </span>
                      <span className="h-px flex-1 bg-border" aria-hidden />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {group.items.map((challenge) => (
                        <ChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          onOpen={() => setSelected(challenge)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <ChallengeModal
        challenge={selected}
        eventId={eventId}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </AppShell>
  );
}
