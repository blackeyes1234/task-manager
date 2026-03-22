import { Fragment, memo } from "react";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
}

/**
 * Highlights case-insensitive matches of `query` inside `text` using <mark>.
 */
function HighlightedText({
  text,
  query,
  className,
}: HighlightedTextProps) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const re = new RegExp(`(${escapeRegExp(q)})`, "gi");
  const parts = text.split(re);

  return (
    <>
      {parts.map((part, i) => {
        if (part.toLowerCase() === q.toLowerCase()) {
          return (
            <mark
              key={i}
              className={
                className ??
                "rounded bg-amber-200/90 px-0.5 text-inherit dark:bg-amber-500/40"
              }
            >
              {part}
            </mark>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

export default memo(HighlightedText);
