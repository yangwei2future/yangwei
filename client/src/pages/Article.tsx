import { useParams, Link } from "wouter";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import TableOfContents, { slugifyHeading, extractTextFromChildren } from "@/components/TableOfContents";
import Comments from "@/components/Comments";
import { useArticles } from "@/lib/useArticles";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { ArrowLeft, X, Copy, Check, Lock, BookMarked } from "lucide-react";
import { useState, useEffect } from "react";
import type { ComponentPropsWithoutRef, ReactElement } from "react";
import { fetchArticlesFromGitHub, resolveArticleId } from "@/lib/markdown-loader";
import type { Article as ArticleType } from "@/lib/types";

function makeHeading(Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
  return function Heading({ children, ...props }: ComponentPropsWithoutRef<typeof Tag>) {
    const id = slugifyHeading(extractTextFromChildren(children));
    return <Tag id={id} {...props}>{children}</Tag>;
  };
}

function CodeBlock({ children }: ComponentPropsWithoutRef<"pre">) {
  const [copied, setCopied] = useState(false);

  const codeEl = children as ReactElement<{ className?: string; children?: string }>;
  const className = codeEl?.props?.className ?? "";
  const lang = className.replace("hljs", "").replace(/language-/g, "").trim() || "plaintext";
  const rawText = codeEl?.props?.children ?? "";

  function handleCopy() {
    navigator.clipboard.writeText(typeof rawText === "string" ? rawText : "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-[#e1e4e8]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#f6f8fa] border-b border-[#e1e4e8]">
        <span className="text-xs font-mono text-[#57606a] select-none">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-[#57606a] hover:text-[#24292f] transition-colors"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? "已复制" : "复制"}</span>
        </button>
      </div>
      <pre className="!m-0 !rounded-none !bg-[#ffffff] overflow-x-auto p-4 text-sm leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

const headingComponents = {
  h1: makeHeading("h1"),
  h2: makeHeading("h2"),
  h3: makeHeading("h3"),
  h4: makeHeading("h4"),
};

/**
 * Article Detail Page
 *
 * Design: Modern Minimalism
 * - Centered reading area with optimal line length
 * - Markdown rendering with proper typography
 * - Navigation and related articles
 */

export default function Article() {
  const { id } = useParams<{ id: string }>();
  const { articles, allLinks, loading } = useArticles();
  const [zoomedSrc, setZoomedSrc] = useState<string | null>(null);
  const [hiddenArticle, setHiddenArticle] = useState<ArticleType | null>(null);
  const [hiddenLoading, setHiddenLoading] = useState(false);

  useEffect(() => {
    if (!zoomedSrc) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setZoomedSrc(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomedSrc]);

  // Load hidden article if not found in public list
  useEffect(() => {
    if (loading || !id) return;
    if (articles.find((a) => a.id === id)) return;
    const link = allLinks.find(
      (l) => l.hidden && resolveArticleId(l) === id
    );
    if (!link) return;
    setHiddenLoading(true);
    fetchArticlesFromGitHub([link])
      .then(([fetched]) => {
        if (fetched) setHiddenArticle({
          ...fetched,
          createdAt: link.createdAt ?? fetched.createdAt,
          refs: link.refs,
          hidden: true,
        });
      })
      .finally(() => setHiddenLoading(false));
  }, [id, loading, articles, allLinks]);

  const markdownComponents = {
    ...headingComponents,
    pre: CodeBlock,
    img({ src, alt }: { src?: string; alt?: string }) {
      return (
        <img
          src={src}
          alt={alt}
          onClick={() => src && setZoomedSrc(src)}
          className="cursor-zoom-in rounded max-w-full"
        />
      );
    },
    video({ src, children, ...props }: ComponentPropsWithoutRef<"video">) {
      return (
        <video controls className="w-full rounded" src={src} {...props}>
          {children}
        </video>
      );
    },
  };

  if (loading || hiddenLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  const article = articles.find((a) => a.id === id) ?? hiddenArticle;

  if (!article) {
    return (
      <div className="min-h-screen bg-background pb-10">
        <Navigation />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">文章未找到</h1>
          <Link href="/articles" className="mt-4 inline-block text-primary hover:text-primary/80">
            返回文章列表
          </Link>
        </div>
      </div>
    );
  }

  // Get related articles (same tags)
  const relatedArticles = articles
    .filter(
      (a) =>
        a.id !== article.id &&
        a.tags.some((tag) => article.tags.includes(tag))
    )
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background pb-10">
      <Navigation />
      <TableOfContents content={article.content} />

      {/* Article Header */}
      <section className="py-12 border-b border-border">
        <div className="container max-w-4xl">
          <Link href="/articles" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mb-6">
            <ArrowLeft size={16} />
            返回文章列表
          </Link>

          <article>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground flex items-center gap-3 flex-wrap">
              {article.title}
              {article.hidden && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground border border-border align-middle shrink-0">
                  <Lock size={11} />
                  隐藏文章
                </span>
              )}
            </h1>

            <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
              <time>
                {"创建于 "}
                {new Date(article.createdAt).toLocaleString("zh-CN", {
                  timeZone: "Asia/Shanghai",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
              {article.author && (
                <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-accent/60">
                  <img
                    src="/avatar.jpg"
                    alt={article.author}
                    className="w-5 h-5 rounded-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  <span className="text-xs text-muted-foreground">{article.author}</span>
                </span>
              )}
            </div>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-1 text-xs bg-accent text-accent-foreground rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12">
        <div className="container max-w-4xl">
          <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-a:text-primary prose-code:text-primary prose-pre:bg-accent">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeHighlight]} components={markdownComponents as any}>
              {article.content}
            </ReactMarkdown>
          </article>

          {/* Image Lightbox */}
          {zoomedSrc && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
              onClick={() => setZoomedSrc(null)}
            >
              <button
                className="absolute top-4 right-4 text-white/80 hover:text-white"
                onClick={() => setZoomedSrc(null)}
              >
                <X size={28} />
              </button>
              <img
                src={zoomedSrc}
                className="max-w-[90vw] max-h-[90vh] rounded shadow-2xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      </section>

      {/* Referenced Articles */}
      {(article.refs ?? []).length > 0 && (() => {
        const refItems = (article.refs ?? []).map((refId) => {
          const pub = articles.find((a) => a.id === refId);
          if (pub) return { id: pub.id, title: pub.title, excerpt: pub.excerpt, hidden: false };
          const link = allLinks.find(
            (l) => resolveArticleId(l) === refId
          );
          if (link) return { id: refId, title: link.title ?? refId, excerpt: "", hidden: !!link.hidden };
          return null;
        }).filter(Boolean) as { id: string; title: string; excerpt: string; hidden: boolean }[];

        if (refItems.length === 0) return null;
        return (
          <section className="py-12 border-t border-border">
            <div className="container max-w-4xl">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                <BookMarked size={16} className="text-muted-foreground" />
                引用文章
              </h2>
              <div className="space-y-2">
                {refItems.map((ref) => (
                  <Link
                    key={ref.id}
                    href={`/article/${ref.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-muted-foreground/30 hover:bg-accent/40 transition-colors group"
                  >
                    {ref.hidden && (
                      <Lock size={13} className="shrink-0 text-muted-foreground/60" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {ref.title}
                      </p>
                      {ref.excerpt && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{ref.excerpt}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="py-12 border-t border-border bg-accent/30">
          <div className="container max-w-4xl">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              相关文章
            </h2>
            <div className="space-y-4">
              {relatedArticles.map((related) => (
                <Link key={related.id} href={`/article/${related.id}`} className="block p-4 rounded-lg border border-border hover:border-[oklch(0.78_0.003_286)] transition-colors duration-150 group">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {related.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {related.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Comments */}
      <Comments articleId={article.id} />

      {/* Footer */}
      <Footer />
    </div>
  );
}
