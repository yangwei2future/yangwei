import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import ArticleCard from "@/components/ArticleCard";
import { useArticles } from "@/lib/useArticles";
import { preloadArticles } from "@/lib/useArticles";
import { Mail, Github, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";

/**
 * Home Page
 *
 * Design: Modern Minimalism
 * - Clean hero section with personal introduction
 * - Recent articles showcase
 * - Call-to-action for contact
 */

export default function Home() {
  const { articles, loading } = useArticles();
  const recentArticles = articles.slice(0, 6);
  const [wechatOpen, setWechatOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  // Preload articles when user visits Home page
  useEffect(() => {
    preloadArticles();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 border-b border-border">
        <div className="container max-w-2xl">
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                欢迎来到我的博客
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                分享关于后端开发、技术思考和职业成长的文章。
              </p>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setEmailOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <Mail size={18} />
                邮箱
              </button>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <Github size={18} />
                GitHub
              </a>
              <button
                onClick={() => setWechatOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <MessageCircle size={18} />
                微信
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* WeChat QR Dialog */}
      <Dialog open={wechatOpen} onOpenChange={setWechatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>微信二维码</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <img
              src="/wechat-qr.png"
              alt="微信二维码"
              className="w-64 h-64 object-contain"
            />
            <p className="text-sm text-muted-foreground mt-4">
              扫码添加微信
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>邮箱地址</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <button
              onClick={() => {
                navigator.clipboard.writeText("ywei_20@126.com");
                alert("邮箱已复制到剪贴板");
              }}
              className="text-2xl font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              ywei_20@126.com
            </button>
            <p className="text-sm text-muted-foreground mt-4">
              点击复制邮箱地址
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recent Articles Section */}
      <section className="py-20">
        <div className="container">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground">最新文章</h2>
            <p className="mt-2 text-muted-foreground">
              探索我最近发布的技术文章和思考
            </p>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {loading ? (
              <p className="text-muted-foreground">加载中...</p>
            ) : recentArticles.length > 0 ? (
              recentArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  excerpt={article.excerpt}
                  date={article.date}
                  updatedAt={article.updatedAt}
                  tags={article.tags}
                />
              ))
            ) : (
              <p className="text-muted-foreground">暂无文章</p>
            )}
          </div>

          {/* View All Articles Link */}
          <div className="text-center">
            <Link href="/articles" className="inline-block px-6 py-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors border border-primary rounded-lg hover:bg-primary/5">
              查看所有文章 →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 个人博客. 保留所有权利。
          </p>
        </div>
      </footer>
    </div>
  );
}
