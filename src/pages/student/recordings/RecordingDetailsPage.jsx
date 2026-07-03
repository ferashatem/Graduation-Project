import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  askRecordingAI,
  fetchRecordingDetails,
  fetchRecordingFlashcards,
  fetchRecordingQuiz,
  fetchRecordingSummary,
} from "../../../api/recordingsApi";
import { useRecordingSignalR } from "../../../hooks/useRecordingSignalR";

// ── helpers ───────────────────────────────────────────────────────────────────
function formatDuration(s) {
  if (!s) return "--";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}س ${m}د` : `${m} دقيقة`;
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ar-EG", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const STATUS_META = {
  Uploading:    { text: "جاري الرفع",          color: "text-blue-400",   spin: true  },
  Transcribing: { text: "جاري تحويل الصوت لنص", color: "text-yellow-400", spin: true  },
  Analyzing:    { text: "جاري التحليل بالـ AI", color: "text-yellow-400", spin: true  },
  Completed:    { text: "مكتمل",               color: "text-emerald-400", spin: false },
  Failed:       { text: "فشل",                 color: "text-red-400",    spin: false },
};

const DIFFICULTY_COLORS = {
  Easy: "bg-emerald-500/15 text-emerald-400",
  Medium: "bg-yellow-500/15 text-yellow-400",
  Hard: "bg-red-500/15 text-red-400",
};

// ── shared ui ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="h-8 w-8 rounded-full border-2 border-[#2e86ab] border-t-transparent animate-spin" />
    </div>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-sm text-white/50">{message}</p>
    </div>
  );
}

function ProcessingState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="h-8 w-8 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
      <p className="text-sm text-yellow-400">{label}</p>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ recording }) {
  const meta = STATUS_META[recording.status] ?? STATUS_META.Analyzing;

  return (
    <div className="space-y-5">
      {/* Status banner for in-progress */}
      {meta.spin && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}
        >
          <div className="h-5 w-5 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin shrink-0" />
          <p className="text-sm text-yellow-400">{meta.text}</p>
        </div>
      )}

      {recording.status === "Failed" && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <p className="text-sm font-medium text-red-400 mb-1">فشل المعالجة</p>
          {recording.errorMessage && (
            <p className="text-xs text-red-400/70">{recording.errorMessage}</p>
          )}
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <InfoCard label="اسم الملف" value={recording.originalFileName} icon="🎙️" />
        <InfoCard label="المدة" value={formatDuration(recording.durationSeconds)} icon="⏱" />
        <InfoCard label="تاريخ الرفع" value={formatDate(recording.createdAt)} icon="📅" />
        {recording.fileSize && (
          <InfoCard
            label="الحجم"
            value={`${(recording.fileSize / (1024 * 1024)).toFixed(1)} MB`}
            icon="💾"
          />
        )}
        {recording.transcriptChars ? (
          <InfoCard
            label="أحرف النص"
            value={recording.transcriptChars.toLocaleString()}
            icon="📄"
          />
        ) : null}
        {recording.processedAt && (
          <InfoCard label="اكتمل في" value={formatDate(recording.processedAt)} icon="✅" />
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <p className="text-lg mb-1">{icon}</p>
      <p className="text-xs text-white/40 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-white break-all">{value || "—"}</p>
    </div>
  );
}

// ── Transcript Tab ────────────────────────────────────────────────────────────
function TranscriptTab({ recordingId, status, summary }) {
  if (status !== "Completed")
    return <ProcessingState label="سيتاح النص عند اكتمال المعالجة..." />;

  // Show timeline from summary as a navigation aid, transcript text not yet exposed via API
  if (!summary)
    return <EmptyState icon="📄" message="جاري تحميل بيانات النص..." />;

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl px-4 py-3 text-sm text-white/50"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        📌 النص الكامل يُعرض هنا عبر الجدول الزمني. الـ API سيوفر النص الكامل قريباً.
      </div>

      {summary.timeline?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">الجدول الزمني</p>
          {summary.timeline.map((seg, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer hover:bg-white/5 transition"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                style={{ background: "rgba(46,134,171,0.15)", color: "#2e86ab" }}
              >
                {fmtTime(seg.start)}
              </span>
              <p className="text-sm text-white/80">{seg.title}</p>
              <span className="mr-auto text-xs text-white/30">{fmtTime(seg.end)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Summary Tab ───────────────────────────────────────────────────────────────
function SummaryTab({ recordingId, status }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "Completed") { setLoading(false); return; }
    fetchRecordingSummary(recordingId)
      .then(setData)
      .catch(() => setError("تعذّر تحميل الملخص."))
      .finally(() => setLoading(false));
  }, [recordingId, status]);

  if (status !== "Completed")
    return <ProcessingState label="الملخص سيكون جاهزاً بعد اكتمال المعالجة..." />;
  if (loading) return <Spinner />;
  if (error)
    return <EmptyState icon="⚠️" message={error} />;
  if (!data)
    return <EmptyState icon="📊" message="لم يتم إنشاء الملخص بعد — جاري المعالجة" />;

  return (
    <div className="space-y-6">
      {/* Summary paragraph */}
      {data.summary && (
        <div
          className="rounded-xl p-5"
          style={{ background: "rgba(46,134,171,0.08)", border: "1px solid rgba(46,134,171,0.2)" }}
        >
          <p className="text-xs font-semibold text-[#2e86ab] mb-2 uppercase tracking-wider">الملخص</p>
          <p className="text-sm text-white/80 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Key concepts */}
      {data.keyConcepts?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">المفاهيم الرئيسية</p>
          <div className="flex flex-wrap gap-2">
            {data.keyConcepts.map((c) => (
              <span
                key={c}
                className="rounded-lg px-3 py-1 text-xs font-medium text-white/80"
                style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {data.timeline?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">الجدول الزمني</p>
          <div className="space-y-2">
            {data.timeline.map((seg, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                  style={{ background: "rgba(46,134,171,0.15)", color: "#2e86ab" }}
                >
                  {fmtTime(seg.start)}
                </span>
                <p className="text-sm text-white/80 flex-1">{seg.title}</p>
                <span className="text-xs text-white/30 font-mono">{fmtTime(seg.end)}</span>
              </div>
            ))}
          </div>
          {/* Visual timeline bar */}
          {data.timeline.length > 1 && (
            <div className="mt-3 h-2 rounded-full flex overflow-hidden gap-0.5">
              {data.timeline.map((seg, i) => {
                const total = data.timeline[data.timeline.length - 1].end || 1;
                const width = ((seg.end - seg.start) / total) * 100;
                const colors = ["#2e86ab", "#7c3aed", "#059669", "#d97706", "#ef4444"];
                return (
                  <div
                    key={i}
                    style={{ width: `${width}%`, background: colors[i % colors.length] }}
                    title={seg.title}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Suggested questions */}
      {data.suggestedQuestions?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            أسئلة مقترحة للمراجعة
          </p>
          <div className="space-y-2">
            {data.suggestedQuestions.map((q, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-sm text-white/80">{q.question}</p>
                {q.difficulty && (
                  <span
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium ${
                      DIFFICULTY_COLORS[q.difficulty] ?? "bg-white/10 text-white/60"
                    }`}
                  >
                    {q.difficulty}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Flashcards Tab ────────────────────────────────────────────────────────────
