"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft, Check, ChevronRight, Clock3, History, LoaderCircle, LocateFixed,
  LogOut, MapPin, Search, Sparkles, UserPlus, Users, Utensils, X,
} from "lucide-react";

import { shuffle } from "@/lib/candidates";
import { chooseDuel, startDuel, type DuelState } from "@/lib/duel";
import type { AppUser, DecisionHistory, Gender, PlaceCandidate, RegionResult } from "@/lib/types";

type AuthMode = "login" | "signup";
type AppView = "decide" | "history";
type DecisionStep = "participants" | "location" | "duel" | "result";

async function requestApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: options?.body
      ? { "Content-Type": "application/json", ...options.headers }
      : options?.headers,
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "요청을 처리하지 못했습니다.");
  return data;
}

function LoadingScreen() {
  return (
    <main className="center-screen">
      <span className="brand-mark"><Utensils size={28} /></span>
      <LoaderCircle className="spin" aria-label="로그인 상태 확인 중" />
    </main>
  );
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: AppUser) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const currentYear = new Date().getFullYear();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = mode === "login"
      ? { loginId: form.get("loginId"), pin: form.get("pin") }
      : {
          loginId: form.get("loginId"),
          pin: form.get("pin"),
          displayName: form.get("displayName"),
          birthYear: Number(form.get("birthYear")),
          gender: form.get("gender") as Gender,
        };

    try {
      const { user } = await requestApi<{ user: AppUser }>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      onAuthenticated(user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "인증에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <div className="brand-lockup">
          <span className="brand-mark"><Utensils size={24} /></span>
          <span>오늘 뭐 먹지?</span>
        </div>
        <div className="intro-copy">
          <span className="eyebrow"><Sparkles size={15} /> 함께 고르는 한 끼</span>
          <h1>고민은 짧게,<br />선택은 우리답게.</h1>
          <p>함께 먹을 사람과 위치를 정하면 주변 식당을 골라드려요. 둘 중 하나만 고르다 보면 오늘의 메뉴가 결정됩니다.</p>
        </div>
        <div className="intro-steps" aria-label="서비스 진행 순서">
          <span><Users size={18} /> 멤버 모으기</span><ChevronRight size={16} />
          <span><MapPin size={18} /> 주변 찾기</span><ChevronRight size={16} />
          <span><Check size={18} /> 하나 고르기</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="로그인 또는 가입">
            <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => { setMode("login"); setError(""); }}>로그인</button>
            <button type="button" role="tab" aria-selected={mode === "signup"} onClick={() => { setMode("signup"); setError(""); }}>처음이에요</button>
          </div>
          <div className="auth-heading">
            <h2>{mode === "login" ? "다시 만나 반가워요" : "같이 한 끼 시작해요"}</h2>
            <p>{mode === "login" ? "ID와 PIN을 입력해 주세요." : "다음에도 알아볼 수 있게 계정을 만들어요."}</p>
          </div>
          <form onSubmit={submit} className="form-stack">
            <label><span>ID</span><input name="loginId" autoComplete="username" placeholder="영문 소문자, 숫자, 밑줄" minLength={3} maxLength={20} required /></label>
            <label><span>PIN</span><input name="pin" type="password" inputMode="numeric" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="숫자 4~12자리" pattern="[0-9]{4,12}" required /></label>
            {mode === "signup" && (
              <>
                <label><span>표시 이름</span><input name="displayName" autoComplete="name" placeholder="친구들에게 보일 이름" maxLength={30} required /></label>
                <div className="form-row">
                  <label><span>출생연도</span><input name="birthYear" type="number" inputMode="numeric" min={1900} max={currentYear} placeholder="2000" required /></label>
                  <label><span>성별</span><select name="gender" defaultValue="" required><option value="" disabled>선택</option><option value="male">남성</option><option value="female">여성</option><option value="other">기타</option><option value="prefer_not_to_say">응답하지 않음</option></select></label>
                </div>
              </>
            )}
            {error && <p className="message error" role="alert">{error}</p>}
            <button className="primary-button" disabled={busy}>{busy && <LoaderCircle className="spin" size={18} />}{mode === "login" ? "로그인" : "가입하고 시작하기"}</button>
          </form>
          <p className="auth-note">PIN은 복구할 수 없으니 기억해 주세요.</p>
        </div>
      </section>
    </main>
  );
}

