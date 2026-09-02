import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { eventsApi } from "@/api/events";
import { teamsApi } from "@/api/teams";
import { AppShell } from "@/components/app-shell";
import { EventNav } from "@/components/event-nav";
import { RequireAuth } from "@/components/require-auth";
import { CardSkeletonGrid, EmptyState, ErrorState, PageHeader } from "@/components/ui-states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEventAccess, useMyTeam } from "@/hooks/use-event-access";
import { apiErrorMessage } from "@/lib/api-client";
import { eventStatus } from "@/lib/format";

export const Route = createFileRoute("/events/$eventId/teams/")({
  head: () => ({
    meta: [
      { title: "Teams — CaptureBase" },
      { name: "description", content: "Create or join a team for this Capture The Flag event." },
      { property: "og:title", content: "Teams — CaptureBase" },
      { property: "og:description", content: "Create or join a team for this CTF event." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <TeamsPage />
    </RequireAuth>
  ),
});

function TeamsPage() {
  const { eventId } = Route.useParams();
  const queryClient = useQueryClient();
  const access = useEventAccess(eventId);

  const event = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsApi.byId(eventId),
  });

  const hasEnded = event.data ? eventStatus(event.data) === "Ended" : false;
  const isLive = event.data ? eventStatus(event.data) === "Live" : false;

  const myTeam = useMyTeam(eventId, access.isMember && !hasEnded);

  // Only organisers get the full roster of teams; participants never fetch it.
  const teams = useQuery({
    queryKey: ["event", eventId, "teams"],
    queryFn: () => teamsApi.list(eventId),
    enabled: access.isMember && access.isAdmin,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["event", eventId, "teams"] });
    void queryClient.invalidateQueries({ queryKey: ["event", eventId, "team", "me"] });
    void queryClient.invalidateQueries({ queryKey: ["event", eventId, "challenges"] });
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow={event.data?.title ?? "Event"}
        title="Teams"
        description="Teams score together. Join one with its name and password, or start your own."
      />
      <EventNav eventId={eventId} isAdmin={access.isAdmin} />

      {!access.isMember ? (
        <div className="mt-6">
          <EmptyState
            title="Join the event first"
            description="Teams are visible to event members."
          />
        </div>
      ) : (
        <>
          {myTeam.data ? (
            <div className="surface-card mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Your team</p>
                <p className="font-display text-lg font-semibold">{myTeam.data.name}</p>
                <p className="text-sm text-muted-foreground">
                  {myTeam.data.members.length} member
                  {myTeam.data.members.length === 1 ? "" : "s"}
                </p>
              </div>
              <Button asChild variant="outline">
                <Link
                  to="/events/$eventId/teams/$teamId"
                  params={{ eventId, teamId: myTeam.data.id }}
                >
                  Manage team
                </Link>
              </Button>
            </div>
          ) : null}

          {!access.isAdmin ? (
            <div className="mt-6">
              {myTeam.isLoading ? (
                <CardSkeletonGrid count={1} />
              ) : myTeam.data ? null : hasEnded ? (
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
              ) : (
                <section className="surface-card flex flex-col gap-4 p-6">
                  <div>
                    <h2 className="font-display text-lg font-semibold">Get on a team</h2>
                    <p className="text-sm text-muted-foreground">
                      Ask your captain for the team name and password, or create your own team.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <JoinTeamDialog eventId={eventId} onDone={invalidate} />
                    <CreateTeamDialog eventId={eventId} onDone={invalidate} />
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="mt-6">
              {teams.isLoading ? (
                <CardSkeletonGrid count={3} />
              ) : teams.isError ? (
                <ErrorState message={apiErrorMessage(teams.error)} onRetry={() => teams.refetch()} />
              ) : (teams.data?.length ?? 0) === 0 ? (
                <EmptyState
                  title="No teams yet"
                  description="Participants can create teams from this page."
                  icon={<Users className="size-5" aria-hidden />}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {teams.data?.map((team) => (
                    <article key={team.id} className="surface-card flex flex-col gap-3 p-5">
                      <Link
                        to="/events/$eventId/teams/$teamId"
                        params={{ eventId, teamId: team.id }}
                        className="font-display text-lg font-semibold hover:text-primary"
                      >
                        {team.name}
                      </Link>
                      <div className="mt-auto flex gap-2 border-t border-border pt-4">
                        <Button variant="ghost" size="sm" asChild className="ml-auto">
                          <Link
                            to="/events/$eventId/teams/$teamId"
                            params={{ eventId, teamId: team.id }}
                          >
                            View
                          </Link>
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

function CreateTeamDialog({ eventId, onDone }: { eventId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [teamPassword, setTeamPassword] = useState("");

  const create = useMutation({
    mutationFn: () => teamsApi.create(eventId, { name, teamPassword }),
    onSuccess: () => {
      toast.success("Team created.");
      setOpen(false);
      setName("");
      setTeamPassword("");
      onDone();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Create team</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a team</DialogTitle>
          <DialogDescription>
            You'll be the captain. Share the name and password with teammates so they can join.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="team-name">Team name</Label>
            <Input id="team-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-password">Team password</Label>
            <Input
              id="team-password"
              required
              value={teamPassword}
              onChange={(e) => setTeamPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Create team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function JoinTeamDialog({ eventId, onDone }: { eventId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");

  const join = useMutation({
    mutationFn: () => teamsApi.join(eventId, teamName.trim(), password),
    onSuccess: () => {
      toast.success(`You joined ${teamName.trim()}.`);
      setOpen(false);
      setTeamName("");
      setPassword("");
      onDone();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Join team</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a team</DialogTitle>
          <DialogDescription>
            Enter the team name and password your captain gave you.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            join.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="join-team-name">Team name</Label>
            <Input
              id="join-team-name"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="join-password">Team password</Label>
            <Input
              id="join-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={join.isPending || !teamName.trim()}>
              {join.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Join team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