function FlashcardsTab({ recordingId, status }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [order, setOrder] = useState([]);

  useEffect(() => {
    if (status !== "Completed") { setLoading(false); return; }
    fetchRecordingFlashcards(recordingId)
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setCards(arr);
        setOrder(arr.map((_, i) => i));
      })
      .catch(() => setError("تعذّر تحميل الفلاشكاردز."))
      .finally(() => setLoading(false));
  }, [recordingId, status]);

  function shuffle() {
    setOrder((prev) => [...prev].sort(() => Math.random() - 0.5));
    setIndex(0);
    setFlipped(false);
  }

  if (status !== "Completed")
    return <ProcessingState label="الفلاشكاردز ستكون جاهزة بعد اكتمال المعالجة..." />;
  if (loading) return <Spinner />;
  if (error) return <EmptyState icon="⚠️" message={error} />;
  if (cards.length === 0) return <EmptyState icon="🃏" message="لا توجد فلاشكاردز بعد" />;

  const card = cards[order[index]];

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Progress */}
      <p className="text-xs text-white/40">
        {index + 1} / {cards.length}
      </p>

      {/* Card */}
      <div
        onClick={() => setFlipped((f) => !f)}
        className="relative w-full max-w-md cursor-pointer select-none"
        style={{ perspective: "1000px", height: "220px" }}
      >
        <div
          className="absolute inset-0 transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 text-center"
            style={{
              backfaceVisibility: "hidden",
              background: "#0d1b2a",
              border: "1px solid rgba(46,134,171,0.3)",
            }}
          >
            <p className="text-xs text-[#2e86ab] mb-3 font-semibold uppercase tracking-wider">
              السؤال
            </p>
            <p className="text-sm text-white font-medium leading-relaxed">{card.front}</p>
            <p className="text-xs text-white/30 mt-4">اضغط للإجابة</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 text-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "#0d1b2a",
              border: "1px solid rgba(5,150,105,0.4)",
            }}
          >
            <p className="text-xs text-emerald-400 mb-3 font-semibold uppercase tracking-wider">
              الإجابة
            </p>
            <p className="text-sm text-white/90 leading-relaxed">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setIndex((i) => Math.max(0, i - 1)); setFlipped(false); }}
          disabled={index === 0}
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/60 hover:text-white transition disabled:opacity-30"
          style={{ border: "1px solid rgba(255,255,255,0.12)" }}
        >
          السابق
        </button>
        <button
          onClick={shuffle}
          className="rounded-xl px-4 py-2.5 text-sm font-medium transition"
          style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa" }}
        >
          🔀 خلط
        </button>
        <button
          onClick={() => { setIndex((i) => Math.min(cards.length - 1, i + 1)); setFlipped(false); }}
          disabled={index === cards.length - 1}
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/60 hover:text-white transition disabled:opacity-30"
          style={{ border: "1px solid rgba(255,255,255,0.12)" }}
        >
          التالي
        </button>
      </div>
    </div>
  );
}

