import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — the backend redirects to /google/link-confirmation. */
export const Route = createFileRoute("/google-link")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search["email"] === "string" ? (search["email"] as string) : "",
  }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/google/link-confirmation", search, replace: true });
  },
});
