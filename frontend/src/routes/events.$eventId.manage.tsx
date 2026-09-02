import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Copy, Loader2, Pencil, Plus, RefreshCw, ShieldPlus, ShieldMinus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { challengesApi, type ChallengeFormValues } from "@/api/challenges";
import { eventsApi } from "@/api/events";
import {
  CHALLENGE_CATEGORIES,
  CHALLENGE_DIFFICULTIES,
  type Challenge,
  type ChallengeCategory,
  type ChallengeDifficulty,
} from "@/api/types";
import { AppShell } from "@/components/app-shell";
import { EventNav } from "@/components/event-nav";
import { RequireAuth } from "@/components/require-auth";
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from "@/components/ui-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useEventAccess } from "@/hooks/use-event-access";
import { apiErrorMessage } from "@/lib/api-client";
import { fromDateTimeLocal, toDateTimeLocal } from "@/lib/format";

export const Route = createFileRoute("/events/$eventId/manage")({
  head: () => ({
    meta: [
      { title: "Manage event — CaptureBase" },
      { name: "description", content: "Edit event settings, challenges, members and admins." },
      { property: "og:title", content: "Manage event — CaptureBase" },
      { property: "og:description", content: "Edit event settings, challenges, members and admins." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ManageEventPage />
    </RequireAuth>
  ),
});

function ManageEventPage() {
  const { eventId } = Route.useParams();
  const access = useEventAccess(eventId);

  const event = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsApi.byId(eventId),
  });

  if (access.isLoading || event.isLoading) {
    return (
      <AppShell>
        <LoadingBlock label="Loading event…" />
      </AppShell>
    );
  }

  if (!access.isAdmin) {
    return (
      <AppShell>
        <EmptyState
          title="Organisers only"
          description="You need to be the owner or an admin of this event to manage it."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Manage"
        title={event.data?.title ?? "Event"}
        description="Settings, challenges, members and admin permissions."
      />
      <EventNav eventId={eventId} isAdmin />

      <Tabs defaultValue="challenges" className="mt-6">
        <TabsList>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="mt-6">
          <ChallengesManager eventId={eventId} />
        </TabsContent>
        <TabsContent value="members" className="mt-6">
          <MembersManager eventId={eventId} isOwner={access.isOwner} />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <EventSettings eventId={eventId} isOwner={access.isOwner} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

/* ---------------------------------- Challenges --------------------------------- */

const EMPTY_FORM: ChallengeFormValues = {
  title: "",
  description: "",
  flag: "",
  category: "WEB",
  difficulty: "EASY",
  points: 100,
  file: null,
};

function ChallengesManager({ eventId }: { eventId: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Challenge | null>(null);
  const [open, setOpen] = useState(false);

  const challenges = useQuery({
    queryKey: ["event", eventId, "challenges", "admin"],
    queryFn: () => challengesApi.list(eventId),
  });

  const remove = useMutation({
    mutationFn: (challengeId: string) => challengesApi.remove(eventId, challengeId),
    onSuccess: () => {
      toast.success("Challenge deleted.");
      void queryClient.invalidateQueries({ queryKey: ["event", eventId, "challenges"] });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden />
          New challenge
        </Button>
      </div>

      {challenges.isLoading ? (
        <LoadingBlock />
      ) : challenges.isError ? (
        <ErrorState
          message={apiErrorMessage(challenges.error)}
          onRetry={() => challenges.refetch()}
        />
      ) : (challenges.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No challenges yet"
          description="Add your first task so participants have something to solve."
        />
      ) : (
        <div className="surface-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {challenges.data?.map((challenge) => (
                <TableRow key={challenge.id}>
                  <TableCell className="font-medium">{challenge.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{challenge.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {challenge.difficulty}
                  </TableCell>
                  <TableCell className="text-right font-mono">{challenge.points}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(challenge);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove.mutate(challenge.id)}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ChallengeFormDialog
        eventId={eventId}
        challenge={editing}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}

function ChallengeFormDialog({
  eventId,
  challenge,
  open,
  onOpenChange,
}: {
  eventId: string;
  challenge: Challenge | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<ChallengeFormValues>(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    setValues(
      challenge
        ? {
            title: challenge.title,
            description: challenge.description,
            flag: "",
            category: challenge.category,
            difficulty: challenge.difficulty,
            points: challenge.points,
            file: null,
          }
        : EMPTY_FORM,
    );
  }, [challenge, open]);

  const save = useMutation({
    mutationFn: () =>
      challenge
        ? challengesApi.update(eventId, challenge.id, values)
        : challengesApi.create(eventId, values),
    onSuccess: () => {
      toast.success(challenge ? "Challenge updated." : "Challenge created.");
      void queryClient.invalidateQueries({ queryKey: ["event", eventId, "challenges"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{challenge ? "Edit challenge" : "New challenge"}</DialogTitle>
          <DialogDescription>
            {challenge
              ? "Leave the flag blank to keep the current one, and only pick a file to replace the attachment."
              : "Participants see the title, description, category, difficulty and points."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="c-title">Title</Label>
            <Input
              id="c-title"
              required
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-description">Description</Label>
            <Textarea
              id="c-description"
              rows={4}
              required
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={values.category}
                onValueChange={(value) =>
                  setValues((v) => ({ ...v, category: value as ChallengeCategory }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHALLENGE_CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={values.difficulty}
                onValueChange={(value) =>
                  setValues((v) => ({ ...v, difficulty: value as ChallengeDifficulty }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHALLENGE_DIFFICULTIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-points">Points</Label>
              <Input
                id="c-points"
                type="number"
                min={0}
                required
                value={values.points}
                onChange={(e) => setValues((v) => ({ ...v, points: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-flag">Flag</Label>
              <Input
                id="c-flag"
                className="font-mono"
                required={!challenge}
                placeholder={challenge ? "Unchanged" : "flag{...}"}
                value={values.flag}
                onChange={(e) => setValues((v) => ({ ...v, flag: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-file">Attachment</Label>
            <Input
              id="c-file"
              type="file"
              onChange={(e) => setValues((v) => ({ ...v, file: e.target.files?.[0] ?? null }))}
            />
            {challenge?.hasFile ? (
              <p className="text-xs text-muted-foreground">
                Current file: {challenge.fileName ?? "attachment"}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {challenge ? "Save changes" : "Create challenge"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------------- Members ----------------------------------- */

function MembersManager({ eventId, isOwner }: { eventId: string; isOwner: boolean }) {
  const queryClient = useQueryClient();
  const members = useQuery({
    queryKey: ["event", eventId, "members"],
    queryFn: () => eventsApi.members(eventId),
  });

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["event", eventId, "members"] });

  const promote = useMutation({
    mutationFn: (userId: string) => eventsApi.addAdmin(eventId, userId),
    onSuccess: () => {
      toast.success("Member promoted to admin.");
      invalidate();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const demote = useMutation({
    mutationFn: (userId: string) => eventsApi.removeAdmin(eventId, userId),
    onSuccess: () => {
      toast.success("Admin rights removed.");
      invalidate();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  if (members.isLoading) return <LoadingBlock />;
  if (members.isError)
    return <ErrorState message={apiErrorMessage(members.error)} onRetry={() => members.refetch()} />;
  if ((members.data?.length ?? 0) === 0)
    return <EmptyState title="No members yet" description="Share your event to get people in." />;

  return (
    <div className="surface-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            {isOwner ? <TableHead className="text-right">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.data?.map((member) => (
            <TableRow key={member.user.id}>
              <TableCell className="font-medium">{member.user.username}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{member.user.email}</TableCell>
              <TableCell>
                <Badge variant={member.role === "MEMBER" ? "outline" : "default"}>
                  {member.role}
                </Badge>
              </TableCell>
              {isOwner ? (
                <TableCell className="text-right">
                  {member.role === "OWNER" ? null : member.role === "ADMIN" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => demote.mutate(member.user.id)}
                      disabled={demote.isPending}
                    >
                      <ShieldMinus className="size-3.5" aria-hidden />
                      Remove admin
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => promote.mutate(member.user.id)}
                      disabled={promote.isPending}
                    >
                      <ShieldPlus className="size-3.5" aria-hidden />
                      Make admin
                    </Button>
                  )}
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ----------------------------------- Settings ---------------------------------- */

function EventSettings({ eventId, isOwner }: { eventId: string; isOwner: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const event = useQuery({ queryKey: ["event", eventId], queryFn: () => eventsApi.byId(eventId) });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    const data = event.data;
    if (!data) return;
    setTitle(data.title);
    setDescription(data.description ?? "");
    setStartDate(toDateTimeLocal(data.startDate));
    setEndDate(toDateTimeLocal(data.endDate));
    setIsPublic(data.isPublic);
  }, [event.data]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    void queryClient.invalidateQueries({ queryKey: ["events"] });
  };

  const update = useMutation({
    mutationFn: () =>
      eventsApi.update(eventId, {
        title,
        description,
        startDate: fromDateTimeLocal(startDate),
        endDate: fromDateTimeLocal(endDate),
        isPublic,
      }),
    onSuccess: () => {
      toast.success("Event updated.");
      invalidate();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const regenerate = useMutation({
    mutationFn: () => eventsApi.regenerateInviteCode(eventId),
    onSuccess: () => {
      toast.success("New invite code generated.");
      invalidate();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: () => eventsApi.remove(eventId),
    onSuccess: () => {
      toast.success("Event deleted.");
      invalidate();
      navigate({ to: "/my-events" });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  if (event.isLoading) return <LoadingBlock />;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <form
        className="surface-card space-y-4 p-6 lg:col-span-2"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate();
        }}
      >
        <h2 className="font-display text-lg font-semibold">Event settings</h2>
        <div className="space-y-2">
          <Label htmlFor="e-title">Title</Label>
          <Input id="e-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="e-description">Description</Label>
          <Textarea
            id="e-description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="e-start">Starts</Label>
            <Input
              id="e-start"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-end">Ends</Label>
            <Input
              id="e-end"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <p className="text-sm font-medium">Public event</p>
            <p className="text-xs text-muted-foreground">
              Private events require an invite code to join.
            </p>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} aria-label="Public event" />
        </div>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Save settings
        </Button>
      </form>

      <aside className="space-y-5">
        <section className="surface-card space-y-3 p-6">
          <h2 className="font-display text-lg font-semibold">Invite code</h2>
          <p className="text-sm text-muted-foreground">
            Share this code so people can join a private event.
          </p>
          <div className="flex items-center gap-2">
            <Input readOnly value={event.data?.inviteCode ?? "—"} className="font-mono" />
            <Button
              variant="outline"
              size="icon"
              aria-label="Copy invite code"
              onClick={() => {
                if (!event.data?.inviteCode) return;
                void navigator.clipboard.writeText(event.data.inviteCode);
                toast.success("Invite code copied.");
              }}
            >
              <Copy className="size-4" aria-hidden />
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending}
          >
            {regenerate.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="size-4" aria-hidden />
            )}
            Regenerate code
          </Button>
        </section>

        {isOwner ? (
          <section className="surface-card space-y-3 border-destructive/40 p-6">
            <h2 className="font-display text-lg font-semibold text-destructive">Danger zone</h2>
            <p className="text-sm text-muted-foreground">
              Deleting an event removes its challenges, teams and submissions.
            </p>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
            >
              {remove.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="size-4" aria-hidden />
              )}
              Delete event
            </Button>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
