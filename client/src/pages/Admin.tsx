import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, LogOut, Loader2 } from "lucide-react";
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

export default function Admin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthState] = useState(isAuthenticated());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [links, setLinks] = useState<ArticleLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      await addArticleLink(newUrl.trim());
      const updated = await getArticleLinks();
      setLinks(updated);
      setNewUrl("");
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
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            退出
          </Button>
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
                  <div key={link.url} className="flex items-center justify-between p-3 border rounded-sm">
                    <p className="text-sm font-medium truncate flex-1 min-w-0">{link.url}</p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="ml-3 shrink-0"
                      onClick={() => handleRemoveLink(link.url)}
                    >
                      删除
                    </Button>
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
