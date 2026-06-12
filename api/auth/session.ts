import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleSession } from "../../server/auth/routes.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  return handleSession(req, res);
}
