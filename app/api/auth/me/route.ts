import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  return user ? Response.json({ user }) : apiError("로그인이 필요합니다.", 401);
}
