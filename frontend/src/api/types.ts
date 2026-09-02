export type EventRole = "OWNER" | "ADMIN" | "MEMBER";
export type TeamRole = "CAPTAIN" | "MEMBER";

export const CHALLENGE_CATEGORIES = [
  "WEB",
  "CRYPTO",
  "PWN",
  "REVERSE",
  "FORENSICS",
  "OSINT",
  "MISC",
] as const;
export type ChallengeCategory = (typeof CHALLENGE_CATEGORIES)[number];

export const CHALLENGE_DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "EXPERT"] as const;
export type ChallengeDifficulty = (typeof CHALLENGE_DIFFICULTIES)[number];

export type AuthUserResponse = {
  id: string;
  email: string;
  username: string;
  googleId: string | null;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
};

export type AuthResponse = {
  access_token: string;
  user: AuthUserResponse;
};

export type MessageResponse = { message: string };

export type UserProfile = {
  id: string;
  email: string;
  username: string;
  googleId: string | null;
  hasPassword: boolean;
};

export type EventItem = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  inviteCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventStats = {
  memberCount: number;
  teamCount: number;
  challengeCount: number;
  solveCount: number;
};

export type EventMember = {
  role: EventRole;
  createdAt: string;
  user: { id: string; username: string; email: string };
};

export type TeamListItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type TeamMemberDetail = {
  userId: string;
  username: string;
  email: string;
  role: TeamRole;
  joinedAt: string;
};

export type MyTeam = {
  id: string;
  name: string;
  members: TeamMemberDetail[];
};

export type TeamById = {
  id: string;
  name: string;
  createdAt: string;
  members: { userId: string; username: string; role: TeamRole }[];
};

export type LeaderboardRow = {
  teamId: string;
  teamName: string;
  score: number;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  points: number;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  eventId: string;
  solved: boolean;
  hasFile: boolean;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChallengeStats = { solveCount: number };

export type SubmissionResult = {
  status: "CORRECT" | "WRONG" | string;
  createdAt: string;
};
