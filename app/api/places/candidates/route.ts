import { apiError, readJson } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { selectCandidates } from "@/lib/candidates";
import { searchNearbyRestaurants } from "@/lib/kakao";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type CandidateBody = {
  latitude?: number;
  longitude?: number;
  participantIds?: number[];
};

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return apiError("로그인이 필요합니다.", 401);

  const body = await readJson<CandidateBody>(request);
  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);
  const participantIds = [...new Set((body?.participantIds ?? []).map(Number))];

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return apiError("기준 위치의 위도를 확인해 주세요.");
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return apiError("기준 위치의 경도를 확인해 주세요.");
  }
  if (!participantIds.includes(currentUser.id)) {
    return apiError("세션 진행자는 참가자에 포함되어야 합니다.");
  }

  const supabase = getSupabaseAdmin();
  const { data: participants, error: participantError } = await supabase
    .from("app_users")
    .select("id")
    .in("id", participantIds);
  if (participantError || participants?.length !== participantIds.length) {
    return apiError("참가자 정보를 확인해 주세요.");
  }

  const { data: participationRows, error: participationError } = await supabase
    .from("meal_decision_participants")
    .select("decision_id")
    .in("user_id", participantIds);
  if (participationError) return apiError("최근 방문 이력을 확인하지 못했습니다.", 500);

  const decisionIds = [
    ...new Set((participationRows ?? []).map((row) => Number(row.decision_id))),
  ];
  const recentPlaceIds = new Set<string>();

  if (decisionIds.length > 0) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: decisions, error: decisionError } = await supabase
      .from("meal_decisions")
      .select("place_id")
      .in("id", decisionIds)
      .gte("decided_at", since);
    if (decisionError) return apiError("최근 방문 이력을 확인하지 못했습니다.", 500);
    for (const decision of decisions ?? []) recentPlaceIds.add(decision.place_id);
  }

  try {
    const places = await searchNearbyRestaurants(latitude, longitude);
    const candidates = selectCandidates(places, recentPlaceIds);
    return Response.json({ candidates });
  } catch (error) {
    console.error("음식점 후보 조회 실패", error);
    return apiError("주변 음식점을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.", 502);
  }
}
