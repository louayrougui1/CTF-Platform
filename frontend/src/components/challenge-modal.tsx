import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Download, Flag, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { challengesApi } from "@/api/challenges";
import type { Challenge } from "@/api/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api-client";
import { downloadFile } from "@/lib/download";
import { DIFFICULTY_TONE } from "@/lib/format";
import { cn } from "@/lib/utils";

type Feedback = { kind: "correct" | "wrong" | "error"; message: string } | null;

export function ChallengeModal({
  challenge,
  eventId,
  onOpenChange,
}: {
  challenge: Challenge | null;
  eventId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [flag, setFlag] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [downloading, setDownloading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setFlag("");
    setFeedback(null);
  }, [challenge?.id]);

  const submit = useMutation({
    mutationFn: (value: string) => challengesApi.submit(eventId, challenge!.id, value),
    onSuccess: (result) => {
      if (result.status === "CORRECT") {
        setFeedback({ kind: "correct", message: "Solved! Points awarded to your team." });
        setFlag("");
        void queryClient.invalidateQueries({ queryKey: ["event", eventId, "challenges"] });
        void queryClient.invalidateQueries({ queryKey: ["event", eventId, "leaderboard"] });
      } else {
        setFeedback({ kind: "wrong", message: "Wrong flag. Give it another try." });
      }
    },
    onError: (error) => {
      setFeedback({ kind: "error", message: apiErrorMessage(error) });
    },
  });

  return (
    <Dialog open={Boolean(challenge)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        {challenge ? (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {challenge.category}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    DIFFICULTY_TONE[challenge.difficulty] ?? "bg-muted",
                  )}
                >
                  {challenge.difficulty}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                  {challenge.points} pts
                </span>
                {challenge.solved ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    <CheckCircle2 className="size-3.5" aria-hidden /> Solved
                  </span>
                ) : null}
              </div>
              <DialogTitle className="text-left text-xl">{challenge.title}</DialogTitle>
              <DialogDescription className="sr-only">Challenge details</DialogDescription>
            </DialogHeader>

            <p className="whitespace-pre-wrap text-sm leading-relaxed text-secondary-foreground">
              {challenge.description}
            </p>

            {challenge.hasFile && challenge.fileUrl ? (
              <button
                type="button"
                onClick={() => {
                  const url = challenge.fileUrl;
                  if (!url) return;
                  setDownloading(true);
                  downloadFile(url, challenge.fileName)
                    .catch(() => toast.error("Could not download the attachment."))
                    .finally(() => setDownloading(false));
                }}
                disabled={downloading}
                className="inline-flex w-fit items-center gap-2 rounded-md border border-border bg-muted/60 px-3 py-2 text-sm font-medium text-info transition-colors hover:bg-muted disabled:opacity-60"
              >
                {downloading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Download className="size-4" aria-hidden />
                )}
                {challenge.fileName ?? "Download attachment"}
              </button>
            ) : null}

            <form
              className="space-y-3 border-t border-border pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!flag.trim()) return;
                submit.mutate(flag.trim());
              }}
            >
              <label htmlFor="flag" className="text-sm font-medium">
                Submit flag
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="flag"
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  placeholder="flag{...}"
                  className="font-mono"
                  autoComplete="off"
                />
                <Button type="submit" disabled={submit.isPending || !flag.trim()}>
                  {submit.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Flag className="size-4" aria-hidden />
                  )}
                  Submit
                </Button>
              </div>

              {feedback ? (
                <p
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    feedback.kind === "correct" && "bg-primary-soft text-primary-soft-foreground",
                    feedback.kind !== "correct" && "bg-destructive/10 text-destructive",
                  )}
                  role="status"
                >
                  {feedback.kind === "correct" ? (
                    <CheckCircle2 className="size-4" aria-hidden />
                  ) : (
                    <XCircle className="size-4" aria-hidden />
                  )}
                  {feedback.message}
                </p>
              ) : null}
            </form>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
