import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleGithubLogin } from "../../server/auth/routes.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  return handleGithubLogin(req, res);
}
