import { apiError } from "@/lib/api";
import { getCurrentUser, normalizeLoginId, toAppUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return apiError("로그인이 필요합니다.", 401);

  const query = normalizeLoginId(new URL(request.url).searchParams.get("q") ?? "");
  if (!/^[a-z0-9_]{1,20}$/.test(query)) {
    return Response.json({ users: [] });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("app_users")
    .select("id, login_id, display_name, birth_year, gender")
    .ilike("login_id", `${query}%`)
    .neq("id", currentUser.id)
    .order("login_id")
    .limit(8);

  if (error) return apiError("사용자를 검색하지 못했습니다.", 500);
  return Response.json({ users: (data ?? []).map(toAppUser) });
}
