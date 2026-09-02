import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { eventsApi } from "@/api/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/api-client";

/**
 * Join a private event with only an invite code (POST /event-member/join-by-code).
 * Reachable without knowing the event id, so private events stay joinable even
 * though they never appear in browse and 404 for non-members.
 */
export function JoinByCodeForm() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const join = useMutation({
    mutationFn: (inviteCode: string) => eventsApi.joinByCode(inviteCode),
    onSuccess: (event) => {
      toast.success("You joined the event.");
      setCode("");
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      if (event?.id) {
        navigate({ to: "/events/$eventId", params: { eventId: event.id } });
      } else {
        navigate({ to: "/my-events" });
      }
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        join.mutate(code.trim());
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
        {join.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <KeyRound className="size-4" aria-hidden />
        )}
        Join with code
      </Button>
    </form>
  );
}