// ── Quiz Tab ──────────────────────────────────────────────────────────────────
function QuizTab({ recordingId, status }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (status !== "Completed") { setLoading(false); return; }
    fetchRecordingQuiz(recordingId)
      .then((list) => setQuestions(Array.isArray(list) ? list : []))
      .catch(() => setError("تعذّر تحميل الكويز."))
      .finally(() => setLoading(false));
  }, [recordingId, status]);

  if (status !== "Completed")
    return <ProcessingState label="الكويز سيكون جاهزاً بعد اكتمال المعالجة..." />;
  if (loading) return <Spinner />;
  if (error) return <EmptyState icon="⚠️" message={error} />;
  if (questions.length === 0) return <EmptyState icon="📝" message="لا توجد أسئلة بعد" />;

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="text-5xl">{pct >= 70 ? "🎉" : "📚"}</p>
        <p className="text-2xl font-bold text-white">{score} / {questions.length}</p>
        <p className="text-sm text-white/50">{pct}% إجابات صحيحة</p>
        <button
          onClick={() => { setQIndex(0); setSelected(null); setSubmitted(false); setScore(0); setFinished(false); }}
          className="mt-4 rounded-xl px-6 py-2.5 text-sm font-bold text-white"
          style={{ background: "#2e86ab" }}
        >
          إعادة الكويز
        </button>
      </div>
    );
  }

  const q = questions[qIndex];
  const options = [
    { key: "A", label: q.optionA },
    { key: "B", label: q.optionB },
    { key: "C", label: q.optionC },
    { key: "D", label: q.optionD },
  ].filter((o) => o.label);

  function handleSubmit() {
    if (!selected) return;
    const correct = selected === q.correctAnswer;
    if (correct) setScore((s) => s + 1);
    setSubmitted(true);
  }

  function handleNext() {
    if (qIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setQIndex((i) => i + 1);
      setSelected(null);
      setSubmitted(false);
    }
  }

  function optionStyle(key) {
    if (!submitted) {
      return selected === key
        ? { background: "rgba(46,134,171,0.2)", border: "1px solid #2e86ab", color: "#fff" }
        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" };
    }
    if (key === q.correctAnswer)
      return { background: "rgba(5,150,105,0.15)", border: "1px solid rgba(5,150,105,0.4)", color: "#34d399" };
    if (key === selected)
      return { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" };
    return { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" };
  }

  return (
    <div className="space-y-5 max-w-xl">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-white/40">
        <span>سؤال {qIndex + 1} من {questions.length}</span>
        <span>الدرجة: {score}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${((qIndex) / questions.length) * 100}%`, background: "#2e86ab" }}
        />
      </div>

      {/* Question */}
      <div
        className="rounded-xl px-5 py-4"
        style={{ background: "rgba(46,134,171,0.08)", border: "1px solid rgba(46,134,171,0.2)" }}
      >
        <p className="text-sm font-medium text-white leading-relaxed">{q.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => !submitted && setSelected(opt.key)}
            className="w-full text-right rounded-xl px-4 py-3 text-sm font-medium transition"
            style={optionStyle(opt.key)}
          >
            <span className="font-bold ml-2">{opt.key}.</span> {opt.label}
          </button>
        ))}
      </div>

      {/* Explanation */}
      {submitted && q.explanation && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)" }}
        >
          <p className="text-xs font-semibold text-emerald-400 mb-1">الشرح</p>
          <p className="text-sm text-white/70">{q.explanation}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-40"
            style={{ background: "#2e86ab" }}
          >
            تحقق
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white"
            style={{ background: "#2e86ab" }}
          >
            {qIndex + 1 >= questions.length ? "عرض النتيجة" : "السؤال التالي →"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Ask AI Tab ────────────────────────────────────────────────────────────────
function AskAITab({ recordingId, status }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await askRecordingAI(recordingId, text);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: res?.answer ?? "لم أتمكن من الإجابة." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "حدث خطأ. حاول مجدداً.", isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (status !== "Completed")
    return <ProcessingState label="سيتاح الاستفسار بعد اكتمال المعالجة..." />;

  return (
    <div className="flex flex-col" style={{ height: "480px" }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <p className="text-3xl">💬</p>
            <p className="text-sm text-white/40">اسأل أي سؤال عن محتوى المحاضرة</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={
                msg.role === "user"
                  ? { background: "#2e86ab", color: "#fff" }
                  : {
                      background: msg.isError
                        ? "rgba(239,68,68,0.1)"
                        : "rgba(255,255,255,0.05)",
                      border: `1px solid ${msg.isError ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
                      color: msg.isError ? "#f87171" : "rgba(255,255,255,0.85)",
                    }
              }
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((d) => (
                  <div
                    key={d}
                    className="h-2 w-2 rounded-full bg-white/40 animate-bounce"
                    style={{ animationDelay: `${d * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex gap-2 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="اسأل عن محتوى المحاضرة..."
          className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          dir="rtl"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-40"
          style={{ background: "#2e86ab" }}
        >
          إرسال
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",    label: "نظرة عامة",  icon: "📋" },
  { id: "transcript",  label: "النص",        icon: "📄" },
  { id: "summary",     label: "الملخص",      icon: "📊" },
  { id: "flashcards",  label: "فلاشكاردز",   icon: "🃏" },
  { id: "quiz",        label: "كويز",         icon: "📝" },
  { id: "ask",         label: "اسأل AI",      icon: "💬" },
];

export default function RecordingDetailsPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(state?.initialTab ?? "overview");
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summaryCache, setSummaryCache] = useState(null);

  const loadRecording = useCallback(() => {
    setLoading(true);
    fetchRecordingDetails(id)
      .then(setRecording)
      .catch(() => setError("تعذّر تحميل التسجيل."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadRecording();
  }, [loadRecording]);

  // Pre-fetch summary for transcript timeline usage
  useEffect(() => {
    if (recording?.status === "Completed" && !summaryCache) {
      fetchRecordingSummary(id)
        .then(setSummaryCache)
        .catch(() => {});
    }
  }, [recording?.status, id, summaryCache]);

  // Real-time status updates
  useRecordingSignalR({
    onStatusChanged: ({ recordingId, status, error: errMsg }) => {
      if (recordingId !== id) return;
      setRecording((prev) =>
        prev ? { ...prev, status, errorMessage: errMsg ?? prev.errorMessage } : prev
      );
    },
  });

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 rounded-full border-2 border-[#2e86ab] border-t-transparent animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="py-20 text-center">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <button
          onClick={() => navigate("/student/recordings")}
          className="text-sm text-[#2e86ab] underline"
        >
          العودة للتسجيلات
        </button>
      </div>
    );

  const meta = STATUS_META[recording?.status] ?? STATUS_META.Analyzing;

  return (
    <div className="space-y-5" dir="rtl">
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/student/companion")}
          className="rounded-xl p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          →
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold text-gray-900 truncate">
            {recording?.originalFileName ?? "التسجيل"}
          </h1>
          <span className={`text-xs ${meta.color} flex items-center gap-1`}>
            {meta.spin && (
              <span className="inline-block h-3 w-3 rounded-full border border-current border-t-transparent animate-spin" />
            )}
            {meta.text}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 overflow-x-auto rounded-xl p-1"
        style={{ background: "rgba(0,0,0,0.06)", scrollbarWidth: "none" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-[#2e86ab] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "#0d1b2a", border: "1px solid rgba(255,255,255,0.08)", minHeight: "300px" }}
      >
        {activeTab === "overview"   && <OverviewTab recording={recording} />}
        {activeTab === "transcript" && (
          <TranscriptTab recordingId={id} status={recording?.status} summary={summaryCache} />
        )}
        {activeTab === "summary"    && <SummaryTab recordingId={id} status={recording?.status} />}
        {activeTab === "flashcards" && <FlashcardsTab recordingId={id} status={recording?.status} />}
        {activeTab === "quiz"       && <QuizTab recordingId={id} status={recording?.status} />}
        {activeTab === "ask"        && <AskAITab recordingId={id} status={recording?.status} />}
      </div>
    </div>
  );
}
