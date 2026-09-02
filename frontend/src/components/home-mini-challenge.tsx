import { useState, type FormEvent } from "react";
import { CheckCircle2, Flag, HelpCircle, Terminal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FLAG = "flag{welcome_to_capturebase}";
// base64 of the flag — the clue players must decode
const ENCODED = "ZmxhZ3t3ZWxjb21lX3RvX2NhcHR1cmViYXNlfQ==";

/**
 * Homepage mini-challenge: decode the base64 blob and submit the flag.
 * Fully local — no backend, no account required.
 */
export function HomeMiniChallenge() {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "wrong" | "solved">("idle");
  const [attempts, setAttempts] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const guess = value.trim();
    if (!guess) return;
    if (guess === FLAG) {
      setState("solved");
    } else {
      setState("wrong");
      setAttempts((n) => n + 1);
    }
  }

  return (
    <section
      aria-labelledby="mini-challenge-title"
      className="mt-16 overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-5 py-2.5">
        <span className="size-2.5 rounded-full bg-destructive/70" aria-hidden />
        <span className="size-2.5 rounded-full bg-warning/70" aria-hidden />
        <span className="size-2.5 rounded-full bg-primary/70" aria-hidden />
        <span className="ml-2 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <Terminal className="size-3.5" aria-hidden />
          capturebase — mini-challenge
        </span>
      </div>

      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
              Warmup · crypto · 10 pts
            </p>
            <h2 id="mini-challenge-title" className="font-display text-xl font-semibold sm:text-2xl">
              Can you find the flag?
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              A tiny taste of the real thing. We intercepted a transmission — decode it and submit
              the flag below. No account needed, everything happens on this page.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4 font-mono text-sm">
            <p className="text-muted-foreground">$ cat intercepted.txt</p>
            <p className="mt-1 select-all break-all text-foreground">{ENCODED}</p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setHintOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              aria-expanded={hintOpen}
            >
              <HelpCircle className="size-3.5" aria-hidden />
              Need a hint?
              <ChevronDown
                className={cn("size-3.5 transition-transform", hintOpen && "rotate-180")}
                aria-hidden
              />
            </button>
            {hintOpen ? (
              <p className="mt-2 max-w-md rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                The blob isn't encrypted — just encoded. It looks like base64. Any decoder (or your
                browser console) will do.
              </p>
            ) : null}
          </div>
        </div>

        <div className="w-full lg:w-80">
          {state === "solved" ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/40 bg-primary-soft px-6 py-8 text-center">
              <CheckCircle2 className="size-8 text-primary" aria-hidden />
              <p className="font-display text-lg font-semibold">Flag captured!</p>
              <p className="break-all rounded-md bg-background px-3 py-1.5 font-mono text-xs text-primary">
                {FLAG}
              </p>
              <p className="text-xs text-muted-foreground">
                Solved in {attempts + 1} {attempts === 0 ? "try" : "tries"}. Ready for the real
                challenges?
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="relative">
                <Flag
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setState("idle");
                  }}
                  placeholder="flag{...}"
                  aria-label="Submit flag"
                  className={cn(
                    "pl-9 font-mono",
                    state === "wrong" && "border-destructive focus-visible:ring-destructive",
                  )}
                />
              </div>
              <Button type="submit" className="w-full">
                Submit flag
              </Button>
              {state === "wrong" ? (
                <p className="text-center text-xs text-destructive" role="status">
                  Wrong flag — try again.
                </p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
