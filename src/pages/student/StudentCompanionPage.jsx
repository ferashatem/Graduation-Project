import { useEffect, useState } from "react";
import apiClient from "../../api/apiClient";

const unwrap = (res) => res.data?.data ?? res.data;

// ── API helpers ───────────────────────────────────────────────────────────────
const fetchCompanionDashboard = () =>
  apiClient.get("/companion/dashboard").then(unwrap);

const fetchDueFlashcards = (limit = 20) =>
  apiClient.get("/companion/flashcards/due", { params: { limit } }).then(unwrap);

const generateFlashcards = (dto) =>
  apiClient.post("/companion/flashcards/generate", dto).then(unwrap);

const reviewFlashcard = (cardId, quality) =>
  apiClient.post(`/companion/flashcards/cards/${cardId}/review`, { quality }).then(unwrap);

const fetchInsights = (unreadOnly = false) =>
  apiClient.get("/companion/insights", { params: { unreadOnly } }).then(unwrap);

const acknowledgeInsight = (id) =>
  apiClient.post(`/companion/insights/${id}/acknowledge`).then(unwrap);

const startSession = (dto) =>
  apiClient.post("/companion/sessions/start", dto).then(unwrap);

const completeSession = (sessionId, dto) =>
  apiClient.post(`/companion/sessions/${sessionId}/complete`, dto).then(unwrap);

const fetchSessionHistory = () =>
  apiClient.get("/companion/sessions").then(unwrap);

const fetchCompanionProfile = () =>
  apiClient.get("/companion/profile").then(unwrap);

const patchCompanionProfile = (dto) =>
  apiClient.patch("/companion/profile", dto).then(unwrap);

const fetchAllDecks = () =>
  apiClient.get("/companion/flashcards").then(unwrap);

const fetchDeck = (deckId) =>
  apiClient.get(`/companion/flashcards/${deckId}`).then(unwrap);

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ["Dashboard", "Flashcards", "Study Session", "Insights", "Profile"];

