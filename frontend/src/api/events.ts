import { api, asList } from "@/lib/api-client";
import type { EventItem, EventMember, EventStats, LeaderboardRow } from "./types";

export const eventsApi = {
  browse: () => api.get<EventItem[]>("/events").then((r) => asList(r.data)),
  owned: () => api.get<EventItem[]>("/events/owned").then((r) => asList(r.data)),
  joined: () => api.get<EventItem[]>("/events/joined").then((r) => asList(r.data)),
  byId: (eventId: string) => api.get<EventItem>(`/events/${eventId}`).then((r) => r.data),
  stats: (eventId: string) =>
    api.get<EventStats>(`/events/stats/${eventId}`).then((r) => r.data),

  create: (data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    isPublic?: boolean;
  }) => api.post<EventItem>("/events", data).then((r) => r.data),

  update: (
    eventId: string,
    data: Partial<{
      title: string;
      description: string;
      startDate: string;
      endDate: string;
      isPublic: boolean;
    }>,
  ) => api.patch<EventItem>(`/events/${eventId}`, data).then((r) => r.data),

  remove: (eventId: string) => api.delete(`/events/${eventId}`).then((r) => r.data),

  regenerateInviteCode: (eventId: string) =>
    api.post<EventItem>(`/events/${eventId}/invite-code`).then((r) => r.data),

  leaderboard: (eventId: string) =>
    api.get<LeaderboardRow[]>(`/events/${eventId}/leaderboard`).then((r) => asList(r.data)),

  members: (eventId: string) =>
    api.get<EventMember[]>(`/event-member/${eventId}/members`).then((r) => asList(r.data)),

  join: (eventId: string, inviteCode?: string) =>
    api
      .post(`/event-member/${eventId}/join`, inviteCode ? { inviteCode } : {})
      .then((r) => r.data),

  joinByCode: (inviteCode: string) =>
    api.post<EventItem>("/event-member/join-by-code", { inviteCode }).then((r) => r.data),

  leave: (eventId: string) =>
    api.delete(`/event-member/${eventId}/leave`).then((r) => r.data),

  addAdmin: (eventId: string, userIdToPromote: string) =>
    api.post("/event-member/admins", { eventId, userIdToPromote }).then((r) => r.data),

  removeAdmin: (eventId: string, userIdToRemove: string) =>
    api
      .delete("/event-member/admins", { data: { eventId, userIdToRemove } })
      .then((r) => r.data),
};
