import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { useMemo, useState } from "react";
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
import { apiErrorMessage, isInformationalResponse } from "@/lib/api-client";

export const Route = createFileRoute("/events/$eventId/challenges")({
  head: () => ({
    meta: [
      { title: "Challenges — FlagLab" },
      { name: "description", content: "Browse event challenges and submit flags." },
      { property: "og:title", content: "Challenges — FlagLab" },
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

  const event = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsApi.byId(eventId),
  });

  // Participants must scope the list to their team; owners/admins must not.
  const myTeam = useMyTeam(eventId, !access.isAdmin && access.isMember);
  const teamId = access.isAdmin ? undefined : myTeam.data?.id;
  const ready = access.isAdmin || Boolean(teamId);

  const challenges = useQuery({
    queryKey: ["event", eventId, "challenges", teamId ?? "admin"],
    queryFn: () => challengesApi.list(eventId, teamId),
    enabled: access.isMember && ready,
    retry: false,
  });

  const visible = useMemo(
    () =>
      (challenges.data ?? []).filter((c) => category === "ALL" || c.category === category),
    [challenges.data, category],
  );

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
            ) : challenges.isError && isInformationalResponse(challenges.error) ? (
              // Expected backend state (e.g. "Event did not start yet.") —
              // show the backend message verbatim, not an error UI.
              <EmptyState title={apiErrorMessage(challenges.error)} />
            ) : challenges.isError ? (
              <ErrorState
                message={apiErrorMessage(challenges.error)}
                onRetry={() => challenges.refetch()}
              />
            ) : visible.length === 0 ? (
              access.isAdmin ? (
                <EmptyState
                  title="Create Challenges"
                  icon={<Flag className="size-5" aria-hidden />}
                  action={
                    <Button asChild size="sm">
                      <Link to="/events/$eventId/manage" params={{ eventId }}>
                        Create Challenges
                      </Link>
                    </Button>
                  }
                />
              ) : (
                <EmptyState title="No challenges match this filter." />
              )
            ) : (
              <div className="space-y-8">
                {groups.map((group) => (
                  <section key={group.name}>
                    <div className="mb-3 flex items-center gap-3">
                      <h2 className="font-mono text-base font-semibold uppercase tracking-widest text-foreground sm:text-lg">
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
