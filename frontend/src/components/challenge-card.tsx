import { CheckCircle2, Paperclip } from "lucide-react";
import type { Challenge } from "@/api/types";
import { DIFFICULTY_TONE } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ChallengeCard({
  challenge,
  onOpen,
}: {
  challenge: Challenge;
  onOpen: (challenge: Challenge) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(challenge)}
      className={cn(
        "surface-card group flex h-full flex-col gap-3 p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]",
        challenge.solved && "border-primary/60 bg-primary-soft text-primary-soft-foreground",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "font-mono text-xs uppercase tracking-widest",
            challenge.solved ? "text-primary" : "text-muted-foreground",
          )}
        >
          {challenge.category}
        </span>
        {challenge.solved ? (
          <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
            <CheckCircle2 className="size-3.5" aria-hidden />
            Solved
          </span>
        ) : null}
      </div>

      <h3 className="font-display text-lg font-semibold leading-tight group-hover:text-primary">
        {challenge.title}
      </h3>

      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            DIFFICULTY_TONE[challenge.difficulty] ?? "bg-muted text-muted-foreground",
          )}
        >
          {challenge.difficulty}
        </span>
        <span className="flex items-center gap-2 text-sm font-semibold">
          {challenge.hasFile ? (
            <Paperclip className="size-3.5 text-muted-foreground" aria-hidden />
          ) : null}
          {challenge.points} pts
        </span>
      </div>
    </button>
  );
}
