import { useQuery } from "@tanstack/react-query";
import { Medal, Trophy } from "lucide-react";
import { eventsApi } from "@/api/events";
import { teamsApi } from "@/api/teams";
import { cn } from "@/lib/utils";

/**
 * Final result for an ended event: the user's team position in the leaderboard.
 */
export function EventResult({ eventId }: { eventId: string }) {
  const myTeam = useQuery({
    queryKey: ["event", eventId, "team", "me"],
    queryFn: () => teamsApi.me(eventId),
    retry: false,
  });

  const board = useQuery({
    queryKey: ["event", eventId, "leaderboard"],
    queryFn: () => eventsApi.leaderboard(eventId),
    retry: false,
  });

  if (myTeam.isLoading || board.isLoading) {
    return <span className="text-xs text-muted-foreground">Loading result…</span>;
  }

  const rows = board.data ?? [];
  const index = myTeam.data ? rows.findIndex((r) => r.teamId === myTeam.data!.id) : -1;

  if (index === -1) {
    return (
      <span className="text-xs text-muted-foreground">
        {myTeam.data ? "No ranking recorded" : "You had no team in this event"}
      </span>
    );
  }

  const place = index + 1;
  const score = rows[index]!.score;

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm",
        place === 1
          ? "border-warning/60 bg-warning/20 text-warning-foreground dark:text-warning"
          : place === 2
            ? "border-border bg-muted text-foreground"
            : place === 3
              ? "border-info/40 bg-info/10 text-info"
              : "border-border bg-muted/50 text-muted-foreground",
      )}
    >
      {place === 1 ? (
        <Trophy className="size-4" aria-hidden />
      ) : (
        <Medal className="size-4" aria-hidden />
      )}
      <span className="font-semibold">
        {place === 1 ? "1st place 🏆" : place === 2 ? "2nd place" : place === 3 ? "3rd place" : `#${place}`}
      </span>
      <span className="text-xs opacity-80">
        {myTeam.data?.name} · {score} pts
      </span>
    </div>
  );
}
