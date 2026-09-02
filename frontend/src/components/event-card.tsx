import { Link } from "@tanstack/react-router";
import { CalendarDays, Globe, Lock, Settings2 } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EventItem } from "@/api/types";
import { formatDateRange, eventStatus } from "@/lib/format";

export function EventStatusBadge({ event }: { event: EventItem }) {
  const status = eventStatus(event);
  const tone =
    status === "Live"
      ? "bg-primary text-primary-foreground"
      : status === "Upcoming"
        ? "bg-accent text-accent-foreground"
        : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{status}</span>;
}

export function EventCard({
  event,
  action,
  extra,
  manage = false,
}: {
  event: EventItem;
  action?: ReactNode;
  extra?: ReactNode;
  manage?: boolean;
}) {
  return (
    <article className="surface-card group flex h-full flex-col gap-4 p-5 transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Link
            to="/events/$eventId"
            params={{ eventId: event.id }}
            className="font-display text-lg font-semibold leading-tight hover:text-primary"
          >
            {event.title}
          </Link>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden />
            {formatDateRange(event.startDate, event.endDate)}
          </p>
        </div>
        <EventStatusBadge event={event} />
      </div>

      <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">
        {event.description || "No description provided."}
      </p>

      {extra ? <div className="flex">{extra}</div> : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <Badge variant="outline" className="gap-1.5 font-normal">
          {event.isPublic ? (
            <>
              <Globe className="size-3" aria-hidden /> Public
            </>
          ) : (
            <>
              <Lock className="size-3" aria-hidden /> Private
            </>
          )}
        </Badge>
        <div className="flex gap-2">
          {manage ? (
            <Button variant="outline" size="sm" asChild>
              <Link to="/events/$eventId/manage" params={{ eventId: event.id }}>
                <Settings2 className="size-3.5" aria-hidden />
                Manage
              </Link>
            </Button>
          ) : null}
          {action}
          <Button variant="ghost" size="sm" asChild>
            <Link to="/events/$eventId" params={{ eventId: event.id }}>
              Details
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
