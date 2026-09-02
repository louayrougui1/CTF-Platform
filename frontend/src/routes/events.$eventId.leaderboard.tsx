import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { eventsApi } from "@/api/events";
import { AppShell } from "@/components/app-shell";
import { EventNav } from "@/components/event-nav";
import { RequireAuth } from "@/components/require-auth";
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from "@/components/ui-states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEventAccess, useMyTeam } from "@/hooks/use-event-access";
import { apiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/events/$eventId/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — CaptureBase" },
      { name: "description", content: "Live team standings for this Capture The Flag event." },
      { property: "og:title", content: "Leaderboard — CaptureBase" },
      { property: "og:description", content: "Live team standings for this CTF event." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <LeaderboardPage />
    </RequireAuth>
  ),
});

function LeaderboardPage() {
  const { eventId } = Route.useParams();
  const access = useEventAccess(eventId);
  const myTeam = useMyTeam(eventId, access.isMember && !access.isAdmin);

  const event = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsApi.byId(eventId),
  });

  const board = useQuery({
    queryKey: ["event", eventId, "leaderboard"],
    queryFn: () => eventsApi.leaderboard(eventId),
    enabled: access.isMember,
    refetchInterval: 30_000,
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow={event.data?.title ?? "Event"}
        title="Leaderboard"
        description="Standings refresh automatically as flags are captured."
      />
      <EventNav eventId={eventId} isAdmin={access.isAdmin} />

      <div className="mt-6">
        {!access.isMember ? (
          <EmptyState
            title="Join the event first"
            description="Standings are visible to event members."
          />
        ) : board.isLoading ? (
          <LoadingBlock label="Loading standings…" />
        ) : board.isError ? (
          <ErrorState message={apiErrorMessage(board.error)} onRetry={() => board.refetch()} />
        ) : (board.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No scores yet"
            description="The first solved flag will open the scoreboard."
            icon={<Trophy className="size-5" aria-hidden />}
          />
        ) : (
          <div className="surface-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {board.data?.map((row, index) => (
                  <TableRow
                    key={row.teamId}
                    className={cn(
                      index === 0 && "bg-warning/20",
                      index === 1 && "bg-muted-foreground/15",
                      index === 2 && "bg-info/10",
                      myTeam.data?.id === row.teamId && "bg-primary-soft/70",
                    )}
                  >
                    <TableCell className="font-mono">
                      <span
                        className={cn(
                          "inline-flex size-7 items-center justify-center rounded-full text-xs font-bold",
                          index === 0 && "bg-warning text-warning-foreground",
                          index === 1 && "bg-muted-foreground/40 text-foreground",
                          index === 2 && "bg-info/70 text-primary-foreground",
                          index > 2 && "text-muted-foreground",
                        )}
                      >
                        {index + 1}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {row.teamName}
                      {myTeam.data?.id === row.teamId ? (
                        <span className="ml-2 text-xs text-primary">your team</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {row.score}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
