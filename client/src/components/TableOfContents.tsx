import { useState, useEffect, useCallback } from "react";
import { List, X, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

export function slugifyHeading(text: string): string {
  return stripInlineMarkdown(text)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fff-]/g, "")
    .replace(/-+/g, "-")
    .trim();
}

export function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join("");
  if (React.isValidElement(children))
    return extractTextFromChildren((children.props as { children?: React.ReactNode }).children);
  return "";
}

export function parseToc(content: string): TocItem[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[2].trim();
    items.push({ level: match[1].length, text, id: slugifyHeading(text) });
  }
  return items;
}

interface Props {
  content: string;
}

export default function TableOfContents({ content }: Props) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [activeId, setActiveId] = useState("");
  const items = parseToc(content);

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  const handlePin = useCallback(() => {
    setPinned((p) => !p);
  }, []);

  if (items.length === 0) return null;

  const visible = open || pinned;

  return (
    <>
      {/* Toggle button — only when sidebar is closed */}
      {!visible && (
        <button
          onClick={() => setOpen(true)}
          className="fixed left-4 top-24 z-40 flex items-center justify-center w-8 h-8 rounded-lg bg-background/70 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-accent/80 transition-all hover:scale-105"
          title="打开目录"
        >
          <List size={15} className="text-muted-foreground" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-56 z-30 flex flex-col transition-transform duration-300 ease-in-out",
          "bg-background/80 backdrop-blur-md border-r border-border/40 shadow-2xl",
          visible ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Decorative top gradient line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
            目录
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={handlePin}
              className={cn(
                "p-1.5 rounded-md transition-all",
                pinned
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent/60"
              )}
              title={pinned ? "取消固定" : "固定"}
            >
              <Pin size={13} />
            </button>
            {!pinned && (
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent/60 transition-all"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-border/30 shrink-0" />

        {/* Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-px">
          {items.map((item, i) => (
            <a
              key={i}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(item.id);
                if (!el) return;
                const top = el.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top, behavior: "smooth" });
              }}
              className={cn(
                "group relative flex items-start gap-2 py-1.5 pr-2 rounded-md text-[13px] leading-snug transition-all duration-150",
                item.level === 1 && "pl-2",
                item.level === 2 && "pl-4",
                item.level === 3 && "pl-6",
                activeId === item.id
                  ? "text-foreground"
                  : "text-muted-foreground/60 hover:text-muted-foreground"
              )}
            >
              {/* Active indicator bar */}
              <span
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full transition-all duration-200",
                  activeId === item.id
                    ? "h-4/5 bg-primary opacity-100"
                    : "h-0 bg-primary opacity-0 group-hover:h-3/5 group-hover:opacity-40"
                )}
              />

              {/* Level dot */}
              <span
                className={cn(
                  "mt-[5px] shrink-0 rounded-full transition-all duration-150",
                  item.level === 1 && "w-1.5 h-1.5",
                  item.level === 2 && "w-1 h-1",
                  item.level === 3 && "w-1 h-1 opacity-60",
                  activeId === item.id
                    ? "bg-primary"
                    : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
                )}
              />

              <span className={cn("truncate", item.level === 1 && "font-medium")}>
                {item.text}
              </span>
            </a>
          ))}
        </nav>

        {/* Bottom fade */}
        <div className="h-6 bg-gradient-to-t from-background/80 to-transparent shrink-0 pointer-events-none" />
      </aside>

      {/* Backdrop */}
      {open && !pinned && (
        <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
      )}
    </>
  );
}
