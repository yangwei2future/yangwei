import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { List, X, Pin, GripHorizontal } from "lucide-react";
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

const PANEL_W = 224; // w-56

interface Props {
  content: string;
}

export default function TableOfContents({ content }: Props) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [side, setSide] = useState<"left" | "right">(() => {
    try { return (localStorage.getItem("toc_side") as "left" | "right") ?? "left"; } catch { return "left"; }
  });

  // Panel ref — left is managed ONLY via direct DOM mutations, never via React style prop
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, startLeft: 0 });

  const items = parseToc(content);
  const visible = open || pinned;

  // ── helpers ──────────────────────────────────────────────────────────────────

  function getSnapped(s: "left" | "right") {
    return s === "left" ? 0 : window.innerWidth - PANEL_W;
  }
  function getHidden(s: "left" | "right") {
    return s === "left" ? -PANEL_W - 10 : window.innerWidth + 10;
  }
  function moveTo(px: number, transition = false) {
    const el = panelRef.current;
    if (!el) return;
    el.style.transition = transition ? "left 0.28s cubic-bezier(0.4,0,0.2,1)" : "none";
    el.style.left = `${px}px`;
  }

  // ── initialise position once on mount (before paint) ─────────────────────────

  useLayoutEffect(() => {
    moveTo(getHidden(side)); // start hidden
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── slide in / out when visibility or side changes ────────────────────────────

  useEffect(() => {
    if (dragRef.current.active) return;
    moveTo(visible ? getSnapped(side) : getHidden(side), true);
  }, [visible, side]);

  // ── IntersectionObserver ──────────────────────────────────────────────────────

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting);
        if (vis.length > 0) setActiveId(vis[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  // ── drag via Pointer Events + capture ────────────────────────────────────────
  // Works for both the floating toggle button and the panel header grip.
  // Target element: whatever receives onPointerDown (button or header div).
  // We track the PANEL position, not the button position.

  function startDrag(e: React.PointerEvent, targetLeft: number) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { active: true, startX: e.clientX, startLeft: targetLeft };
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  }

  const onPanelPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = panelRef.current;
    if (!el) return;
    startDrag(e, el.getBoundingClientRect().left);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle button drag: treat button's x position as proxy for desired panel left
  const btnRef = useRef<HTMLButtonElement>(null);
  const onBtnPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    startDrag(e, side === "left" ? 0 : window.innerWidth - PANEL_W);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const delta = e.clientX - dragRef.current.startX;
    const newLeft = dragRef.current.startLeft + delta;
    const clamped = Math.max(-PANEL_W + 48, Math.min(window.innerWidth - 48, newLeft));
    moveTo(clamped);
    // Also move the toggle button if panel is closed
    const btn = btnRef.current;
    if (btn) {
      const btnX = newSideFromLeft(clamped) === "right"
        ? window.innerWidth - 48
        : 16;
      btn.style.transition = "none";
      btn.style.left = `${newSideFromLeft(clamped) === "right" ? "auto" : btnX + "px"}`;
      if (newSideFromLeft(clamped) === "right") { btn.style.left = "auto"; btn.style.right = "16px"; }
      else { btn.style.right = "auto"; btn.style.left = `${btnX}px`; }
    }
  }, []);

  function newSideFromLeft(left: number) {
    return left + PANEL_W / 2 > window.innerWidth / 2 ? "right" : "left";
  }

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    const delta = e.clientX - dragRef.current.startX;
    const finalLeft = dragRef.current.startLeft + delta;
    const newSide = newSideFromLeft(finalLeft);

    moveTo(getSnapped(newSide), true);
    setSide(newSide);

    // Reset button style (will be re-driven by React on next render)
    const btn = btnRef.current;
    if (btn) { btn.style.transition = ""; btn.style.left = ""; btn.style.right = ""; }

    try { localStorage.setItem("toc_side", newSide); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePin = useCallback(() => setPinned((p) => !p), []);

  if (items.length === 0) return null;

  const toggleBtnStyle: React.CSSProperties =
    side === "right" ? { right: 16, left: "auto", top: 96 } : { left: 16, top: 96 };

  return (
    <>
      {/* Toggle button — click to open, drag to switch side */}
      {!visible && (
        <button
          ref={btnRef}
          onClick={() => setOpen(true)}
          onPointerDown={onBtnPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={toggleBtnStyle}
          className="fixed z-40 flex items-center justify-center w-8 h-8 rounded-lg bg-background/70 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-accent/80 transition-all hover:scale-105 cursor-grab active:cursor-grabbing touch-none"
          title="点击打开目录 · 拖拽切换左右"
        >
          <List size={15} className="text-muted-foreground" />
        </button>
      )}

      {/* Sidebar — left is managed via DOM only, NOT via React style */}
      <div
        ref={panelRef}
        className={cn(
          "fixed top-0 h-screen w-56 z-30 flex flex-col",
          "bg-background/80 backdrop-blur-md shadow-2xl",
          side === "left" ? "border-r border-border/40" : "border-l border-border/40",
        )}
      >
        {/* Decorative top gradient line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent shrink-0" />

        {/* Header / drag handle */}
        <div
          onPointerDown={onPanelPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0 cursor-grab active:cursor-grabbing select-none touch-none"
        >
          <div className="flex items-center gap-1.5">
            <GripHorizontal size={13} className="text-muted-foreground/40" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
              目录
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onPointerDown={(e) => e.stopPropagation()}
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
                onPointerDown={(e) => e.stopPropagation()}
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
              <span
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-0.5 rounded-full transition-all duration-200",
                  side === "left" ? "left-0" : "right-0",
                  activeId === item.id
                    ? "h-4/5 bg-primary opacity-100"
                    : "h-0 bg-primary opacity-0 group-hover:h-3/5 group-hover:opacity-40"
                )}
              />
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
      </div>

      {/* Backdrop */}
      {open && !pinned && (
        <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
      )}
    </>
  );
}
