import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { eventsApi } from "@/api/events";
import { teamsApi } from "@/api/teams";
import type { EventRole } from "@/api/types";
import { useSession } from "./use-session";

export function useJoinedEvents(enabled = true) {
  return useQuery({
    queryKey: ["events", "joined"],
    queryFn: eventsApi.joined,
    enabled,
  });
}

export function useOwnedEvents(enabled = true) {
  return useQuery({
    queryKey: ["events", "owned"],
    queryFn: eventsApi.owned,
    enabled,
  });
}

/**
 * Resolves the current user's role in an event.
 * The role (OWNER / ADMIN / MEMBER) is derived exclusively from the
 * event-member list returned by GET /event-member/{eventId}/members.
 */
export function useEventAccess(eventId: string) {
  const { user, isAuthenticated } = useSession();

  const joined = useJoinedEvents(isAuthenticated);

  const isMember = Boolean(joined.data?.some((e) => e.id === eventId));

  const members = useQuery({
    queryKey: ["event", eventId, "members"],
    queryFn: () => eventsApi.members(eventId),
    enabled: isAuthenticated && isMember,
  });

  const myMembership = members.data?.find((m) => m.user.id === user?.id);
  const role: EventRole | null =
    (myMembership?.role as EventRole | undefined) ?? (isMember ? "MEMBER" : null);

  return {
    role,
    isOwner: role === "OWNER",
    isAdmin: role === "OWNER" || role === "ADMIN",
    isMember,
    members: members.data,
    isLoading: joined.isLoading,
  };
}

export function useMyTeam(eventId: string, enabled = true) {
  return useQuery({
    queryKey: ["event", eventId, "team", "me"],
    queryFn: async () => {
      try {
        return await teamsApi.me(eventId);
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 400 &&
          (error.response.data as { message?: string })?.message &&
          /did not start yet|already ended/i.test(
            (error.response.data as { message?: string })?.message ?? "",
          )
        ) {
          return null;
        }
        throw error;
      }
    },
    enabled,
    retry: false,
  });
}
