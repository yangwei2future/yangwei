import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, LogOut, Loader2, RefreshCw, Pencil, Check, X, EyeOff, Eye } from "lucide-react";
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
  const { articles, refresh, refreshSingle, updateTitle, toggleHidden } = useArticles();
  const [syncing, setSyncing] = useState(false);
  const [syncingUrl, setSyncingUrl] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

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
            <CardTitle>已添加的文章 ({links.length})</CardTitle>
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
            ) : (
              <div className="space-y-3">
                {links.map((link) => (
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
                          link.url.includes(encodeURIComponent(a.id)) || link.url.endsWith(a.id + ".md")
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