function AppHeader({ user, view, onView, onLogout }: { user: AppUser; view: AppView; onView: (view: AppView) => void; onLogout: () => void }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <button className="brand-lockup brand-button" onClick={() => onView("decide")}><span className="brand-mark"><Utensils size={21} /></span><span>오늘 뭐 먹지?</span></button>
        <nav aria-label="주 메뉴">
          <button className={view === "decide" ? "active" : ""} onClick={() => onView("decide")}><Sparkles size={17} /> 오늘 정하기</button>
          <button className={view === "history" ? "active" : ""} onClick={() => onView("history")}><History size={17} /> 지난 선택</button>
        </nav>
        <div className="user-menu">
          <span className="avatar">{user.displayName.slice(0, 1)}</span>
          <span className="user-name"><strong>{user.displayName}</strong><small>@{user.loginId}</small></span>
          <button className="icon-button" onClick={onLogout} aria-label="로그아웃" title="로그아웃"><LogOut size={19} /></button>
        </div>
      </div>
    </header>
  );
}

function Progress({ step }: { step: DecisionStep }) {
  const activeIndex = { participants: 0, location: 1, duel: 2, result: 3 }[step];
  return (
    <ol className="progress" aria-label="결정 진행 단계">
      {["멤버", "위치", "선택"].map((label, index) => (
        <li key={label} className={index <= activeIndex ? "active" : ""}><span>{index < activeIndex ? <Check size={15} /> : index + 1}</span>{label}</li>
      ))}
    </ol>
  );
}

