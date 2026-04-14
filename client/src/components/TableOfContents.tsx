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

  // Scroll spy
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
    setPinned((p) => {
      if (!p) setOpen(false);
      return !p;
    });
  }, []);

  if (items.length === 0) return null;

  const visible = open || pinned;

  return (
    <>
      {/* Toggle button — hidden when pinned */}
      {!pinned && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="fixed right-4 top-24 z-40 flex items-center justify-center w-9 h-9 rounded-full bg-background border border-border shadow-md hover:bg-accent transition-colors"
          title="目录"
        >
          {open ? <X size={16} /> : <List size={16} />}
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed right-0 top-0 h-screen w-60 bg-background border-l border-border shadow-xl z-30 flex flex-col transition-transform duration-300 ease-in-out",
          visible ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-semibold">目录</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePin}
              className={cn(
                "p-1.5 rounded hover:bg-accent transition-colors",
                pinned && "text-primary"
              )}
              title={pinned ? "取消固定" : "固定"}
            >
              <Pin size={14} />
            </button>
            {!pinned && (
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded hover:bg-accent transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {items.map((item, i) => (
            <a
              key={i}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className={cn(
                "block py-1 px-2 text-sm rounded truncate transition-colors",
                item.level === 1 && "font-medium",
                item.level === 2 && "pl-4",
                item.level === 3 && "pl-6 text-xs",
                activeId === item.id
                  ? "text-primary bg-primary/10 font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {item.text}
            </a>
          ))}
        </nav>
      </aside>

      {/* Backdrop */}
      {open && !pinned && (
        <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
      )}
    </>
  );
}
