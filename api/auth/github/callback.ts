import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleGithubCallback } from "../../../server/auth/routes";

export default function handler(req: VercelRequest, res: VercelResponse) {
  return handleGithubCallback(req, res);
}
