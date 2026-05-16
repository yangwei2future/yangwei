import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, LogOut, Loader2, RefreshCw, Pencil, Check, X, EyeOff, Eye, Tag, FolderOpen, BookMarked, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  verifyPassword,
  isAuthenticated,
  setAuthenticated,
  logout,
  getArticleLinks,
  addArticleLink,
  removeArticleLink,
  type ArticleLink,
} from "@/lib/article-links";
import { useArticles } from "@/lib/useArticles";
import { generateIdFromUrl } from "@/lib/markdown-loader";
import { useCategories } from "@/contexts/CategoriesContext";
import { COLOR_OPTIONS, getBadgeClass } from "@/lib/categories";

export default function Admin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthState] = useState(isAuthenticated());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [links, setLinks] = useState<ArticleLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { articles, allLinks, reload, refresh, refreshSingle, updateTitle, updateCategory, updateRefs, toggleHidden } = useArticles();
  const [syncing, setSyncing] = useState(false);
  const [syncingUrl, setSyncingUrl] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingCategoryUrl, setEditingCategoryUrl] = useState<string | null>(null);
  const [pendingCategories, setPendingCategories] = useState<string[]>([]);
  const [editingRefsUrl, setEditingRefsUrl] = useState<string | null>(null);
  const [pendingRefs, setPendingRefs] = useState<string[]>([]);
  const { categories, addCategory, updateCategory: updateCategoryDef, deleteCategory } = useCategories();
  // Category management form
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catFormUrl, setCatFormUrl] = useState<string | null>(null); // null=closed, "new"=add, id=edit
  const [catLabel, setCatLabel] = useState("");
  const [catIcon, setCatIcon] = useState("📁");
  const [catColor, setCatColor] = useState("gray");
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState("");
  // search + pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  async function handleSync() {
    setSyncing(true);
    setSuccess("");
    setError("");
    try {
      await refresh();
      setSuccess("已从 GitHub 同步最新内容");
    } catch {
      setError("同步失败，请稍后重试");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    if (authenticated) {
      setLoadingLinks(true);
      getArticleLinks()
        .then(setLinks)
        .finally(() => setLoadingLinks(false));
    }
  }, [authenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (verifyPassword(password)) {
      setAuthenticated(true);
      setAuthState(true);
      setPassword("");
    } else {
      setError("密码错误，请重试");
    }
  };

  const handleLogout = () => {
    logout();
    setAuthState(false);
    setLocation("/");
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newUrl.trim()) { setError("请输入链接地址"); return; }
    if (!isValidGitHubUrl(newUrl)) {
      setError("请输入有效的 GitHub Markdown 链接（如：https://github.com/user/repo/blob/main/article.md）");
      return;
    }
    setSubmitting(true);
    try {
      await addArticleLink(newUrl.trim(), newTitle.trim() || undefined);
      const updated = await getArticleLinks();
      setLinks(updated);
      setNewUrl("");
      setNewTitle("");
      setSuccess("文章链接添加成功！");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "添加失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveLink = async (url: string) => {
    setError("");
    setSuccess("");
    try {
      await removeArticleLink(url);
      const updated = await getArticleLinks();
      setLinks(updated);
      setSuccess("文章链接已删除");
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    }
  };

  async function handleSyncSingle(url: string) {
    setSyncingUrl(url);
    setError(""); setSuccess("");
    try {
      await refreshSingle(url);
      const updated = await getArticleLinks();
      setLinks(updated);
      setSuccess("同步成功");
    } catch {
      setError("同步失败，请稍后重试");
    } finally {
      setSyncingUrl(null);
    }
  }

  async function handleSaveTitle(url: string) {
    try {
      await updateTitle(url, editingTitle);
      const updated = await getArticleLinks();
      setLinks(updated);
    } finally {
      setEditingUrl(null);
    }
  }

  function isValidGitHubUrl(url: string): boolean {
    return url.includes("github.com") && url.endsWith(".md");
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container max-w-md py-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                管理员登录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="mt-2"
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full">登录</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container max-w-4xl py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">文章链接管理</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              同步内容
            </Button>
            <Button variant="outline" onClick={() => { setCatDialogOpen(true); setCatFormUrl(null); setCatError(""); }}>
              <FolderOpen className="h-4 w-4 mr-2" />
              分类管理
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              退出
            </Button>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>添加文章链接</CardTitle>
            <p className="text-sm text-muted-foreground">
              输入 GitHub Markdown 文件的链接地址（如：https://github.com/user/repo/blob/main/article.md）
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddLink} className="space-y-4">
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://github.com/username/repo/blob/branch/path/to/article.md"
              />
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="自定义标题（选填，不填则自动从文章提取）"
              />
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                添加文章
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle>已添加的文章 ({links.length})</CardTitle>
              {links.length > 0 && (
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="搜索文章标题…"
                    className="pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-52"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingLinks ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : links.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>暂无文章链接</p>
                <p className="text-sm mt-2">请添加 GitHub Markdown 链接来发布文章</p>
              </div>
            ) : (() => {
              const q = searchQuery.trim().toLowerCase();
              const filtered = q
                ? links.filter((link) => {
                    const articleTitle = articles.find((a) =>
                      generateIdFromUrl(link.url) === a.id
                    )?.title;
                    const title = (articleTitle || link.title || link.url).toLowerCase();
                    return title.includes(q);
                  })
                : links;
              const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
              const page = Math.min(currentPage, totalPages);
              const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

              return (
              <>
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">没有匹配的文章</p>
              ) : (
              <div className="space-y-3">
                {paged.map((link) => (
                  <div key={link.url} className={`p-3 border rounded-lg space-y-2 ${link.hidden ? "opacity-50" : ""}`}>
                    {/* Title row */}
                    {editingUrl === link.url ? (
                      <div className="flex items-center gap-2">
                        <Input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSaveTitle(link.url); if (e.key === "Escape") setEditingUrl(null); }}
                          placeholder="自定义标题（留空则从文章自动提取）"
                          className="h-7 text-sm"
                        />
                        <button onClick={() => handleSaveTitle(link.url)} className="text-green-600 hover:text-green-700"><Check size={15} /></button>
                        <button onClick={() => setEditingUrl(null)} className="text-muted-foreground hover:text-foreground"><X size={15} /></button>
                      </div>
                    ) : (() => {
                        const articleTitle = articles.find((a) =>
                          generateIdFromUrl(link.url) === a.id
                        )?.title;
                        const displayTitle = articleTitle || link.title;
                        return (
                          <div className="flex items-center gap-1.5 min-w-0">
                            {displayTitle
                              ? <p className="text-sm font-medium truncate">{displayTitle}</p>
                              : <p className="text-sm text-muted-foreground truncate italic">加载中...</p>
                            }
                            {link.hidden && (
                              <span className="shrink-0 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">已隐藏</span>
                            )}
                            <button onClick={() => { setEditingUrl(link.url); setEditingTitle(link.title || ""); }} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                              <Pencil size={12} />
                            </button>
                          </div>
                        );
                      })()
                    }
                    {/* Category selector */}
                    {editingCategoryUrl === link.url ? (
                      <div className="space-y-2 py-1">
                        <div className="flex flex-wrap gap-1.5">
                          {categories.map((cat) => {
                            const selected = pendingCategories.includes(cat.id);
                            return (
                              <button
                                key={cat.id}
                                onClick={() => setPendingCategories((prev) =>
                                  selected ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]
                                )}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border-2 transition-all ${
                                  selected
                                    ? `${getBadgeClass(cat.color)} border-current`
                                    : "border-transparent bg-muted text-muted-foreground hover:bg-accent"
                                }`}
                              >
                                <span>{cat.icon}</span><span>{cat.label}</span>
                                {selected && <Check size={10} />}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              await updateCategory(link.url, pendingCategories);
                              const updated = await getArticleLinks();
                              setLinks(updated);
                              setEditingCategoryUrl(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded-full hover:opacity-90"
                          >
                            <Check size={11} />确认
                          </button>
                          <button onClick={() => setEditingCategoryUrl(null)} className="text-xs text-muted-foreground hover:text-foreground">取消</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">分类：</span>
                        {(link.categories ?? []).map((id) => {
                          const cat = categories.find((c) => c.id === id);
                          return cat ? (
                            <span key={id} className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${getBadgeClass(cat.color)}`}>
                              <span>{cat.icon}</span><span>{cat.label}</span>
                            </span>
                          ) : null;
                        })}
                        <button
                          onClick={() => { setEditingCategoryUrl(link.url); setPendingCategories(link.categories ?? []); }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:bg-muted"
                        >
                          <Tag size={10} />{(link.categories ?? []).length > 0 ? "编辑" : "设置分类"}
                        </button>
                      </div>
                    )}

                    {/* Refs editor */}
                    {editingRefsUrl === link.url ? (
                      <div className="space-y-2 py-1">
                        <p className="text-xs font-medium text-muted-foreground">选择引用的文章（包含隐藏）</p>
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {allLinks
                            .filter((l) => l.url !== link.url)
                            .map((l) => {
                              const articleTitle = articles.find((a) =>
                                generateIdFromUrl(l.url) === a.id
                              )?.title;
                              const refId = generateIdFromUrl(l.url);
                              const title = articleTitle || l.title || refId;
                              const selected = pendingRefs.includes(refId);
                              return (
                                <button
                                  key={l.url}
                                  onClick={() => setPendingRefs((prev) =>
                                    selected ? prev.filter((id) => id !== refId) : [...prev, refId]
                                  )}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-left transition-all border ${
                                    selected
                                      ? "border-primary/40 bg-primary/5 text-foreground"
                                      : "border-transparent hover:bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {selected ? <Check size={11} className="text-primary shrink-0" /> : <span className="w-[11px] shrink-0" />}
                                  {l.hidden && <Lock size={10} className="text-muted-foreground/60 shrink-0" />}
                                  <span className="truncate">{title}</span>
                                </button>
                              );
                            })}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={async () => {
                              await updateRefs(link.url, pendingRefs);
                              const updated = await getArticleLinks();
                              setLinks(updated);
                              setEditingRefsUrl(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded-full hover:opacity-90"
                          >
                            <Check size={11} />确认
                          </button>
                          <button onClick={() => setEditingRefsUrl(null)} className="text-xs text-muted-foreground hover:text-foreground">取消</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">引用：</span>
                        {(link.refs ?? []).length > 0 ? (
                          (link.refs ?? []).map((refId) => {
                            const t = articles.find((a) => a.id === refId)?.title
                              || allLinks.find((l) => generateIdFromUrl(l.url) === refId)?.title
                              || refId;
                            const isHidden = allLinks.find((l) => generateIdFromUrl(l.url) === refId)?.hidden;
                            return (
                              <span key={refId} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                                {isHidden && <Lock size={9} />}
                                <span className="max-w-[120px] truncate">{t}</span>
                              </span>
                            );
                          })
                        ) : null}
                        <button
                          onClick={() => { setEditingRefsUrl(link.url); setPendingRefs(link.refs ?? []); }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:bg-muted"
                        >
                          <BookMarked size={10} />{(link.refs ?? []).length > 0 ? "编辑" : "设置引用"}
                        </button>
                      </div>
                    )}

                    {/* URL + timestamps */}
                    <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                    <div className="flex gap-4">
                      {link.createdAt && (
                        <p className="text-xs text-muted-foreground/70">
                          创建于 {new Date(link.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                      {link.updatedAt && (
                        <p className="text-xs text-muted-foreground/70">
                          更新于 {new Date(link.updatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={syncingUrl === link.url}
                        onClick={() => handleSyncSingle(link.url)}
                      >
                        <RefreshCw size={13} className={syncingUrl === link.url ? "animate-spin" : ""} />
                        同步
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await toggleHidden(link.url, !link.hidden);
                          setLinks(await getArticleLinks());
                        }}
                      >
                        {link.hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                        {link.hidden ? "显示" : "隐藏"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveLink(link.url)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              )}
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    第 {page} / {totalPages} 页，共 {filtered.length} 篇
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page <= 1}
                      onClick={() => setCurrentPage(page - 1)}
                      className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 text-xs rounded-md border transition-colors ${
                          p === page
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setCurrentPage(page + 1)}
                      className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
              </>
              );
            })()}
          </CardContent>
        </Card>

        {/* ── 分类管理 Dialog ── */}
        <Dialog open={catDialogOpen} onOpenChange={(open) => { setCatDialogOpen(open); if (!open) { setCatFormUrl(null); setCatError(""); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between pr-6">
                <DialogTitle>分类管理</DialogTitle>
                <Button size="sm" variant="outline" onClick={() => { setCatFormUrl("new"); setCatLabel(""); setCatIcon("📁"); setCatColor("gray"); setCatError(""); }}>
                  + 新增分类
                </Button>
              </div>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {/* Add / Edit form */}
              {catFormUrl !== null && (
                <div className="p-3 border rounded-lg space-y-3 bg-muted/40">
                  <p className="text-sm font-medium">{catFormUrl === "new" ? "新增分类" : "编辑分类"}</p>
                  <div>
                    <Label className="text-xs">名称</Label>
                    <Input value={catLabel} onChange={(e) => setCatLabel(e.target.value)} placeholder="分类名称" className="mt-1 h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">图标</Label>
                    <div className="flex flex-wrap gap-1 mt-1 p-2 border rounded-md bg-background max-h-32 overflow-y-auto">
                      {["🤖","⚙️","🎨","🛠️","📐","📝","🚀","💡","🔥","⭐","🌟","💎","🎯","📊","📈","🔬","🧪","🏗️","🌐","💻","📱","🎮","🎵","📚","✏️","🔑","🔒","🌈","🦋","🐉"].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setCatIcon(emoji)}
                          className={`w-8 h-8 flex items-center justify-center rounded text-base transition-all ${catIcon === emoji ? "bg-primary/20 ring-2 ring-primary scale-110" : "hover:bg-muted"}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">颜色</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {COLOR_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          title={opt.label}
                          onClick={() => setCatColor(opt.id)}
                          className={`w-6 h-6 rounded-full ${opt.swatch} ring-offset-1 transition-all ${catColor === opt.id ? "ring-2 ring-foreground scale-110" : "hover:scale-105"}`}
                        />
                      ))}
                    </div>
                    {catLabel && (
                      <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeClass(catColor)}`}>
                        <span>{catIcon}</span><span>{catLabel}</span>
                      </span>
                    )}
                  </div>
                  {catError && (
                    <p className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">{catError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!catLabel.trim() || catSaving}
                      onClick={async () => {
                        if (!catLabel.trim()) return;
                        setCatError("");
                        setCatSaving(true);
                        try {
                          if (catFormUrl === "new") {
                            const slug = catLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
                            const id = (slug || "cat") + "-" + Date.now().toString(36);
                            await addCategory({ id, label: catLabel.trim(), icon: catIcon, color: catColor });
                          } else {
                            await updateCategoryDef(catFormUrl!, { label: catLabel.trim(), icon: catIcon, color: catColor });
                          }
                          setCatFormUrl(null);
                        } catch (e) {
                          setCatError(e instanceof Error ? e.message : "保存失败，请重试");
                        } finally {
                          setCatSaving(false);
                        }
                      }}
                    >
                      {catSaving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      保存
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setCatFormUrl(null); setCatError(""); }}>取消</Button>
                  </div>
                </div>
              )}

              {/* Category list */}
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">暂无分类，点击"新增分类"添加</p>
              ) : (
                <div className="space-y-1.5">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg border">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getBadgeClass(cat.color)}`}>
                        <span>{cat.icon}</span><span>{cat.label}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                          onClick={() => { setCatFormUrl(cat.id); setCatLabel(cat.label); setCatIcon(cat.icon); setCatColor(cat.color); setCatError(""); }}>
                          <Pencil size={12} className="mr-1" />编辑
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={async () => {
                            if (!confirm(`确认删除分类「${cat.label}」？`)) return;
                            await deleteCategory(cat.id);
                          }}>
                          <X size={12} className="mr-1" />删除
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