function ParticipantsStep({ currentUser, participants, setParticipants, onNext }: { currentUser: AppUser; participants: AppUser[]; setParticipants: (users: AppUser[]) => void; onNext: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AppUser[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function searchUsers(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setBusy(true); setError("");
    try {
      const data = await requestApi<{ users: AppUser[] }>(`/api/users/search?q=${encodeURIComponent(query)}`);
      setResults(data.users); setSearched(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "사용자를 검색하지 못했습니다.");
    } finally { setBusy(false); }
  }

  function addUser(user: AppUser) {
    if (!participants.some((participant) => participant.id === user.id)) setParticipants([...participants, user]);
  }

  return (
    <section className="workflow-card">
      <div className="section-heading"><span className="section-icon"><Users size={23} /></span><div><p className="eyebrow">STEP 1</p><h1>오늘 누구와 함께하나요?</h1><p>가입한 친구의 ID를 찾아 멤버로 추가해 주세요.</p></div></div>
      <div className="member-list" aria-label="오늘의 참가자">
        {participants.map((participant) => (
          <div className="member-chip" key={participant.id}>
            <span className="avatar small">{participant.displayName.slice(0, 1)}</span>
            <span><strong>{participant.displayName}</strong><small>@{participant.loginId}</small></span>
            {participant.id === currentUser.id ? <em>나</em> : <button aria-label={`${participant.displayName} 제외`} onClick={() => setParticipants(participants.filter((item) => item.id !== participant.id))}><X size={16} /></button>}
          </div>
        ))}
      </div>
      <form className="search-box" onSubmit={searchUsers}><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="친구 ID로 검색" aria-label="친구 ID" /><button disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : "검색"}</button></form>
      {error && <p className="message error" role="alert">{error}</p>}
      {searched && (
        <div className="search-results" aria-live="polite">
          {results.length === 0 ? <p className="empty-inline">일치하는 가입자가 없어요.</p> : results.map((result) => {
            const added = participants.some((participant) => participant.id === result.id);
            return <div className="search-result" key={result.id}><span className="avatar small">{result.displayName.slice(0, 1)}</span><span><strong>{result.displayName}</strong><small>@{result.loginId}</small></span><button type="button" disabled={added} onClick={() => addUser(result)}>{added ? <><Check size={16} /> 추가됨</> : <><UserPlus size={16} /> 추가</>}</button></div>;
          })}
        </div>
      )}
      <div className="card-footer"><p><strong>{participants.length}명</strong>이 함께 골라요</p><button className="primary-button fit" onClick={onNext}>위치 정하기 <ChevronRight size={18} /></button></div>
    </section>
  );
}

function LocationStep({ onBack, onSelect, busy, error }: { onBack: () => void; onSelect: (latitude: number, longitude: number, label: string) => void; busy: boolean; error: string }) {
  const [query, setQuery] = useState("");
  const [regions, setRegions] = useState<RegionResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [searched, setSearched] = useState(false);

  function useCurrentLocation() {
    setLocationError("");
    if (!navigator.geolocation) return setLocationError("이 브라우저에서는 현재 위치를 사용할 수 없어요. 지역을 검색해 주세요.");
    navigator.geolocation.getCurrentPosition(
      (position) => onSelect(position.coords.latitude, position.coords.longitude, "현재 위치"),
      () => setLocationError("위치를 가져오지 못했어요. 아래에서 지역이나 장소를 검색해 주세요."),
      { enableHighAccuracy: true, timeout: 8_000 },
    );
  }

  async function searchRegion(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setSearching(true); setLocationError("");
    try {
      const data = await requestApi<{ regions: RegionResult[] }>(`/api/places/regions?q=${encodeURIComponent(query)}`);
      setRegions(data.regions); setSearched(true);
    } catch (caught) {
      setLocationError(caught instanceof Error ? caught.message : "지역을 검색하지 못했습니다.");
    } finally { setSearching(false); }
  }

  return (
    <section className="workflow-card">
      <button className="back-button" onClick={onBack}><ArrowLeft size={17} /> 멤버 다시 고르기</button>
      <div className="section-heading"><span className="section-icon coral"><MapPin size={23} /></span><div><p className="eyebrow">STEP 2</p><h1>어디에서 먹을까요?</h1><p>기준 위치에서 1km 안의 실제 음식점을 찾아요.</p></div></div>
      <button className="location-button" onClick={useCurrentLocation} disabled={busy}><span><LocateFixed size={23} /></span><span><strong>내 현재 위치 사용하기</strong><small>브라우저 위치 권한이 필요해요</small></span>{busy ? <LoaderCircle className="spin" size={21} /> : <ChevronRight size={21} />}</button>
      <div className="divider"><span>또는 지역·장소 검색</span></div>
      <form className="search-box large" onSubmit={searchRegion}><Search size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: 강남역, 성수동" aria-label="지역 또는 장소" /><button disabled={searching || busy}>{searching ? <LoaderCircle className="spin" size={18} /> : "찾기"}</button></form>
      {(locationError || error) && <p className="message error" role="alert">{locationError || error}</p>}
      {searched && <div className="region-results" aria-live="polite">{regions.length === 0 ? <p className="empty-inline">검색 결과가 없어요. 다른 이름으로 찾아보세요.</p> : regions.map((region) => <button key={region.id} onClick={() => onSelect(region.latitude, region.longitude, region.name)} disabled={busy}><MapPin size={18} /><span><strong>{region.name}</strong><small>{region.address}</small></span><ChevronRight size={18} /></button>)}</div>}
      <p className="privacy-note">위치 정보는 주변 후보를 찾을 때만 사용하며 저장하지 않아요.</p>
    </section>
  );
}

function PlaceCard({ place, onChoose, disabled }: { place: PlaceCandidate; onChoose: () => void; disabled: boolean }) {
  const shortCategory = place.category.split(">").slice(1).map((part) => part.trim()).join(" · ") || "음식점";
  return (
    <button className="place-card" onClick={onChoose} disabled={disabled}>
      <span className="place-illustration"><Utensils size={37} /></span>
      <span className="place-copy"><small className="category">{shortCategory}</small><strong>{place.name}</strong><span><MapPin size={15} /> {place.distanceMeters.toLocaleString()}m · {place.roadAddress || place.address}</span></span>
      <span className="choose-label">이곳으로 선택</span>
    </button>
  );
}

function DuelStep({ state, onChoose, busy, error }: { state: DuelState; onChoose: (place: PlaceCandidate) => void; busy: boolean; error: string }) {
  return (
    <section className="duel-section">
      <div className="duel-heading"><p className="eyebrow">ROUND {state.round} / {state.totalRounds}</p><h1>오늘은 어디가 더 끌리나요?</h1><p>고른 식당이 다음 후보와 계속 대결해요.</p></div>
      <div className="round-bar"><span style={{ width: `${(state.round / state.totalRounds) * 100}%` }} /></div>
      <div className="duel-grid"><PlaceCard place={state.winner} onChoose={() => onChoose(state.winner)} disabled={busy} /><span className="versus">VS</span><PlaceCard place={state.challenger} onChoose={() => onChoose(state.challenger)} disabled={busy} /></div>
      {busy && <p className="message neutral"><LoaderCircle className="spin" size={17} /> 결과를 저장하고 있어요…</p>}
      {error && <p className="message error" role="alert">{error}</p>}
    </section>
  );
}

function ResultStep({ place, participants, locationLabel, onRestart }: { place: PlaceCandidate; participants: AppUser[]; locationLabel: string; onRestart: () => void }) {
  const shortCategory = place.category.split(">").slice(1).map((part) => part.trim()).join(" · ") || "음식점";
  return (
    <section className="result-card">
      <div className="confetti" aria-hidden="true">✦</div><span className="result-badge"><Check size={24} /></span><p className="eyebrow">오늘의 선택</p><h1>{place.name}</h1><p className="result-category">{shortCategory}</p>
      <div className="result-meta"><span><MapPin size={17} /> {locationLabel}에서 {place.distanceMeters.toLocaleString()}m</span><span><Users size={17} /> {participants.map((participant) => participant.displayName).join(", ")}</span></div>
      {place.placeUrl && <a className="secondary-button" href={place.placeUrl} target="_blank" rel="noreferrer">카카오맵에서 보기 <ChevronRight size={17} /></a>}
      <button className="primary-button fit" onClick={onRestart}>새로운 한 끼 정하기 <Sparkles size={17} /></button>
      <p className="saved-note"><Check size={14} /> 선택 결과가 지난 선택에 저장됐어요.</p>
    </section>
  );
}

function HistoryView() {
  const [decisions, setDecisions] = useState<DecisionHistory[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    requestApi<{ decisions: DecisionHistory[] }>("/api/decisions")
      .then((data) => setDecisions(data.decisions))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "이력을 불러오지 못했습니다."))
      .finally(() => setBusy(false));
  }, []);

  return (
    <main className="app-main history-page">
      <div className="page-heading"><p className="eyebrow">MY HISTORY</p><h1>지난 선택</h1><p>함께 고민해서 골랐던 한 끼들을 모았어요.</p></div>
      {busy ? <div className="empty-state"><LoaderCircle className="spin" /><p>지난 선택을 불러오는 중이에요.</p></div>
        : error ? <p className="message error" role="alert">{error}</p>
        : decisions.length === 0 ? <div className="empty-state"><span><History size={30} /></span><h2>아직 지난 선택이 없어요</h2><p>오늘의 첫 식당을 골라보세요.</p></div>
        : <div className="history-list">{decisions.map((decision) => (
          <article className="history-item" key={decision.id}>
            <span className="history-icon"><Utensils size={23} /></span>
            <div className="history-copy"><p><Clock3 size={15} /> {new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeStyle: "short" }).format(new Date(decision.decidedAt))}</p><h2>{decision.place.name}</h2><span>{decision.place.category.split(">").slice(1).map((part) => part.trim()).join(" · ")}</span></div>
            <div className="history-members"><Users size={17} /><span>{decision.participants.map((participant) => participant.displayName).join(", ")}</span></div>
          </article>
        ))}</div>}
    </main>
  );
}

