import { useQuery } from "@tanstack/react-query";
import { eventsApi } from "@/api/events";
import { teamsApi } from "@/api/teams";
import type { EventMember, EventRole } from "@/api/types";
import { apiStatus } from "@/lib/api-client";
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
 *
 * `GET /event-member/:eventId/members` is admin/owner-only:
 *   200 -> the caller is OWNER or ADMIN (their exact role comes from the list)
 *   403 -> the caller is a normal MEMBER (expected, not an error)
 *
 * Membership itself still comes from /events/joined, which the join flows need
 * anyway — it is not used for role detection.
 */
export function useEventAccess(eventId: string) {
  const { user, isAuthenticated } = useSession();

  const joined = useJoinedEvents(isAuthenticated);

  const members = useQuery<EventMember[] | null>({
    queryKey: ["event", eventId, "members"],
    queryFn: async () => {
      try {
        return await eventsApi.members(eventId);
      } catch (error) {
        // 403 is the expected "you are a normal member" response.
        if (apiStatus(error) === 403) return null;
        throw error;
      }
    },
    enabled: isAuthenticated,
    retry: false,
    // The role rarely changes, so cache it instead of re-asking on every page
    // mount. A promotion is picked up on the next window focus after 5 minutes,
    // or immediately when a flow invalidates ["event", eventId, "members"].
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: true,
  });

  const isPrivileged = Array.isArray(members.data);
  const myMembership = members.data?.find((m) => m.user.id === user?.id);
  const isOwner = myMembership?.role === "OWNER";

  const isMember =
    isPrivileged || Boolean(joined.data?.some((e) => e.id === eventId));

  const role: EventRole | null = isPrivileged
    ? ((myMembership?.role as EventRole | undefined) ?? "ADMIN")
    : isMember
      ? "MEMBER"
      : null;

  return {
    role,
    isOwner,
    isAdmin: isPrivileged,
    isMember,
    members: members.data ?? undefined,
    isLoading: members.isLoading || joined.isLoading,
  };
}

export function useMyTeam(eventId: string, enabled = true) {
  return useQuery({
    queryKey: ["event", eventId, "team", "me"],
    queryFn: () => teamsApi.me(eventId),
    enabled,
    retry: false,
  });
}
