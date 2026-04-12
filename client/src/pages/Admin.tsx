import { useState } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, LogOut, RefreshCw } from "lucide-react";
import {
  verifyPassword,
  isAuthenticated,
  setAuthenticated,
  logout,
  getArticleLinks,
  addArticleLink,
  removeArticleLink,
} from "@/lib/article-links";

/**
 * Admin Page - Article Links Manager
 *
 * Password protected (default: 123456)
 * Manage GitHub Markdown article links
 */

export default function Admin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthState] = useState(isAuthenticated());
  const [error, setError] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [links, setLinks] = useState(getArticleLinks());
  const [success, setSuccess] = useState("");
  const [refreshing, setRefreshing] = useState(false);

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

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newUrl.trim()) {
      setError("请输入链接地址");
      return;
    }

    // Validate URL format
    if (!isValidGitHubUrl(newUrl)) {
      setError("请输入有效的 GitHub Markdown 链接（如：https://github.com/user/repo/blob/main/article.md）");
      return;
    }

    try {
      const updatedLinks = addArticleLink(newUrl.trim());
      setLinks(updatedLinks);
      setNewUrl("");
      setSuccess("文章链接添加成功！");
    } catch (err) {
      setError(err instanceof Error ? err.message : "添加失败");
    }
  };

  const handleRemoveLink = (url: string) => {
    const updatedLinks = removeArticleLink(url);
    setLinks(updatedLinks);
    setSuccess("文章链接已删除");
  };

  const handleRefreshArticles = () => {
    setRefreshing(true);
    setSuccess("已清除缓存，下次加载文章时会从 GitHub 拉取最新内容");

    // Clear article cache by triggering a page reload
    setTimeout(() => {
      setRefreshing(false);
      window.location.href = "/articles";
    }, 1000);
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
                <Button type="submit" className="w-full">
                  登录
                </Button>
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefreshArticles} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? '刷新中...' : '刷新文章'}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              退出
            </Button>
          </div>
        </div>

        {/* Add new link */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>添加文章链接</CardTitle>
            <p className="text-sm text-muted-foreground">
              输入 GitHub Markdown 文件的链接地址（如：https://github.com/user/repo/blob/main/article.md）
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddLink} className="space-y-4">
              <div>
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://github.com/username/repo/blob/branch/path/to/article.md"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <Button type="submit">添加文章</Button>
            </form>
          </CardContent>
        </Card>

        {/* Article links list */}
        <Card>
          <CardHeader>
            <CardTitle>已添加的文章 ({links.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>暂无文章链接</p>
                <p className="text-sm mt-2">请添加 GitHub Markdown 链接来发布文章</p>
              </div>
            ) : (
              <div className="space-y-3">
                {links.map((link) => (
                  <div
                    key={link.url}
                    className="flex items-center justify-between p-3 border rounded-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{link.url}</p>
                      <p className="text-xs text-muted-foreground">
                        添加时间：{new Date(link.addedAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
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