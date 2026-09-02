import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut, Trash2, UserMinus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { eventsApi } from "@/api/events";
import { teamsApi } from "@/api/teams";
import { AppShell } from "@/components/app-shell";
import { EventNav } from "@/components/event-nav";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState, LoadingBlock, PageHeader } from "@/components/ui-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEventAccess, useMyTeam } from "@/hooks/use-event-access";
import { useSession } from "@/hooks/use-session";
import { apiErrorMessage } from "@/lib/api-client";
import { eventStatus } from "@/lib/format";

export const Route = createFileRoute("/events/$eventId/teams/$teamId")({
  head: () => ({
    meta: [
      { title: "Team details — CaptureBase" },
      { name: "description", content: "Team roster, captain controls and membership actions." },
      { property: "og:title", content: "Team details — CaptureBase" },
      { property: "og:description", content: "Team roster and captain controls." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <TeamDetailsPage />
    </RequireAuth>
  ),
});

function TeamDetailsPage() {
  const { eventId, teamId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const access = useEventAccess(eventId);

  const event = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsApi.byId(eventId),
  });

  const isLive = event.data ? eventStatus(event.data) === "Live" : false;

  const myTeam = useMyTeam(eventId, access.isMember && isLive);

  const team = useQuery({
    queryKey: ["event", eventId, "team", teamId],
    queryFn: () => teamsApi.byId(eventId, teamId),
    enabled: access.isMember,
  });

  const [name, setName] = useState("");
  const [teamPassword, setTeamPassword] = useState("");

  useEffect(() => {
    if (team.data) setName(team.data.name);
  }, [team.data]);

  const isCaptain =
    team.data?.members.some((m) => m.userId === user?.id && m.role === "CAPTAIN") ?? false;
  const isMemberOfTeam = team.data?.members.some((m) => m.userId === user?.id) ?? false;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["event", eventId, "team"] });
    void queryClient.invalidateQueries({ queryKey: ["event", eventId, "teams"] });
  };

  const update = useMutation({
    mutationFn: () =>
      teamsApi.update(eventId, teamId, {
        name,
        ...(teamPassword ? { teamPassword } : {}),
      }),
    onSuccess: () => {
      toast.success("Team updated.");
      setTeamPassword("");
      invalidate();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: () => teamsApi.remove(eventId, teamId),
    onSuccess: () => {
      toast.success("Team deleted.");
      invalidate();
      navigate({ to: "/events/$eventId/teams", params: { eventId } });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const leave = useMutation({
    mutationFn: () => teamsApi.leave(eventId, teamId),
    onSuccess: () => {
      toast.success("You left the team.");
      invalidate();
      navigate({ to: "/events/$eventId/teams", params: { eventId } });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const kick = useMutation({
    mutationFn: (userId: string) => teamsApi.kick(eventId, teamId, userId),
    onSuccess: () => {
      toast.success("Member removed.");
      invalidate();
      void team.refetch();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Team"
        title={team.data?.name ?? "Team"}
        description={
          myTeam.data?.id === teamId ? "This is your team." : "Roster for this event team."
        }
        actions={
          isMemberOfTeam ? (
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
              Leave team
            </Button>
          ) : null
        }
      />
      <EventNav eventId={eventId} isAdmin={access.isAdmin} />

      <div className="mt-6">
        {team.isLoading ? (
          <LoadingBlock label="Loading team…" />
        ) : team.isError || !team.data ? (
          <ErrorState message={apiErrorMessage(team.error)} onRetry={() => team.refetch()} />
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            <section className="surface-card overflow-hidden lg:col-span-2">
              <div className="border-b border-border p-5">
                <h2 className="font-display text-lg font-semibold">Members</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    {isCaptain ? <TableHead className="text-right">Actions</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.data.members.map((member) => (
                    <TableRow key={member.userId}>
                      <TableCell className="font-medium">{member.username}</TableCell>
                      <TableCell>
                        <Badge variant={member.role === "CAPTAIN" ? "default" : "outline"}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      {isCaptain ? (
                        <TableCell className="text-right">
                          {member.userId === user?.id ? null : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => kick.mutate(member.userId)}
                              disabled={kick.isPending}
                            >
                              <UserMinus className="size-3.5" aria-hidden />
                              Remove
                            </Button>
                          )}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>

            {isCaptain ? (
              <aside className="surface-card space-y-4 p-6">
                <h2 className="font-display text-lg font-semibold">Captain controls</h2>
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    update.mutate();
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="team-name">Team name</Label>
                    <Input
                      id="team-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-password">New team password</Label>
                    <Input
                      id="team-password"
                      value={teamPassword}
                      onChange={(e) => setTeamPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                  <Button type="submit" disabled={update.isPending}>
                    {update.isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : null}
                    Save team
                  </Button>
                </form>

                <div className="border-t border-border pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => remove.mutate()}
                    disabled={remove.isPending}
                  >
                    {remove.isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="size-4" aria-hidden />
                    )}
                    Delete team
                  </Button>
                </div>
              </aside>
            ) : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}
