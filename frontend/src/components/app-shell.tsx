import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Moon, Sun, LogOut, User as UserIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { useLogout, useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/events", label: "Browse events" },
  { to: "/my-events", label: "My events" },
] as const;

export function ThemeToggle() {
  const { theme, toggle, ready } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {ready && theme === "dark" ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </Button>
  );
}

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="FlagLab home">
      <img src="/favicon.svg" alt="FlagLab logo" className="size-16 object-contain md:size-20" />

      <span className="font-display text-xl font-semibold tracking-tight md:text-2xl">
        Flag<span className="text-primary">Lab</span>
        <span className="ml-1.5 inline-block translate-y-[-6px] rounded-md border border-primary/30 bg-primary/10 px-1.5 py-px align-middle text-[10px] font-semibold uppercase tracking-wide text-primary">
          Beta
        </span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useSession();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:h-16">
          <div className="flex items-center gap-8">
            <Brand />
            {isAuthenticated ? (
              <nav className="hidden items-center gap-1 md:flex">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      pathname.startsWith(item.to) && "bg-accent text-accent-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden md:inline-flex">
                      <UserIcon className="size-4" aria-hidden />
                      {user?.username ?? "Account"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void logout()}>
                      <LogOut className="size-4" aria-hidden />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Toggle navigation"
                  onClick={() => setOpen((v) => !v)}
                >
                  <Menu className="size-4" aria-hidden />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {open && isAuthenticated ? (
          <nav className="border-t border-border bg-card px-4 py-2 md:hidden">
            {[...NAV, { to: "/profile", label: "Profile" } as const].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => void logout()}
              className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-muted"
            >
              Log out
            </button>
          </nav>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            FlagLab — competitive Capture the flag platform. Made by{" "}
            <a
              href="https://louayrougui-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Louay Rougui
            </a>
          </span>
          <span className="font-mono">
            flag{"{"}play_fair{"}"}
          </span>
        </div>
      </footer>
    </div>
  );
}
