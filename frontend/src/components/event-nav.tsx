import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function EventNav({ eventId, isAdmin }: { eventId: string; isAdmin?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const base = `/events/${eventId}`;

  const items = [
    { to: "/events/$eventId", label: "Overview", href: base },
    { to: "/events/$eventId/challenges", label: "Challenges", href: `${base}/challenges` },
    { to: "/events/$eventId/teams", label: "Teams", href: `${base}/teams` },
    { to: "/events/$eventId/leaderboard", label: "Leaderboard", href: `${base}/leaderboard` },
    ...(isAdmin
      ? [{ to: "/events/$eventId/manage", label: "Manage", href: `${base}/manage` }]
      : []),
  ] as const;

  return (
    <nav className="mt-6 flex flex-wrap gap-1 border-b border-border pb-2">
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.to}
          params={{ eventId }}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            pathname === item.href && "bg-accent text-accent-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
