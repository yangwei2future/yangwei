import type { IncomingMessage, ServerResponse } from "node:http";
import {
  OAUTH_COOKIE_NAME,
  OAUTH_TTL_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  assertAuthConfig,
  buildAuthorizationUrl,
  createOAuthTransaction,
  createSessionToken,
  decryptOAuthTransaction,
  encryptOAuthTransaction,
  exchangeCodeForGithubUser,
  getAuthConfig,
  isAdminGithubId,
  isSecureCookie,
  parseCookies,
  readSessionToken,
  safeEqual,
  serializeCookie,
  toSessionUser,
} from "./github-oauth";

type HeaderValue = string | string[] | undefined;

export interface AuthRequest {
  method?: string;
  url?: string;
  headers: Record<string, HeaderValue>;
  query?: Record<string, string | string[] | undefined>;
}

export interface AuthResponse {
  status(code: number): AuthResponse;
  json(value: unknown): void;
  redirect(status: number, url: string): void;
  setHeader(name: string, value: string | string[]): void;
  end(value?: string): void;
}

function firstHeader(value: HeaderValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function queryValue(req: AuthRequest, name: string): string | undefined {
  const direct = req.query?.[name];
  if (Array.isArray(direct)) return direct[0];
  if (direct) return direct;
  const parsed = new URL(req.url || "/", "http://localhost");
  return parsed.searchParams.get(name) || undefined;
}

function requestOrigin(req: AuthRequest): string {
  const configured = process.env.GITHUB_OAUTH_REDIRECT_URI?.trim();
  if (configured) return new URL(configured).origin;
  const protocol =
    firstHeader(req.headers["x-forwarded-proto"]) ||
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const host =
    firstHeader(req.headers["x-forwarded-host"]) ||
    firstHeader(req.headers.host) ||
    "localhost:3000";
  return `${protocol.split(",")[0]}://${host.split(",")[0]}`;
}

function redirectUri(req: AuthRequest): string {
  return (
    process.env.GITHUB_OAUTH_REDIRECT_URI?.trim() ||
    `${requestOrigin(req)}/api/auth/github/callback`
  );
}

function errorRedirect(req: AuthRequest, code: string): string {
  const url = new URL("/admin", requestOrigin(req));
  url.searchParams.set("auth_error", code);
  return url.toString();
}

export async function handleGithubLogin(
  req: AuthRequest,
  res: AuthResponse
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).end("Method Not Allowed");
    return;
  }
  try {
    const config = getAuthConfig();
    assertAuthConfig(config);
    const { transaction, codeChallenge } = createOAuthTransaction(
      redirectUri(req)
    );
    res.setHeader(
      "Set-Cookie",
      serializeCookie(
        OAUTH_COOKIE_NAME,
        encryptOAuthTransaction(transaction, config.authSecret),
        {
          maxAge: OAUTH_TTL_SECONDS,
          path: "/api/auth/github/callback",
          secure: isSecureCookie(),
        }
      )
    );
    res.redirect(
      302,
      buildAuthorizationUrl(config, transaction, codeChallenge)
    );
  } catch (error) {
    console.error("[Auth] Unable to start GitHub login:", error);
    res.redirect(302, errorRedirect(req, "configuration"));
  }
}

export async function handleGithubCallback(
  req: AuthRequest,
  res: AuthResponse
): Promise<void> {
  const secure = isSecureCookie();
  res.setHeader(
    "Set-Cookie",
    serializeCookie(OAUTH_COOKIE_NAME, "", {
      maxAge: 0,
      path: "/api/auth/github/callback",
      secure,
    })
  );
  if (req.method !== "GET") {
    res.status(405).end("Method Not Allowed");
    return;
  }

  const code = queryValue(req, "code");
  const state = queryValue(req, "state");
  if (!code || !state || queryValue(req, "error")) {
    res.redirect(302, errorRedirect(req, "denied"));
    return;
  }

  try {
    const config = getAuthConfig();
    assertAuthConfig(config);
    const cookies = parseCookies(firstHeader(req.headers.cookie));
    const transaction = decryptOAuthTransaction(
      cookies[OAUTH_COOKIE_NAME],
      config.authSecret
    );
    if (!transaction || !safeEqual(transaction.state, state)) {
      res.redirect(302, errorRedirect(req, "invalid_state"));
      return;
    }

    const githubUser = await exchangeCodeForGithubUser({
      code,
      codeVerifier: transaction.codeVerifier,
      redirectUri: transaction.redirectUri,
      config,
    });
    if (!isAdminGithubId(githubUser.id, config.adminIds)) {
      res.redirect(302, errorRedirect(req, "not_authorized"));
      return;
    }

    const sessionUser = toSessionUser(githubUser);
    res.setHeader("Set-Cookie", [
      serializeCookie(OAUTH_COOKIE_NAME, "", {
        maxAge: 0,
        path: "/api/auth/github/callback",
        secure,
      }),
      serializeCookie(
        SESSION_COOKIE_NAME,
        createSessionToken(sessionUser, config.authSecret),
        {
          maxAge: SESSION_TTL_SECONDS,
          path: "/",
          secure,
        }
      ),
    ]);
    res.redirect(302, `${requestOrigin(req)}/admin`);
  } catch (error) {
    console.error("[Auth] GitHub callback failed:", error);
    res.redirect(302, errorRedirect(req, "callback_failed"));
  }
}

export async function handleSession(
  req: AuthRequest,
  res: AuthResponse
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).end("Method Not Allowed");
    return;
  }
  const config = getAuthConfig();
  const cookies = parseCookies(firstHeader(req.headers.cookie));
  const user =
    config.authSecret.length >= 32
      ? readSessionToken(cookies[SESSION_COOKIE_NAME], config.authSecret)
      : null;
  const authorizedUser = user && config.adminIds.has(user.id) ? user : null;
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    authenticated: Boolean(authorizedUser),
    user: authorizedUser,
  });
}

export async function handleLogout(
  req: AuthRequest,
  res: AuthResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).end("Method Not Allowed");
    return;
  }
  res.setHeader(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE_NAME, "", {
      maxAge: 0,
      path: "/",
      secure: isSecureCookie(),
    })
  );
  res.status(200).json({ ok: true });
}

export function createNodeAuthResponse(res: ServerResponse): AuthResponse {
  let statusCode = 200;
  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      res.writeHead(statusCode, { "Content-Type": "application/json" });
      res.end(JSON.stringify(value));
    },
    redirect(status, url) {
      res.writeHead(status, { Location: url });
      res.end();
    },
    setHeader(name, value) {
      res.setHeader(name, value);
    },
    end(value) {
      res.writeHead(statusCode);
      res.end(value);
    },
  };
}

export function toAuthRequest(req: IncomingMessage): AuthRequest {
  return {
    method: req.method,
    url: req.url,
    headers: req.headers,
  };
}
