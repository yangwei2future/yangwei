import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import { useArticles, preloadArticles } from "@/lib/useArticles";
import { useCategories } from "@/contexts/CategoriesContext";
import { getBadgeClass } from "@/lib/categories";
import { Mail, Github, MessageCircle, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function ArticleRow({ id, title, excerpt, date, createdAt, categories }: {
  id: string; title: string; excerpt: string; date: string;
  createdAt?: string; categories?: string[];
}) {
  const { getCategoryById } = useCategories();
  const d = new Date(createdAt ?? date);
  const cats = (categories ?? []).map(getCategoryById).filter(Boolean) as NonNullable<ReturnType<typeof getCategoryById>>[];

  return (
    <Link href={`/article/${id}`} className="group block py-3 border-b border-border/50 last:border-0 hover:bg-accent/20 -mx-3 px-3 rounded-lg transition-colors duration-150">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug truncate">
          {title}
        </h3>
        <time className="shrink-0 text-xs text-muted-foreground/50 tabular-nums">
          {d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })}
        </time>
      </div>
      {cats.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {cats.map((cat) => (
            <span key={cat.id} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full ${getBadgeClass(cat.color)}`}>
              {cat.icon} {cat.label}
            </span>
          ))}
        </div>
      )}
      {excerpt && (
        <p className="mt-0.5 text-xs text-muted-foreground/60 line-clamp-1">{excerpt}</p>
      )}
    </Link>
  );
}

export default function Home() {
  const { articles, loading } = useArticles();
  const recentArticles = articles.slice(0, 5);
  const [wechatOpen, setWechatOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  useEffect(() => { preloadArticles(); }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container max-w-5xl py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-10 md:gap-16">

          {/* ── Left: Profile ── */}
          <aside className="space-y-6">
            {/* Avatar + name */}
            <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-3">
              <img
                src="/avatar.jpg"
                alt="avatar"
                className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover ring-2 ring-border"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">个人博客</h1>
                <p className="text-sm text-muted-foreground mt-0.5">全栈工程师</p>
              </div>
            </div>

            {/* Intro */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              Java Web 开发，因为 AI 变成了全栈。
              <br />记录技术成长和思考的地方。
            </p>

            {/* Social links */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setEmailOpen(true)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left"
              >
                <Mail size={15} className="shrink-0" />
                邮箱联系
              </button>
              <a
                href="https://github.com/yangwei2future"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Github size={15} className="shrink-0" />
                GitHub
              </a>
              <button
                onClick={() => setWechatOpen(true)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left"
              >
                <MessageCircle size={15} className="shrink-0" />
                微信
              </button>
            </div>

            {/* Nav links */}
            <div className="pt-2 border-t border-border space-y-1">
              <Link href="/articles" className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                所有文章 <ArrowRight size={13} />
              </Link>
              <Link href="/about" className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                关于我 <ArrowRight size={13} />
              </Link>
            </div>
          </aside>

          {/* ── Right: Recent Articles ── */}
          <main>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">最新文章</h2>
              <Link href="/articles" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                查看全部 <ArrowRight size={11} />
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
                <Loader2 size={15} className="animate-spin" />加载中…
              </div>
            ) : recentArticles.length > 0 ? (
              <div>
                {recentArticles.map((a) => (
                  <ArticleRow
                    key={a.id}
                    id={a.id}
                    title={a.title}
                    excerpt={a.excerpt}
                    date={a.date}
                    createdAt={a.createdAt}
                    categories={a.categories}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8">暂无文章</p>
            )}
          </main>
        </div>
      </div>

      {/* WeChat Dialog */}
      <Dialog open={wechatOpen} onOpenChange={setWechatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>微信</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center py-6">
            <img src="/wechat-qr.png" alt="微信二维码" className="w-56 h-56 object-contain" />
            <p className="text-sm text-muted-foreground mt-4">扫码添加微信</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>邮箱</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center py-6">
            <button
              onClick={() => { navigator.clipboard.writeText("ywei_20@126.com"); alert("已复制"); }}
              className="text-xl font-semibold text-foreground hover:text-primary transition-colors"
            >
              ywei_20@126.com
            </button>
            <p className="text-sm text-muted-foreground mt-3">点击复制</p>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="py-5 border-t border-border mt-4">
        <div className="container text-center">
          <p className="text-xs text-muted-foreground">© 2026 个人博客. 保留所有权利。</p>
        </div>
      </footer>
    </div>
  );
}
