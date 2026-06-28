"use client";

/**
 * Renders post content respecting content_format field.
 * - "markdown" → lightweight markdown parser (bold, italic, headings, lists, links, code)
 * - "plain"    → whitespace-preserving text
 * No external dependency — avoids react-markdown install requirement.
 */

import React, { useEffect, useRef, useState } from "react";

function parseMarkdown(md: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const blocks = md.split(/\n\n+/);

  blocks.forEach((block, bi) => {
    const trimmed = block.trim();
    if (!trimmed) return;

    // Heading
    const hMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const text = hMatch[2];
      const Tag = `h${level}` as "h1" | "h2" | "h3";
      const cls = level === 1 ? "text-lg font-bold mt-3 mb-1" :
                  level === 2 ? "text-base font-bold mt-3 mb-1" :
                  "text-sm font-semibold mt-2 mb-0.5";
      nodes.push(<Tag key={bi} className={cls}>{inlineMarkdown(text)}</Tag>);
      return;
    }

    // Bullet list
    const listLines = trimmed.split("\n").filter(l => /^[-*+]\s/.test(l.trim()));
    if (listLines.length > 0 && listLines.length === trimmed.split("\n").length) {
      nodes.push(
        <ul key={bi} className="list-disc pl-5 space-y-0.5 my-1">
          {listLines.map((l, li) => (
            <li key={li} className="text-[0.95rem] leading-relaxed">
              {inlineMarkdown(l.replace(/^[-*+]\s+/, ""))}
            </li>
          ))}
        </ul>
      );
      return;
    }

    // Numbered list
    const numLines = trimmed.split("\n").filter(l => /^\d+\.\s/.test(l.trim()));
    if (numLines.length > 0 && numLines.length === trimmed.split("\n").length) {
      nodes.push(
        <ol key={bi} className="list-decimal pl-5 space-y-0.5 my-1">
          {numLines.map((l, li) => (
            <li key={li} className="text-[0.95rem] leading-relaxed">
              {inlineMarkdown(l.replace(/^\d+\.\s+/, ""))}
            </li>
          ))}
        </ol>
      );
      return;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      nodes.push(<hr key={bi} className="my-3 border-line" />);
      return;
    }

    // Paragraph (preserves single newlines as <br>)
    const lines = trimmed.split("\n");
    nodes.push(
      <p key={bi} className="text-[0.95rem] leading-relaxed">
        {lines.map((line, li) => (
          <React.Fragment key={li}>
            {inlineMarkdown(line)}
            {li < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  });

  return nodes;
}

function inlineMarkdown(text: string): React.ReactNode[] {
  // Order matters: links first, then bold+italic, bold, italic, code
  const parts: React.ReactNode[] = [];
  // Regex: link [text](url) | bold+italic ***text*** | bold **text** | italic *text* | code `text`
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      parts.push(<a key={m.index} href={m[2]} target="_blank" rel="noopener noreferrer"
        className="text-brand underline">{m[1]}</a>);
    } else if (m[3] !== undefined) {
      parts.push(<strong key={m.index}><em>{m[3]}</em></strong>);
    } else if (m[4] !== undefined) {
      parts.push(<strong key={m.index}>{m[4]}</strong>);
    } else if (m[5] !== undefined) {
      parts.push(<em key={m.index}>{m[5]}</em>);
    } else if (m[6] !== undefined) {
      parts.push(<code key={m.index} className="rounded bg-elevated px-1 py-0.5 text-xs font-mono">{m[6]}</code>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const COLLAPSED_MAX_PX = 240; // ~ a dozen lines before "See more" kicks in

export function PostContent({
  content,
  contentFormat,
  className = "",
  collapsible = false,
}: {
  content?: string | null;
  contentFormat?: string | null;
  className?: string;
  collapsible?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!collapsible) return;
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight > COLLAPSED_MAX_PX + 24);
    check();
    // Re-check if layout shifts (fonts, viewport width).
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [collapsible, content, contentFormat]);

  if (!content) return null;

  const inner =
    contentFormat === "markdown" ? (
      <div className={`space-y-2 ${className}`}>{parseMarkdown(content)}</div>
    ) : (
      <p className={`whitespace-pre-line text-[0.95rem] leading-relaxed ${className}`}>
        {content}
      </p>
    );

  if (!collapsible) return inner;

  const clamp = !expanded; // applied only while collapsed; short content is unaffected

  return (
    <div>
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{ maxHeight: clamp ? COLLAPSED_MAX_PX : undefined }}
      >
        {inner}
        {clamp && overflowing && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-surface to-transparent" />
        )}
      </div>
      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-sm font-semibold text-brand hover:underline"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}