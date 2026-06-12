import type { IncomingMessage } from "node:http";
import {
  SESSION_COOKIE_NAME,
  getAuthConfig,
  parseCookies,
  readSessionToken,
  type SessionUser,
} from "./github-oauth";

export function getSessionUser(
  req: Pick<IncomingMessage, "headers">
): SessionUser | null {
  const config = getAuthConfig();
  if (config.authSecret.length < 32) return null;
  const cookies = parseCookies(req.headers.cookie);
  const user = readSessionToken(cookies[SESSION_COOKIE_NAME], config.authSecret);
  return user && config.adminIds.has(user.id) ? user : null;
}

export function isAuthenticatedRequest(
  req: Pick<IncomingMessage, "headers">
): boolean {
  return getSessionUser(req) !== null;
}
