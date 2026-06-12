import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const OAUTH_COOKIE_NAME = "blog_github_oauth";
export const SESSION_COOKIE_NAME = "blog_session";
export const OAUTH_TTL_SECONDS = 10 * 60;
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
}

export interface SessionUser {
  id: string;
  login: string;
  name: string;
  avatarUrl: string;
}

interface OAuthTransaction {
  state: string;
  codeVerifier: string;
  redirectUri: string;
  expiresAt: number;
}

interface SessionPayload {
  sessionId: string;
  user: SessionUser;
  expiresAt: number;
}

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  authSecret: string;
  adminIds: Set<string>;
}

export function getAuthConfig(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): AuthConfig {
  const clientId = env.GITHUB_OAUTH_CLIENT_ID?.trim() || "";
  const clientSecret = env.GITHUB_OAUTH_CLIENT_SECRET?.trim() || "";
  const authSecret = env.AUTH_SECRET?.trim() || "";
  const adminIds = new Set(
    (env.GITHUB_ADMIN_IDS || "")
      .split(",")
      .map(id => id.trim())
      .filter(Boolean)
  );

  return { clientId, clientSecret, authSecret, adminIds };
}

export function assertAuthConfig(config: AuthConfig): void {
  if (!config.clientId || !config.clientSecret) {
    throw new Error("GitHub OAuth client credentials are not configured");
  }
  if (config.authSecret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters");
  }
  if (config.adminIds.size === 0) {
    throw new Error("GITHUB_ADMIN_IDS is not configured");
  }
}

function base64Url(input: Buffer): string {
  return input.toString("base64url");
}

function secretKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

export function createPkcePair(): {
  codeVerifier: string;
  codeChallenge: string;
} {
  const codeVerifier = base64Url(randomBytes(32));
  const codeChallenge = base64Url(
    createHash("sha256").update(codeVerifier).digest()
  );
  return { codeVerifier, codeChallenge };
}

export function createOAuthTransaction(
  redirectUri: string,
  now = Date.now()
): {
  transaction: OAuthTransaction;
  codeChallenge: string;
} {
  const state = base64Url(randomBytes(32));
  const { codeVerifier, codeChallenge } = createPkcePair();
  return {
    transaction: {
      state,
      codeVerifier,
      redirectUri,
      expiresAt: now + OAUTH_TTL_SECONDS * 1000,
    },
    codeChallenge,
  };
}

export function encryptOAuthTransaction(
  transaction: OAuthTransaction,
  secret: string
): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(transaction), "utf8"),
    cipher.final(),
  ]);
  return [
    base64Url(iv),
    base64Url(encrypted),
    base64Url(cipher.getAuthTag()),
  ].join(".");
}

export function decryptOAuthTransaction(
  value: string | undefined,
  secret: string,
  now = Date.now()
): OAuthTransaction | null {
  if (!value) return null;
  try {
    const [ivValue, encryptedValue, tagValue] = value.split(".");
    if (!ivValue || !encryptedValue || !tagValue) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      secretKey(secret),
      Buffer.from(ivValue, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]);
    const transaction = JSON.parse(
      decrypted.toString("utf8")
    ) as OAuthTransaction;
    if (
      !transaction.state ||
      !transaction.codeVerifier ||
      !transaction.redirectUri ||
      transaction.expiresAt <= now
    ) {
      return null;
    }
    return transaction;
  } catch {
    return null;
  }
}

export function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function createSessionToken(
  user: SessionUser,
  secret: string,
  now = Date.now()
): string {
  const payload = base64Url(
    Buffer.from(
      JSON.stringify({
        sessionId: base64Url(randomBytes(24)),
        user,
        expiresAt: now + SESSION_TTL_SECONDS * 1000,
      } satisfies SessionPayload)
    )
  );
  const signature = base64Url(
    createHmac("sha256", secret).update(payload).digest()
  );
  return `${payload}.${signature}`;
}

export function readSessionToken(
  value: string | undefined,
  secret: string,
  now = Date.now()
): SessionUser | null {
  if (!value) return null;
  try {
    const [payload, signature] = value.split(".");
    if (!payload || !signature) return null;
    const expected = base64Url(
      createHmac("sha256", secret).update(payload).digest()
    );
    if (!safeEqual(signature, expected)) return null;
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as SessionPayload;
    if (!parsed.user?.id || parsed.expiresAt <= now) return null;
    return parsed.user;
  } catch {
    return null;
  }
}

export function parseCookies(
  header: string | undefined
): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").flatMap(part => {
      const separator = part.indexOf("=");
      if (separator < 0) return [];
      const name = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();
      try {
        return [[name, decodeURIComponent(value)]];
      } catch {
        return [[name, value]];
      }
    })
  );
}

export function serializeCookie(
  name: string,
  value: string,
  options: {
    maxAge: number;
    path?: string;
    secure?: boolean;
  }
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${Math.max(0, Math.floor(options.maxAge))}`,
    `Path=${options.path || "/"}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

export function isSecureCookie(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): boolean {
  return env.AUTH_COOKIE_SECURE === "true" || env.NODE_ENV === "production";
}

export function buildAuthorizationUrl(
  config: AuthConfig,
  transaction: OAuthTransaction,
  codeChallenge: string
): string {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", transaction.redirectUri);
  url.searchParams.set("state", transaction.state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export function isAdminGithubId(
  githubId: number | string,
  adminIds: Set<string>
): boolean {
  return adminIds.has(String(githubId));
}

export async function exchangeCodeForGithubUser(
  input: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
    config: AuthConfig;
  },
  fetchImpl: typeof fetch = fetch
): Promise<GithubUser> {
  const tokenResponse = await fetchImpl(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "personal-blog",
      },
      body: JSON.stringify({
        client_id: input.config.clientId,
        client_secret: input.config.clientSecret,
        code: input.code,
        redirect_uri: input.redirectUri,
        code_verifier: input.codeVerifier,
      }),
      signal: AbortSignal.timeout(10_000),
    }
  );
  if (!tokenResponse.ok) {
    throw new Error(`GitHub token exchange failed (${tokenResponse.status})`);
  }
  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    error?: string;
  };
  if (!tokenData.access_token || tokenData.error) {
    throw new Error("GitHub did not return an access token");
  }

  const userResponse = await fetchImpl("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "personal-blog",
      "X-GitHub-Api-Version": "2026-03-10",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!userResponse.ok) {
    throw new Error(`GitHub user request failed (${userResponse.status})`);
  }
  const user = (await userResponse.json()) as GithubUser;
  if (!Number.isSafeInteger(user.id) || !user.login) {
    throw new Error("GitHub returned an invalid user");
  }
  return user;
}

export function toSessionUser(user: GithubUser): SessionUser {
  return {
    id: String(user.id),
    login: user.login,
    name: user.name || user.login,
    avatarUrl: user.avatar_url,
  };
}
