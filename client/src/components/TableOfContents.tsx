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

const PANEL_W = 224;
const BTN_SIZE = 32;
const EDGE_GAP = 16;

interface Props { content: string; }

export default function TableOfContents({ content }: Props) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [side, setSide] = useState<"left" | "right">(() => {
    try { return (localStorage.getItem("toc_side") as "left" | "right") ?? "left"; } catch { return "left"; }
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef   = useRef<HTMLButtonElement>(null);
  // shared drag state
  const drag = useRef({ active: false, startX: 0, startElLeft: 0, moved: false });

  const items   = parseToc(content);
  const visible = open || pinned;

  // ── position helpers (DOM-only, no React style) ───────────────────────────────
  function panelSnapped(s: "left" | "right") { return s === "left" ? 0 : window.innerWidth - PANEL_W; }
  function panelHidden (s: "left" | "right") { return s === "left" ? -PANEL_W - 10 : window.innerWidth + 10; }
  function btnSnapped  (s: "left" | "right") { return s === "left" ? EDGE_GAP : window.innerWidth - BTN_SIZE - EDGE_GAP; }

  function setElLeft(el: HTMLElement, px: number, animate = false) {
    el.style.transition = animate ? "left 0.25s cubic-bezier(0.4,0,0.2,1)" : "none";
    el.style.left = `${px}px`;
  }

  // ── initialise positions before first paint ───────────────────────────────────
  useLayoutEffect(() => {
    if (panelRef.current) setElLeft(panelRef.current, panelHidden(side));
    if (btnRef.current)   setElLeft(btnRef.current,   btnSnapped(side));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── slide panel + reposition button when visibility / side changes ────────────
  useEffect(() => {
    if (drag.current.active) return;
    if (panelRef.current) setElLeft(panelRef.current, visible ? panelSnapped(side) : panelHidden(side), true);
    if (btnRef.current)   setElLeft(btnRef.current,   btnSnapped(side), true);
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

  // ── BUTTON drag ───────────────────────────────────────────────────────────────
  const onBtnPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    drag.current = { active: true, startX: e.clientX, startElLeft: rect.left, moved: false };
    document.body.style.userSelect = "none";
  }, []);

  const onBtnPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current.active) return;
    const delta = e.clientX - drag.current.startX;
    if (Math.abs(delta) > 4) drag.current.moved = true;
    if (!drag.current.moved) return;
    const newLeft = drag.current.startElLeft + delta;
    const clamped = Math.max(EDGE_GAP / 2, Math.min(window.innerWidth - BTN_SIZE - EDGE_GAP / 2, newLeft));
    const btn = e.currentTarget;
    btn.style.transition = "none";
    btn.style.left = `${clamped}px`;
  }, []);

  const onBtnPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current.active) return;
    const wasDrag = drag.current.moved;
    drag.current.active = false;
    drag.current.moved  = false;
    document.body.style.userSelect = "";

    if (!wasDrag) {
      // treated as a click — open panel
      setOpen(true);
      return;
    }

    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const newSide = rect.left + BTN_SIZE / 2 > window.innerWidth / 2 ? "right" : "left";
    setElLeft(btn, btnSnapped(newSide), true);
    setSide(newSide);
    try { localStorage.setItem("toc_side", newSide); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── PANEL HEADER drag ─────────────────────────────────────────────────────────
  const onHeaderPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = panel.getBoundingClientRect();
    drag.current = { active: true, startX: e.clientX, startElLeft: rect.left, moved: false };
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  }, []);

  const onHeaderPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.moved = true;
    const panel = panelRef.current;
    if (!panel) return;
    const delta = e.clientX - drag.current.startX;
    const newLeft = drag.current.startElLeft + delta;
    const clamped = Math.max(-PANEL_W + 48, Math.min(window.innerWidth - 48, newLeft));
    panel.style.transition = "none";
    panel.style.left = `${clamped}px`;
  }, []);

  const onHeaderPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    drag.current.moved  = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const newSide = rect.left + PANEL_W / 2 > window.innerWidth / 2 ? "right" : "left";
    setElLeft(panel, panelSnapped(newSide), true);
    setSide(newSide);
    try { localStorage.setItem("toc_side", newSide); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePin = useCallback(() => setPinned((p) => !p), []);

  if (items.length === 0) return null;

  return (
    <>
      {/* Floating toggle button — click to open, drag to switch side */}
      {!visible && (
        <button
          ref={btnRef}
          onPointerDown={onBtnPointerDown}
          onPointerMove={onBtnPointerMove}
          onPointerUp={onBtnPointerUp}
          onPointerCancel={onBtnPointerUp}
          style={{ top: 96 }}
          className="fixed z-40 flex items-center justify-center w-8 h-8 rounded-lg bg-background/70 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-accent/80 transition-colors cursor-grab active:cursor-grabbing touch-none select-none"
          title="点击打开 · 拖拽换边"
        >
          <List size={15} className="text-muted-foreground" />
        </button>
      )}

      {/* Sidebar panel — left managed via DOM only */}
      <div
        ref={panelRef}
        className={cn(
          "fixed top-0 h-screen w-56 z-30 flex flex-col",
          "bg-background/80 backdrop-blur-md shadow-2xl",
          side === "left" ? "border-r border-border/40" : "border-l border-border/40",
        )}
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent shrink-0" />

        {/* Header / drag handle */}
        <div
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={onHeaderPointerUp}
          onPointerCancel={onHeaderPointerUp}
          className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0 cursor-grab active:cursor-grabbing select-none touch-none"
        >
          <div className="flex items-center gap-1.5">
            <GripHorizontal size={13} className="text-muted-foreground/40" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">目录</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handlePin}
              className={cn(
                "p-1.5 rounded-md transition-all",
                pinned ? "text-primary bg-primary/10" : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent/60"
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

        <div className="mx-4 h-px bg-border/30 shrink-0" />

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-px">
          {items.map((item, i) => (
            <a
              key={i}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(item.id);
                if (!el) return;
                window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
              }}
              className={cn(
                "group relative flex items-start gap-2 py-1.5 pr-2 rounded-md text-[13px] leading-snug transition-all duration-150",
                item.level === 1 && "pl-2",
                item.level === 2 && "pl-4",
                item.level === 3 && "pl-6",
                activeId === item.id ? "text-foreground" : "text-muted-foreground/60 hover:text-muted-foreground"
              )}
            >
              <span className={cn(
                "absolute top-1/2 -translate-y-1/2 w-0.5 rounded-full transition-all duration-200",
                side === "left" ? "left-0" : "right-0",
                activeId === item.id ? "h-4/5 bg-primary opacity-100" : "h-0 bg-primary opacity-0 group-hover:h-3/5 group-hover:opacity-40"
              )} />
              <span className={cn(
                "mt-[5px] shrink-0 rounded-full transition-all duration-150",
                item.level === 1 && "w-1.5 h-1.5",
                (item.level === 2 || item.level === 3) && "w-1 h-1",
                item.level === 3 && "opacity-60",
                activeId === item.id ? "bg-primary" : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
              )} />
              <span className={cn("truncate", item.level === 1 && "font-medium")}>{item.text}</span>
            </a>
          ))}
        </nav>

        <div className="h-6 bg-gradient-to-t from-background/80 to-transparent shrink-0 pointer-events-none" />
      </div>

      {open && !pinned && (
        <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
      )}
    </>
  );
}
