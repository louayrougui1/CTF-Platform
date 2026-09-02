import { api, asList } from "@/lib/api-client";
import type { MyTeam, TeamById, TeamListItem } from "./types";

export const teamsApi = {
  list: (eventId: string) =>
    api.get<TeamListItem[]>(`/events/${eventId}/teams`).then((r) => asList(r.data)),

  me: (eventId: string) =>
    api.get<MyTeam>(`/events/${eventId}/teams/me`).then((r) => r.data),

  byId: (eventId: string, teamId: string) =>
    api.get<TeamById>(`/events/${eventId}/teams/${teamId}`).then((r) => r.data),

  create: (eventId: string, data: { name: string; teamPassword: string }) =>
    api.post(`/events/${eventId}/teams`, data).then((r) => r.data),

  update: (eventId: string, teamId: string, data: { name?: string; teamPassword?: string }) =>
    api.patch(`/events/${eventId}/teams/${teamId}`, data).then((r) => r.data),

  remove: (eventId: string, teamId: string) =>
    api.delete(`/events/${eventId}/teams/${teamId}`).then((r) => r.data),

  /** Join a team by its name + password (no teamId needed). */
  join: (eventId: string, teamName: string, password: string) =>
    api.post(`/events/${eventId}/teams/join`, { teamName, password }).then((r) => r.data),

  leave: (eventId: string, teamId: string) =>
    api.delete(`/events/${eventId}/teams/${teamId}/leave`).then((r) => r.data),

  kick: (eventId: string, teamId: string, userId: string) =>
    api.delete(`/events/${eventId}/teams/${teamId}/members/${userId}`).then((r) => r.data),
};
