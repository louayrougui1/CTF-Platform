import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Crown, Loader2, LogOut, Trash2, UserMinus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { teamsApi } from "@/api/teams";
import { EventNav } from "@/components/event-nav";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState, LoadingBlock, PageHeader } from "@/components/ui-states";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { apiErrorMessage, apiMessage } from "@/lib/api-client";

export const Route = createFileRoute("/_app/events/$eventId/teams/$teamId")({
  head: () => ({
    meta: [
      { title: "Team details — FlagLab" },
      { name: "description", content: "Team roster, captain controls and membership actions." },
      { property: "og:title", content: "Team details — FlagLab" },
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
  const myTeam = useMyTeam(eventId, access.isMember);

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
  // The organiser's own "_Admin" team is managed by the backend: it must not be
  // deleted or left from the UI.
  const isAdminTeam =
    access.isAdmin && (myTeam.data?.id === teamId || (team.data?.name ?? "").startsWith("_Admin"));

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

  const transfer = useMutation({
    mutationFn: (userId: string) => teamsApi.transferCaptain(eventId, teamId, userId),
    onSuccess: (data) => {
      toast.success(apiMessage(data, "Captain transferred successfully"));
      invalidate();
      void team.refetch();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });


  return (
    <>
      <PageHeader
        eyebrow="Team"
        title={team.data?.name ?? "Team"}
        description={
          myTeam.data?.id === teamId ? "This is your team." : "Roster for this event team."
        }
        actions={
          isMemberOfTeam && !isAdminTeam ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={leave.isPending}>
                  {leave.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <LogOut className="size-3.5" aria-hidden />
                  )}
                  Leave team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave this team?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Warning: leaving removes all the points you earned for this team — every
                    challenge you solved for them will no longer count towards their score.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => leave.mutate()}>Leave team</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
                            <div className="flex justify-end gap-1">
                              {isAdminTeam ? null : (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" disabled={transfer.isPending}>
                                      <Crown className="size-3.5" aria-hidden />
                                      Make captain
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Transfer captain to {member.username}?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        They will take over captain controls for this team, and you
                                        become a regular member.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => transfer.mutate(member.userId)}
                                      >
                                        Transfer
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" disabled={kick.isPending}>
                                    <UserMinus className="size-3.5" aria-hidden />
                                    Remove
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Remove {member.username} from the team?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      The points they earned for this team will no longer count
                                      towards its score.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => kick.mutate(member.userId)}>
                                      Remove member
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>

            {isCaptain && !isAdminTeam ? (
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={remove.isPending}>
                        {remove.isPending ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          <Trash2 className="size-4" aria-hidden />
                        )}
                        Delete team
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this team?</AlertDialogTitle>
                        <AlertDialogDescription>
                          All members are removed and the team's score is lost. This cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove.mutate()}>
                          Delete team
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </aside>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