// ── Dashboard Tab ─────────────────────────────────────────────────────────────
function DashboardTab() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetchCompanionDashboard()
      .then(setData)
      .catch(() => setError("Failed to load companion dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <TabLoader label="Loading companion dashboard…" />;
  if (error)   return <TabError message={error} />;

  const profile = data?.profile ?? {};
  const recs    = data?.todayRecommendations ?? [];
  const due     = data?.dueFlashcards ?? [];
  const weekly  = data?.weeklyProgress ?? {};
  const insights = data?.recentInsights ?? [];

  return (
    <div className="space-y-5">
      {/* Profile + streak */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-800">{profile.fullName ?? "Student"}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Learning Style: <span className="font-medium text-slate-600">{profile.learningStyle ?? "—"}</span>
                {profile.goal && <> · Goal: <span className="font-medium text-slate-600">{profile.goal}</span></>}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StatPill label="Total Sessions" value={profile.totalSessions ?? "—"} color="bg-violet-100 text-violet-700" />
                <StatPill label="Streak" value={`${profile.currentStreakDays ?? 0} 🔥`} color="bg-amber-100 text-amber-700" />
                {profile.engagementScore != null && (
                  <StatPill label="Engagement" value={`${profile.engagementScore}/100`} color="bg-blue-100 text-blue-700" />
                )}
              </div>
            </div>
          </div>
          {/* engagement bar */}
          {profile.engagementScore != null && (
            <div className="mt-4">
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${profile.engagementScore}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Due flashcards */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Due Flashcards</p>
            <p className="mt-2 text-3xl font-bold text-slate-800">{due.length}</p>
          </div>
          <p className="text-xs text-slate-400 mt-2">Cards ready for review today</p>
        </div>
      </div>

      {/* Weekly progress */}
      {weekly.dailyActivity?.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Weekly Activity</h3>
          <div className="flex items-end gap-2 h-20">
            {weekly.dailyActivity.map((d, i) => {
              const max = Math.max(...weekly.dailyActivity.map((x) => x.minutes ?? x.sessions ?? 1), 1);
              const val = d.minutes ?? d.sessions ?? 0;
              const pct = max > 0 ? Math.round((val / max) * 100) : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-sm bg-violet-100 overflow-hidden" style={{ height: "60px" }}>
                    <div className="w-full rounded-t-sm bg-violet-500 transition-all" style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400">{d.day ?? d.dayName ?? i}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's recommendations */}
      {recs.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Today's Recommendations</h3>
          <div className="space-y-2">
            {recs.map((r, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-violet-50 px-4 py-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-violet-400 shrink-0" />
                <p className="text-sm text-violet-800">{r.recommendation ?? r.message ?? r}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent insights */}
      {insights.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Recent Insights</h3>
          <div className="space-y-2">
            {insights.slice(0, 4).map((ins, i) => (
              <div key={ins.id ?? i} className="rounded-xl bg-blue-50 px-4 py-3">
                <p className="text-sm font-semibold text-blue-800">{ins.title ?? "Insight"}</p>
                {ins.message && <p className="text-xs text-blue-600 mt-0.5">{ins.message}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak subjects */}
      {profile.weakSubjects?.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Subjects to Focus On</h3>
          <div className="flex flex-wrap gap-2">
            {profile.weakSubjects.map((s, i) => (
              <span key={i} className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                {s.subjectName ?? s.name ?? s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Flashcards Tab ────────────────────────────────────────────────────────────
function FlashcardsTab() {
  const [mode, setMode]         = useState("menu"); // menu | generate | review
  const [dueCards, setDueCards] = useState([]);
  const [deck, setDeck]         = useState([]);
  const [current, setCurrent]   = useState(0);
  const [flipped, setFlipped]   = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [genErr, setGenErr]     = useState("");
  const [loadingDue, setLoadingDue] = useState(true);
  const [form, setForm] = useState({ topicName: "", cardCount: 10, difficulty: "mixed" });

  useEffect(() => {
    fetchDueFlashcards(20)
      .then((d) => setDueCards(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingDue(false));
  }, []);

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.topicName.trim()) return;
    setGenerating(true); setGenErr("");
    try {
      const result = await generateFlashcards({ ...form, cardCount: Number(form.cardCount) });
      const cards = result?.cards ?? result?.flashcards ?? (Array.isArray(result) ? result : []);
      if (cards.length === 0) { setGenErr("No flashcards returned. Try a different topic."); return; }
      setDeck(cards);
      setCurrent(0); setFlipped(false); setDoneCount(0);
      setMode("review");
    } catch {
      setGenErr("Failed to generate flashcards. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const startDueReview = () => {
    if (dueCards.length === 0) return;
    setDeck(dueCards);
    setCurrent(0); setFlipped(false); setDoneCount(0);
    setMode("review");
  };

  const handleRate = async (quality) => {
    const card = deck[current];
    if (card?.id) {
      reviewFlashcard(card.id, quality).catch(() => {});
    }
    const next = current + 1;
    setDoneCount((c) => c + 1);
    if (next >= deck.length) {
      setMode("done");
    } else {
      setCurrent(next);
      setFlipped(false);
    }
  };

  if (mode === "review") {
    const card = deck[current];
    const progress = deck.length > 0 ? Math.round(((current) / deck.length) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Flashcard Review</h2>
          <button type="button" onClick={() => setMode("menu")} className="text-sm text-slate-400 hover:text-slate-600">✕ Exit</button>
        </div>
        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Card {current + 1} of {deck.length}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {/* Card */}
        <div
          className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100 min-h-[200px] flex flex-col items-center justify-center cursor-pointer hover:ring-violet-200 transition"
          onClick={() => setFlipped((f) => !f)}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
            {flipped ? "Answer" : "Question"}
          </p>
          <p className="text-center text-lg font-semibold text-slate-800">
            {flipped ? (card?.back ?? card?.answer ?? card?.backText ?? "—") : (card?.front ?? card?.question ?? card?.frontText ?? "—")}
          </p>
          {!flipped && (
            <p className="mt-4 text-xs text-slate-400">Tap to reveal answer</p>
          )}
        </div>
        {/* Rating buttons */}
        {flipped && (
          <div className="flex gap-3">
            {[
              { label: "Hard", quality: 0, cls: "bg-red-100 text-red-700 hover:bg-red-200" },
              { label: "Medium", quality: 3, cls: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
              { label: "Easy", quality: 4, cls: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
              { label: "Perfect", quality: 5, cls: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
            ].map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => handleRate(r.quality)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${r.cls}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (mode === "done") {
    return (
      <div className="max-w-lg mx-auto text-center space-y-5 py-12">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold text-slate-800">Session Complete!</h2>
        <p className="text-slate-500">{doneCount} cards reviewed.</p>
        <button type="button" onClick={() => setMode("menu")} className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition">
          Back to Flashcards
        </button>
      </div>
    );
  }

  // menu
  return (
    <div className="space-y-5">
      {/* Due cards */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Review Due Cards</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {loadingDue ? "Loading…" : `${dueCards.length} cards ready for review`}
            </p>
          </div>
          <button
            type="button"
            disabled={loadingDue || dueCards.length === 0}
            onClick={startDueReview}
            className="rounded-xl bg-[#0b2c4a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#153a63] disabled:opacity-40 transition"
          >
            Start Review
          </button>
        </div>
      </div>

      {/* Generate */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-800">Generate New Deck with AI</h3>
        </div>
        <form onSubmit={handleGenerate} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Topic *</label>
            <input
              type="text"
              value={form.topicName}
              onChange={(e) => setF("topicName", e.target.value)}
              placeholder="e.g. SQL Joins, Operating Systems Deadlocks"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Card Count</label>
              <select
                value={form.cardCount}
                onChange={(e) => setF("cardCount", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-300"
              >
                {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} cards</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setF("difficulty", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-300"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>
          {genErr && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-700 ring-1 ring-red-200">{genErr}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={generating || !form.topicName.trim()}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition"
            >
              {generating ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating…
                </>
              ) : "Generate Deck"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Study Session Tab ─────────────────────────────────────────────────────────
const SESSION_TYPES = [
  { value: "Quiz", label: "Quiz", desc: "MCQ quiz on a topic" },
  { value: "ActiveRecall", label: "Active Recall", desc: "Open-ended Q&A" },
  { value: "ConceptCheck", label: "Concept Check", desc: "Quick check after explanation" },
  { value: "ExamPrep", label: "Exam Prep", desc: "Practice before exam" },
];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

function StudySessionTab() {
  const [session, setSession]     = useState(null);
  const [mode, setMode]           = useState("form"); // form | active | complete
  const [starting, setStarting]   = useState(false);
  const [err, setErr]             = useState("");
  const [result, setResult]       = useState(null);
  const [form, setForm] = useState({ sessionType: "Quiz", topicName: "", difficulty: "Medium" });
  const [completingData, setCompletingData] = useState({ totalQuestions: 10, correctAnswers: 0, durationMinutes: 0 });
  const [startedAt, setStartedAt] = useState(null);

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleStart = async (e) => {
    e.preventDefault();
    if (!form.topicName.trim()) return;
    setStarting(true); setErr("");
    try {
      const res = await startSession(form);
      setSession(res);
      setStartedAt(Date.now());
      setMode("active");
    } catch {
      setErr("Failed to start session. Try again.");
    } finally {
      setStarting(false);
    }
  };

  const handleComplete = async () => {
    if (!session?.id && !session?.sessionId) return;
    const sid = session.id ?? session.sessionId;
    const duration = startedAt ? Math.round((Date.now() - startedAt) / 60000) : 1;
    try {
      const res = await completeSession(sid, { ...completingData, durationMinutes: duration });
      setResult(res);
      setMode("complete");
    } catch {
      setMode("complete");
      setResult(null);
    }
  };

  if (mode === "complete") {
    const feedback = result?.aiFeedback ?? result?.feedback ?? "";
    const score = result?.correctAnswers ?? completingData.correctAnswers;
    const total = result?.totalQuestions ?? completingData.totalQuestions;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto text-center space-y-5 py-10">
        <div className="text-5xl">{pct >= 80 ? "🎉" : pct >= 60 ? "👍" : "📚"}</div>
        <h2 className="text-xl font-bold text-slate-800">Session Complete!</h2>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Score</span>
            <span className="font-bold text-slate-800">{score}/{total} ({pct}%)</span>
          </div>
          {feedback && (
            <div className="rounded-xl bg-violet-50 px-4 py-3">
              <p className="text-xs font-semibold text-violet-700 mb-1">AI Feedback</p>
              <p className="text-sm text-violet-800">{feedback}</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => { setMode("form"); setSession(null); setResult(null); }}
          className="rounded-xl bg-[#0b2c4a] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#153a63] transition"
        >
          Start New Session
        </button>
      </div>
    );
  }

  if (mode === "active") {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{form.sessionType} Session</h2>
            <p className="text-xs text-slate-400 mt-0.5">Topic: {form.topicName}</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Active</span>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 space-y-4">
          <p className="text-sm text-slate-600">
            Your session is active. Use the AI Assistant to conduct your study session, then come back here to log your results.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Questions Answered</label>
              <input
                type="number" min={0} max={100}
                value={completingData.totalQuestions}
                onChange={(e) => setCompletingData((p) => ({ ...p, totalQuestions: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Correct Answers</label>
              <input
                type="number" min={0} max={completingData.totalQuestions}
                value={completingData.correctAnswers}
                onChange={(e) => setCompletingData((p) => ({ ...p, correctAnswers: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-300"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode("form")}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleComplete}
              className="flex-1 rounded-xl bg-[#0b2c4a] py-2.5 text-sm font-semibold text-white hover:bg-[#153a63] transition"
            >
              Complete Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-800">Start Study Session</h3>
        </div>
        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Topic *</label>
            <input
              type="text"
              value={form.topicName}
              onChange={(e) => setF("topicName", e.target.value)}
              placeholder="e.g. Database Normalization"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Session Type</label>
            <div className="grid grid-cols-2 gap-2">
              {SESSION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setF("sessionType", t.value)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    form.sessionType === t.value
                      ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800">{t.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setF("difficulty", d)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                    form.difficulty === d
                      ? "bg-[#0b2c4a] text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          {err && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-700 ring-1 ring-red-200">{err}</p>}
          <button
            type="submit"
            disabled={starting || !form.topicName.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0b2c4a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#153a63] disabled:opacity-50 transition"
          >
            {starting ? "Starting…" : "Start Session"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Insights Tab ──────────────────────────────────────────────────────────────
const INSIGHT_COLORS = {
  InactivityAlert:      "bg-amber-50 ring-amber-200 text-amber-800",
  ExamApproaching:      "bg-red-50 ring-red-200 text-red-800",
  AssignmentDeadline:   "bg-orange-50 ring-orange-200 text-orange-800",
  StreakMilestone:      "bg-yellow-50 ring-yellow-200 text-yellow-800",
  ImprovementDetected:  "bg-emerald-50 ring-emerald-200 text-emerald-800",
  WeaknessDetected:     "bg-amber-50 ring-amber-200 text-amber-800",
  WeeklyReport:         "bg-blue-50 ring-blue-200 text-blue-800",
  RiskAlert:            "bg-red-50 ring-red-200 text-red-800",
};
const INSIGHT_ICONS = {
  InactivityAlert: "😴", ExamApproaching: "⚡", AssignmentDeadline: "📌",
  StreakMilestone: "🔥", ImprovementDetected: "📈", WeaknessDetected: "⚠️",
  WeeklyReport: "📊", RiskAlert: "🚨",
};

function InsightsTab() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchInsights(unreadOnly)
      .then((d) => setInsights(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [unreadOnly]);

  const handleAcknowledge = (id) => {
    acknowledgeInsight(id).catch(() => {});
    setInsights((prev) => prev.map((ins) => ins.id === id ? { ...ins, isAcknowledged: true } : ins));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">AI Insights</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-slate-500">Unread only</span>
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded"
          />
        </label>
      </div>

      {loading && <TabLoader label="Loading insights…" />}

      {!loading && insights.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
          <p className="text-sm text-slate-400">No insights yet. Keep studying to generate insights!</p>
        </div>
      )}

      {!loading && insights.map((ins, i) => {
        const cls = INSIGHT_COLORS[ins.insightType] ?? "bg-slate-50 ring-slate-200 text-slate-700";
        const icon = INSIGHT_ICONS[ins.insightType] ?? "💡";
        return (
          <div key={ins.id ?? i} className={`rounded-2xl p-4 ring-1 ${cls}`}>
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">{icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{ins.title ?? "Insight"}</p>
                {ins.message && <p className="text-xs mt-0.5 opacity-80">{ins.message}</p>}
                {ins.actionText && (
                  <p className="mt-2 text-xs font-semibold underline cursor-pointer opacity-70">{ins.actionText}</p>
                )}
              </div>
              {!ins.isAcknowledged && ins.id && (
                <button
                  type="button"
                  onClick={() => handleAcknowledge(ins.id)}
                  className="shrink-0 text-[10px] font-semibold opacity-60 hover:opacity-100 underline"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
      {label}: {value}
    </span>
  );
}

function TabLoader({ label }) {
  return (
    <div className="py-12 text-center">
      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      <p className="mt-2 text-xs text-slate-400">{label}</p>
    </div>
  );
}

function TabError({ message }) {
  return (
    <div className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200 text-sm text-red-700">{message}</div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function StudentCompanionPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">AI Companion</h1>
        <p className="text-sm text-slate-400 mt-0.5">Your personalized academic intelligence assistant</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
              activeTab === i
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 0 && <DashboardTab />}
      {activeTab === 1 && <FlashcardsTab />}
      {activeTab === 2 && <StudySessionTab />}
      {activeTab === 3 && <InsightsTab />}
    </div>
  );
}

export default StudentCompanionPage;
