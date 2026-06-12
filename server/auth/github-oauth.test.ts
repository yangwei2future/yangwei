import { afterEach, describe, expect, it, vi } from "vitest";
import {
  OAUTH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  createOAuthTransaction,
  createSessionToken,
  decryptOAuthTransaction,
  encryptOAuthTransaction,
  exchangeCodeForGithubUser,
  isAdminGithubId,
  parseCookies,
  readSessionToken,
  type AuthConfig,
  type SessionUser,
} from "./github-oauth.js";
import { handleGithubCallback, type AuthResponse } from "./routes.js";

const secret = "test-secret-that-is-at-least-32-characters-long";
const config: AuthConfig = {
  clientId: "client-id",
  clientSecret: "client-secret",
  authSecret: secret,
  adminIds: new Set(["123"]),
};

function responseRecorder() {
  const result: {
    status: number;
    headers: Record<string, string | string[]>;
    redirect?: string;
    body?: unknown;
  } = { status: 200, headers: {} };
  const response: AuthResponse = {
    status(code) {
      result.status = code;
      return this;
    },
    json(value) {
      result.body = value;
    },
    redirect(status, url) {
      result.status = status;
      result.redirect = url;
    },
    setHeader(name, value) {
      result.headers[name] = value;
    },
    end(value) {
      result.body = value;
    },
  };
  return { result, response };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("GitHub OAuth state and PKCE transaction", () => {
  it("round-trips an encrypted, unexpired transaction", () => {
    const { transaction } = createOAuthTransaction(
      "http://localhost:3000/api/auth/github/callback",
      1_000
    );
    const value = encryptOAuthTransaction(transaction, secret);

    expect(decryptOAuthTransaction(value, secret, 2_000)).toEqual(transaction);
    expect(
      decryptOAuthTransaction(`${value}tampered`, secret, 2_000)
    ).toBeNull();
  });

  it("rejects expired transactions", () => {
    const { transaction } = createOAuthTransaction(
      "http://localhost:3000/api/auth/github/callback",
      1_000
    );
    const value = encryptOAuthTransaction(transaction, secret);

    expect(
      decryptOAuthTransaction(value, secret, transaction.expiresAt)
    ).toBeNull();
  });

  it("rejects a callback when state does not match", async () => {
    vi.stubEnv("GITHUB_OAUTH_CLIENT_ID", config.clientId);
    vi.stubEnv("GITHUB_OAUTH_CLIENT_SECRET", config.clientSecret);
    vi.stubEnv("AUTH_SECRET", config.authSecret);
    vi.stubEnv("GITHUB_ADMIN_IDS", "123");
    const { transaction } = createOAuthTransaction(
      "http://localhost:3000/api/auth/github/callback"
    );
    const cookie = encryptOAuthTransaction(transaction, secret);
    const { result, response } = responseRecorder();

    await handleGithubCallback(
      {
        method: "GET",
        url: "/api/auth/github/callback?code=code&state=wrong",
        headers: {
          host: "localhost:3000",
          cookie: `${OAUTH_COOKIE_NAME}=${encodeURIComponent(cookie)}`,
        },
      },
      response
    );

    expect(result.redirect).toContain("auth_error=invalid_state");
  });
});

describe("GitHub identity exchange and binding", () => {
  it("fails when GitHub does not return an access token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "bad_verification_code" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(
      exchangeCodeForGithubUser(
        {
          code: "bad-code",
          codeVerifier: "verifier",
          redirectUri: "http://localhost/callback",
          config,
        },
        fetchMock
      )
    ).rejects.toThrow("access token");
  });

  it("revalidates the GitHub user and binds by stable numeric ID", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "temporary-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 123,
            login: "renamed-login",
            name: "Blog Owner",
            avatar_url: "https://avatars.example/123",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      );

    const user = await exchangeCodeForGithubUser(
      {
        code: "valid-code",
        codeVerifier: "verifier",
        redirectUri: "http://localhost/callback",
        config,
      },
      fetchMock
    );

    expect(user.id).toBe(123);
    expect(isAdminGithubId(user.id, config.adminIds)).toBe(true);
    expect(isAdminGithubId(456, config.adminIds)).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("blog sessions", () => {
  const user: SessionUser = {
    id: "123",
    login: "owner",
    name: "Owner",
    avatarUrl: "https://avatars.example/123",
  };

  it("rotates the session token on repeated login", () => {
    const first = createSessionToken(user, secret, 1_000);
    const second = createSessionToken(user, secret, 1_000);

    expect(first).not.toBe(second);
    expect(readSessionToken(first, secret, 2_000)).toEqual(user);
    expect(readSessionToken(second, secret, 2_000)).toEqual(user);
  });

  it("rejects tampered or expired sessions", () => {
    const token = createSessionToken(user, secret, 1_000);
    expect(readSessionToken(`${token}x`, secret, 2_000)).toBeNull();
    expect(readSessionToken(token, secret, Number.MAX_SAFE_INTEGER)).toBeNull();
  });

  it("parses OAuth and session cookies independently", () => {
    expect(
      parseCookies(
        `${OAUTH_COOKIE_NAME}=oauth-value; ${SESSION_COOKIE_NAME}=session-value`
      )
    ).toEqual({
      [OAUTH_COOKIE_NAME]: "oauth-value",
      [SESSION_COOKIE_NAME]: "session-value",
    });
  });
});
