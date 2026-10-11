import { createFileRoute } from "@tanstack/react-router";
import { GoogleLinkConfirmation } from "@/components/google-link-confirmation";

export const Route = createFileRoute("/google/link-confirmation")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search["email"] === "string" ? (search["email"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Link your Google account — FlagLab" },
      {
        name: "description",
        content: "Confirm linking your Google account to your existing FlagLab account.",
      },
      { property: "og:title", content: "Link your Google account — FlagLab" },
      {
        property: "og:description",
        content: "Confirm linking Google to your existing FlagLab account.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { email } = Route.useSearch();
  return <GoogleLinkConfirmation email={email || undefined} />;
}
