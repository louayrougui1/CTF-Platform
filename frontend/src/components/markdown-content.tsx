import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Renders a challenge description. Plain-text descriptions render as-is
 * (line breaks preserved); Markdown is rendered as formatted content.
 * Raw HTML is not rendered (react-markdown escapes it by default).
 */
export function MarkdownContent({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn("md-content text-sm leading-relaxed text-secondary-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
