import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleLogout } from "../../server/auth/routes.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  return handleLogout(req, res);
}
