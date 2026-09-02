import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogIn } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { eventsApi } from "@/api/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/api-client";

export function useJoinEvent(eventId: string, onDone?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode?: string) => eventsApi.join(eventId, inviteCode),
    onSuccess: () => {
      toast.success("You joined the event.");
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      void queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      onDone?.();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });
}

export function JoinEventButton({
  eventId,
  size = "sm",
  label = "Join",
}: {
  eventId: string;
  size?: "sm" | "default";
  label?: string;
}) {
  const join = useJoinEvent(eventId);
  return (
    <Button size={size} onClick={() => join.mutate(undefined)} disabled={join.isPending}>
      {join.isPending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <LogIn className="size-3.5" aria-hidden />
      )}
      {label}
    </Button>
  );
}

export function JoinWithCode({ eventId }: { eventId: string }) {
  const [code, setCode] = useState("");
  const join = useJoinEvent(eventId, () => setCode(""));

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        join.mutate(code.trim() || undefined);
      }}
    >
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Invite code"
        className="font-mono sm:w-56"
        aria-label="Invite code"
      />
      <Button type="submit" disabled={join.isPending || !code.trim()}>
        {join.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Join with code
      </Button>
    </form>
  );
}
