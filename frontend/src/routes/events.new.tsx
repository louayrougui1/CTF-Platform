import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { eventsApi } from "@/api/events";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { PageHeader } from "@/components/ui-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/lib/api-client";
import { fromDateTimeLocal } from "@/lib/format";

export const Route = createFileRoute("/events/new")({
  head: () => ({
    meta: [
      { title: "Create an event — CaptureBase" },
      { name: "description", content: "Set up a new Capture The Flag competition in minutes." },
      { property: "og:title", content: "Create an event — CaptureBase" },
      { property: "og:description", content: "Set up a new Capture The Flag competition." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <CreateEventPage />
    </RequireAuth>
  ),
});

function CreateEventPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const create = useMutation({
    mutationFn: () =>
      eventsApi.create({
        title,
        description,
        startDate: fromDateTimeLocal(startDate),
        endDate: fromDateTimeLocal(endDate),
        isPublic,
      }),
    onSuccess: (event) => {
      toast.success("Event created.");
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate({ to: "/events/$eventId/manage", params: { eventId: event.id } });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="New event"
        title="Create an event"
        description="You'll be the owner: add challenges, promote admins and watch the scoreboard."
      />

      <form
        className="surface-card mt-6 max-w-2xl space-y-5 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={5}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate">Starts</Label>
            <Input
              id="startDate"
              type="datetime-local"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Ends</Label>
            <Input
              id="endDate"
              type="datetime-local"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <p className="text-sm font-medium">Public event</p>
            <p className="text-xs text-muted-foreground">
              Public events appear in browse and anyone can join. Private events need an invite
              code.
            </p>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} aria-label="Public event" />
        </div>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Create event
        </Button>
      </form>
    </AppShell>
  );
}
