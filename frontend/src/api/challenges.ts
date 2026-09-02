import { api, asList } from "@/lib/api-client";
import type {
  Challenge,
  ChallengeCategory,
  ChallengeDifficulty,
  ChallengeStats,
  SubmissionResult,
} from "./types";

export type ChallengeFormValues = {
  title: string;
  description: string;
  flag: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  points: number;
  file?: File | null;
};

function toFormData(values: Partial<ChallengeFormValues>): FormData {
  const fd = new FormData();
  if (values.title !== undefined) fd.append("title", values.title);
  if (values.description !== undefined) fd.append("description", values.description);
  if (values.flag !== undefined && values.flag !== "") fd.append("flag", values.flag);
  if (values.category !== undefined) fd.append("category", values.category);
  if (values.difficulty !== undefined) fd.append("difficulty", values.difficulty);
  if (values.points !== undefined) fd.append("points", String(values.points));
  // Only send a file when the user picked a new one: editing must not force re-upload.
  if (values.file) fd.append("file", values.file);
  return fd;
}

export const challengesApi = {
  list: (eventId: string, teamId?: string) =>
    api
      .get<Challenge[]>(`/events/${eventId}/challenges`, {
        params: teamId ? { teamId } : undefined,
      })
      .then((r) => asList(r.data)),

  /** Owner/admin only. */
  byId: (eventId: string, challengeId: string) =>
    api.get<Challenge>(`/events/${eventId}/challenges/${challengeId}`).then((r) => r.data),

  create: (eventId: string, values: ChallengeFormValues) =>
    api.post<Challenge>(`/events/${eventId}/challenges`, toFormData(values)).then((r) => r.data),

  update: (eventId: string, challengeId: string, values: Partial<ChallengeFormValues>) =>
    api
      .patch<Challenge>(`/events/${eventId}/challenges/${challengeId}`, toFormData(values))
      .then((r) => r.data),

  remove: (eventId: string, challengeId: string) =>
    api.delete(`/events/${eventId}/challenges/${challengeId}`).then((r) => r.data),

  stats: (eventId: string, challengeId: string) =>
    api
      .get<ChallengeStats>(`/events/${eventId}/challenges/${challengeId}/stats`)
      .then((r) => r.data),

  submit: (eventId: string, challengeId: string, flag: string) =>
    api
      .post<SubmissionResult>(`/events/${eventId}/challenges/${challengeId}/submit`, { flag })
      .then((r) => r.data),
};
