import {
  Bold,
  Code,
  Heading2,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import { useRef, type ReactNode } from "react";
import { MarkdownContent } from "@/components/markdown-content";
import { cn } from "@/lib/utils";

type Action = { label: string; icon: ReactNode; apply: (sel: string) => [string, string, string] };

// Each action returns [before, inner, after] wrapped around the selection.
const ACTIONS: Action[] = [
  { label: "Bold", icon: <Bold />, apply: (s) => ["**", s || "bold text", "**"] },
  { label: "Italic", icon: <Italic />, apply: (s) => ["_", s || "italic text", "_"] },
  { label: "Heading", icon: <Heading2 />, apply: (s) => ["\n## ", s || "Heading", "\n"] },
  { label: "Bullet list", icon: <List />, apply: (s) => ["\n- ", s || "item", "\n"] },
  { label: "Numbered list", icon: <ListOrdered />, apply: (s) => ["\n1. ", s || "item", "\n"] },
  { label: "Quote", icon: <Quote />, apply: (s) => ["\n> ", s || "quote", "\n"] },
  { label: "Link", icon: <Link2 />, apply: (s) => ["[", s || "link text", "](https://)"] },
  { label: "Image", icon: <Image />, apply: (s) => ["![", s || "alt text", "](https://)"] },
  {
    label: "Code",
    icon: <Code />,
    apply: (s) => (s.includes("\n") ? ["\n```\n", s, "\n```\n"] : ["`", s || "code", "`"]),
  },
];

export function MarkdownEditor({
  id,
  value,
  onChange,
  required,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const run = (action: Action) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const [before, inner, after] = action.apply(value.slice(start, end));
    const next = value.slice(0, start) + before + inner + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const s = start + before.length;
      el.setSelectionRange(s, s + inner.length);
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-card shadow-[var(--shadow-card)] focus-within:ring-2 focus-within:ring-ring/40">
      <div
        role="toolbar"
        aria-label="Markdown formatting"
        className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface px-1.5 py-1"
      >
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            title={a.label}
            aria-label={a.label}
            onClick={() => run(a)}
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground [&_svg]:size-4"
          >
            {a.icon}
          </button>
        ))}
        <span className="ml-auto hidden pr-2 font-mono text-[11px] text-muted-foreground sm:inline">
          &gt;_ markdown
        </span>
      </div>
      <div className="grid md:grid-cols-2">
        <textarea
          ref={ref}
          id={id}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write the challenge description in Markdown…"
          className="min-h-72 w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
        />
        <div className="min-h-72 border-t border-border bg-background/40 p-4 md:border-l md:border-t-0">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Preview
          </p>
          {value.trim() ? (
            <MarkdownContent source={value} />
          ) : (
            <p className={cn("text-sm italic text-muted-foreground")}>Nothing to preview yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
