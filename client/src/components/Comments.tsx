import { useState, useEffect } from "react";
import { Send, Trash2, MessageSquare } from "lucide-react";
import { getAuthSession } from "@/lib/article-links";

interface Comment {
  id: string;
  articleId: string;
  nickname: string;
  content: string;
  createdAt: string;
}

interface Props {
  articleId: string;
}

export default function Comments({ articleId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/comments?articleId=${encodeURIComponent(articleId)}`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setComments(data))
      .finally(() => setLoading(false));
  }, [articleId]);

  useEffect(() => {
    getAuthSession().then((session) => setIsAdmin(session.authenticated));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, nickname: nickname.trim(), content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "提交失败"); return; }
      setComments((prev) => [...prev, data]);
      setContent("");
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!isAdmin) return;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    await fetch("/api/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, commentId }),
    });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <section className="py-12 border-t border-border">
      <div className="container max-w-4xl">
        {/* Header */}
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground mb-8">
          <MessageSquare size={18} className="text-muted-foreground" />
          评论
          {!loading && (
            <span className="text-sm font-normal text-muted-foreground">
              （{comments.length}）
            </span>
          )}
        </h2>

        {/* Comment form */}
        <form onSubmit={handleSubmit} className="mb-10">
          <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card">
            <input
              type="text"
              placeholder="昵称（选填，默认匿名）"
              maxLength={20}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
            <div className="h-px bg-border" />
            <textarea
              placeholder="写下你的想法…"
              rows={4}
              maxLength={1000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground/50">{content.length}/1000</span>
              <div className="flex items-center gap-3">
                {error && <span className="text-xs text-destructive">{error}</span>}
                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-full hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  <Send size={13} />
                  {submitting ? "发送中…" : "发送"}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Comments list */}
        {loading ? (
          <p className="text-sm text-muted-foreground">加载评论中…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">还没有评论，来说第一句话吧</p>
        ) : (
          <div className="space-y-6">
            {comments.map((c) => (
              <div key={c.id} className="group flex gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium text-muted-foreground shrink-0">
                  {c.nickname.charAt(0).toUpperCase()}
                </div>
                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{c.nickname}</span>
                    <span className="text-xs text-muted-foreground/60">{formatDate(c.createdAt)}</span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">
                    {c.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