function DecisionFlow({ user }: { user: AppUser }) {
  const [step, setStep] = useState<DecisionStep>("participants");
  const [participants, setParticipants] = useState<AppUser[]>([user]);
  const [duel, setDuel] = useState<DuelState | null>(null);
  const [result, setResult] = useState<PlaceCandidate | null>(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadCandidates(latitude: number, longitude: number, label: string) {
    setBusy(true); setError("");
    try {
      const data = await requestApi<{ candidates: PlaceCandidate[] }>("/api/places/candidates", { method: "POST", body: JSON.stringify({ latitude, longitude, participantIds: participants.map((participant) => participant.id) }) });
      if (data.candidates.length < 2) return setError("주변에 조건에 맞는 곳이 부족합니다. 다른 위치를 선택해 주세요.");
      const nextDuel = startDuel(shuffle(data.candidates));
      if (!nextDuel) return;
      setLocationLabel(label); setDuel(nextDuel); setStep("duel");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "후보를 만들지 못했습니다.");
    } finally { setBusy(false); }
  }

  async function choose(place: PlaceCandidate) {
    if (!duel) return;
    const next = chooseDuel(duel, place);
    if (next.state) return setDuel(next.state);
    if (!next.result) return;
    setBusy(true); setError("");
    try {
      await requestApi("/api/decisions", { method: "POST", body: JSON.stringify({ participantIds: participants.map((participant) => participant.id), place: next.result }) });
      setResult(next.result); setStep("result");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "결과를 저장하지 못했습니다.");
    } finally { setBusy(false); }
  }

  function restart() {
    setParticipants([user]); setDuel(null); setResult(null); setLocationLabel(""); setError(""); setStep("participants");
  }

  return (
    <main className="app-main">
      {step !== "result" && <Progress step={step} />}
      {step === "participants" && <ParticipantsStep currentUser={user} participants={participants} setParticipants={setParticipants} onNext={() => { setError(""); setStep("location"); }} />}
      {step === "location" && <LocationStep onBack={() => setStep("participants")} onSelect={loadCandidates} busy={busy} error={error} />}
      {step === "duel" && duel && <DuelStep state={duel} onChoose={choose} busy={busy} error={error} />}
      {step === "result" && result && <ResultStep place={result} participants={participants} locationLabel={locationLabel} onRestart={restart} />}
    </main>
  );
}

export default function MealApp() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const [view, setView] = useState<AppView>("decide");

  useEffect(() => {
    requestApi<{ user: AppUser }>("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await requestApi("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null); setView("decide");
  }

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthScreen onAuthenticated={setUser} />;
  return <div className="app-shell"><AppHeader user={user} view={view} onView={setView} onLogout={logout} />{view === "decide" ? <DecisionFlow user={user} /> : <HistoryView />}<footer>오늘 뭐 먹지? · 함께 결정하는 가장 가벼운 방법</footer></div>;
}
