import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiBookOpen, HiClock, HiLightningBolt, HiPlus,
  HiRefresh, HiTrash, HiX, HiDocumentText, HiCheckCircle, HiUpload,
} from "react-icons/hi";
import apiClient from "../../api/apiClient";
import {
  fetchMyExams, createExam, generateAiExam, updateExam,
  deleteExam, autoGradeExam, previewQuestionsFromPdf,
} from "../../api/examsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

// ── Constants ─────────────────────────────────────────────────────────────────
const EXAM_TYPES   = ["Quiz", "Midterm", "Final"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const TYPE_MAP   = { Quiz: 0, Midterm: 1, Final: 2 };
const STATUS_MAP = { Draft: 0, Published: 1, Closed: 2 };
const Q_TYPES      = [
  { label: "MCQ",        value: 0 },
  { label: "True/False", value: 1 },
  { label: "Essay",      value: 2 },
];

const STATUS_COLORS = {
  Draft:     "bg-amber-100 text-amber-700",
  Published: "bg-emerald-100 text-emerald-700",
  Closed:    "bg-slate-100 text-slate-500",
};

const fmtDate = (s) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleString(); } catch { return s; }
};

const uid = () => crypto.randomUUID();

const emptyMcqQuestion = () => ({
  _id: uid(), questionText: "", questionType: 0,
  options: ["", "", "", ""], correctAnswer: "", mark: 5,
});
const emptyTfQuestion = () => ({
  _id: uid(), questionText: "", questionType: 1,
  options: ["True", "False"], correctAnswer: "", mark: 5,
});
const emptyEssayQuestion = () => ({
  _id: uid(), questionText: "", questionType: 2,
  options: [], correctAnswer: "", mark: 10,
});

// ── QuestionEditor ────────────────────────────────────────────────────────────
function QuestionEditor({ q, idx, onChange, onRemove }) {
  const setField = (k, v) => onChange({ ...q, [k]: v });
  const setOption = (i, v) => {
    const opts = [...q.options]; opts[i] = v;
    onChange({ ...q, options: opts });
  };
  const switchType = (type) => {
    const t = Number(type);
    if (t === 1) onChange({ ...q, questionType: 1, options: ["True", "False"], correctAnswer: "" });
    else if (t === 2) onChange({ ...q, questionType: 2, options: [], correctAnswer: "" });
    else onChange({ ...q, questionType: 0, options: ["", "", "", ""], correctAnswer: "" });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Q{idx + 1}</span>
        <div className="flex items-center gap-2">
          <select value={q.questionType} onChange={(e) => switchType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none">
            {Q_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input type="number" min="1" value={q.mark}
            onChange={(e) => setField("mark", Number(e.target.value))}
            className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-center outline-none"
            title="Marks" />
          <button type="button" onClick={onRemove}
            className="rounded-xl p-1.5 text-red-400 hover:bg-red-50">
            <HiTrash className="h-4 w-4" />
          </button>
        </div>
      </div>

      <textarea rows={2} placeholder="Question text…" value={q.questionText}
        onChange={(e) => setField("questionText", e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none resize-none" required />

      {/* MCQ options */}
      {q.questionType === 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {q.options.map((opt, i) => (
            <label key={i} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 cursor-pointer">
              <input type="radio" name={`correct-${q._id}`}
                checked={q.correctAnswer === opt && opt !== ""}
                onChange={() => setField("correctAnswer", opt)}
                className="accent-[#0b2c4a]" />
              <input type="text" placeholder={`Option ${i + 1}`} value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-700 outline-none" />
            </label>
          ))}
        </div>
      )}

      {/* True/False */}
      {q.questionType === 1 && (
        <div className="flex gap-4">
          {["True", "False"].map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name={`correct-${q._id}`}
                checked={q.correctAnswer === opt}
                onChange={() => setField("correctAnswer", opt)}
                className="accent-[#0b2c4a]" />
              <span className="text-sm text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* Essay — no options, no correct answer */}
      {q.questionType === 2 && (
        <p className="text-xs text-slate-400 italic">Essay — graded manually by the doctor.</p>
      )}

      {q.questionType !== 2 && !q.correctAnswer && (
        <p className="text-xs text-amber-600">Select the correct answer.</p>
      )}
    </div>
  );
}

// ── CreateExamDrawer ──────────────────────────────────────────────────────────
function CreateExamDrawer({ open, onClose, onCreated, offerings }) {
  const [mode, setMode] = useState("structured"); // "structured" | "ai"
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  // Structured form
  const [form, setForm] = useState({
    title: "", type: "Quiz", subjectOfferingId: "",
    startTime: "", endTime: "", isRandomized: false, questionsPerStudent: 0,
    questions: [emptyMcqQuestion()],
  });

  // AI form
  const [aiForm, setAiForm] = useState({
    subjectOfferingId: "", difficulty: "Medium", questionCount: 10,
    examType: "Quiz", topics: "", isRandomized: false, questionsPerStudent: 5,
  });

  // PDF form
  const [pdfForm, setPdfForm] = useState({
    file: null, questionCount: 10, difficulty: "Medium", examType: "Final",
  });
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setMode("structured");
    setForm({
      title: "", type: "Quiz", subjectOfferingId: "",
      startTime: "", endTime: "", isRandomized: false, questionsPerStudent: 0,
      questions: [emptyMcqQuestion()],
    });
    setAiForm({
      subjectOfferingId: "", difficulty: "Medium", questionCount: 10,
      examType: "Quiz", topics: "", isRandomized: false, questionsPerStudent: 5,
    });
    setPdfForm({ file: null, questionCount: 10, difficulty: "Medium", examType: "Final" });
    setPdfProgress(0);
    setPdfGenerating(false);
  }, [open]);

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setAi = (k, v) => setAiForm((p) => ({ ...p, [k]: v }));

  const addQuestion = (type) => {
    const q = type === 1 ? emptyTfQuestion() : type === 2 ? emptyEssayQuestion() : emptyMcqQuestion();
    setForm((p) => ({ ...p, questions: [...p.questions, q] }));
    setTimeout(() => scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 50);
  };
  const updateQuestion = (idx, q) =>
    setForm((p) => { const qs = [...p.questions]; qs[idx] = q; return { ...p, questions: qs }; });
  const removeQuestion = (idx) =>
    setForm((p) => ({ ...p, questions: p.questions.filter((_, i) => i !== idx) }));

  const handleStructuredSave = async (status) => {
    setError("");
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.startTime || !form.endTime) return setError("Start and end time are required.");
    if (form.questions.length === 0) return setError("Add at least one question.");
    for (const q of form.questions) {
      if (!q.questionText.trim()) return setError("All questions need text.");
      if (q.questionType !== 2 && !q.correctAnswer) return setError("All non-essay questions need a correct answer.");
    }
    setSaving(true);
    try {
      const payload = {
        ...(form.subjectOfferingId ? { subjectOfferingId: form.subjectOfferingId } : {}),
        title: form.title.trim(),
        type: TYPE_MAP[form.type] ?? 0,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        status: STATUS_MAP[status] ?? 0,
        isRandomized: form.isRandomized,
        questionsPerStudent: form.isRandomized ? Number(form.questionsPerStudent) : 0,
        questions: form.questions.map((q) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.questionType === 2 ? null : (q.options ?? []),
          correctAnswer: q.correctAnswer ?? "",
          mark: q.mark ?? 5,
        })),
      };
      const created = await createExam(payload);
      onCreated(created);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    setError("");
    if (!aiForm.subjectOfferingId) return setError("Select a subject offering.");
    setSaving(true);
    try {
      const topics = aiForm.topics.split(",").map((t) => t.trim()).filter(Boolean);
      const payload = {
        subjectOfferingId: aiForm.subjectOfferingId,
        difficulty: aiForm.difficulty,
        questionCount: Number(aiForm.questionCount),
        examType: aiForm.examType,
        topics,
        isRandomized: aiForm.isRandomized,
        questionsPerStudent: aiForm.isRandomized ? Number(aiForm.questionsPerStudent) : 0,
      };
      const created = await generateAiExam(payload);
      onCreated(created);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePdfGenerate = async () => {
    setError("");
    if (!pdfForm.file) return setError("Select a PDF file.");
    setPdfGenerating(true); setPdfProgress(0);
    try {
      const questions = await previewQuestionsFromPdf(
        {
          file: pdfForm.file,
          questionCount: Number(pdfForm.questionCount),
          difficulty: pdfForm.difficulty,
          examType: pdfForm.examType,
        },
        setPdfProgress,
      );
      if (!questions.length) { setError("No questions returned. Try a different PDF."); return; }
      // Map API response → internal question format and switch to structured tab
      const mapped = questions.map((q) => ({
        _id: uid(),
        questionText: q.questionText ?? q.text ?? "",
        questionType: q.questionType ?? 0,
        options: q.options ?? (q.questionType === 1 ? ["True", "False"] : ["", "", "", ""]),
        correctAnswer: q.correctAnswer ?? "",
        mark: q.mark ?? q.marks ?? 5,
      }));
      setForm((prev) => ({ ...prev, questions: mapped, type: pdfForm.examType }));
      setMode("structured");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPdfGenerating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Create Exam</h2>
          <button type="button" onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <HiX className="h-5 w-5" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-slate-100 px-6">
          {[
            { key: "structured", label: "Structured",  icon: <HiDocumentText className="h-4 w-4" /> },
            { key: "ai",         label: "AI Generate", icon: <HiLightningBolt className="h-4 w-4" /> },
            { key: "pdf",        label: "From PDF",    icon: <HiUpload className="h-4 w-4" /> },
          ].map(({ key, label, icon }) => (
            <button key={key} type="button" onClick={() => setMode(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
                mode === key ? "border-[#0b2c4a] text-[#0b2c4a]" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}>
              {icon}{label}
            </button>
          ))}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── Structured mode ── */}
          {mode === "structured" && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Title *</label>
                  <input value={form.title} onChange={(e) => setF("title", e.target.value)}
                    placeholder="e.g. Midterm Exam"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300" required />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setF("type", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
                    {EXAM_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Subject Offering</label>
                  <select value={form.subjectOfferingId} onChange={(e) => setF("subjectOfferingId", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
                    <option value="">— None —</option>
                    {offerings.map((o) => (
                      <option key={o.id} value={o.id}>{o.subjectName ?? o.name ?? o.id}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Start Time *</label>
                  <input type="datetime-local" value={form.startTime}
                    onChange={(e) => setF("startTime", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">End Time *</label>
                  <input type="datetime-local" value={form.endTime}
                    onChange={(e) => setF("endTime", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                </div>

                <div className="sm:col-span-2 flex items-center gap-3">
                  <input type="checkbox" id="randomized" checked={form.isRandomized}
                    onChange={(e) => setF("isRandomized", e.target.checked)}
                    className="accent-[#0b2c4a] w-4 h-4" />
                  <label htmlFor="randomized" className="text-sm text-slate-700 font-medium cursor-pointer">
                    Randomized (each student gets a subset)
                  </label>
                  {form.isRandomized && (
                    <input type="number" min="1" value={form.questionsPerStudent}
                      onChange={(e) => setF("questionsPerStudent", e.target.value)}
                      placeholder="# per student"
                      className="ml-2 w-28 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none" />
                  )}
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Questions ({form.questions.length})</p>
                  <div className="flex gap-2">
                    {[0, 1, 2].map((t) => (
                      <button key={t} type="button" onClick={() => addQuestion(t)}
                        className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                        + {Q_TYPES[t].label}
                      </button>
                    ))}
                  </div>
                </div>
                {form.questions.map((q, i) => (
                  <QuestionEditor key={q._id} q={q} idx={i}
                    onChange={(u) => updateQuestion(i, u)}
                    onRemove={() => removeQuestion(i)} />
                ))}
              </div>
            </>
          )}

          {/* ── AI mode ── */}
          {mode === "ai" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-dashed border-[#0b2c4a]/30 bg-[#0b2c4a]/5 p-4">
                <p className="text-sm font-semibold text-[#0b2c4a] flex items-center gap-2">
                  <HiLightningBolt /> AI will generate questions automatically
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  The exam will be created as a Draft — review and publish when ready.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Subject Offering *</label>
                <select value={aiForm.subjectOfferingId} onChange={(e) => setAi("subjectOfferingId", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
                  <option value="">— Select offering —</option>
                  {offerings.map((o) => (
                    <option key={o.id} value={o.id}>{o.subjectName ?? o.name ?? o.id}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Exam Type</label>
                  <select value={aiForm.examType} onChange={(e) => setAi("examType", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
                    {EXAM_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Difficulty</label>
                  <select value={aiForm.difficulty} onChange={(e) => setAi("difficulty", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
                    {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Question Count</label>
                  <input type="number" min="1" max="50" value={aiForm.questionCount}
                    onChange={(e) => setAi("questionCount", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Per Student (if random)</label>
                  <input type="number" min="1" value={aiForm.questionsPerStudent}
                    onChange={(e) => setAi("questionsPerStudent", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Topics (comma-separated)</label>
                <input value={aiForm.topics} onChange={(e) => setAi("topics", e.target.value)}
                  placeholder="e.g. Sorting, Arrays, Recursion"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="ai-rand" checked={aiForm.isRandomized}
                  onChange={(e) => setAi("isRandomized", e.target.checked)}
                  className="accent-[#0b2c4a] w-4 h-4" />
                <label htmlFor="ai-rand" className="text-sm text-slate-700 font-medium cursor-pointer">
                  Randomize questions per student
                </label>
              </div>
            </div>
          )}

          {/* ── PDF mode ── */}
          {mode === "pdf" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                  <HiUpload /> Upload a lecture PDF → AI extracts questions
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Questions are previewed in the form so you can review and edit before publishing.
                </p>
              </div>

              {/* File picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">PDF File *</label>
                <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 transition ${
                  pdfForm.file ? "border-[#0b2c4a] bg-[#0b2c4a]/5" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}>
                  <HiDocumentText className={`h-8 w-8 ${pdfForm.file ? "text-[#0b2c4a]" : "text-slate-300"}`} />
                  <span className="text-sm font-medium text-slate-600">
                    {pdfForm.file ? pdfForm.file.name : "Click to select PDF"}
                  </span>
                  {pdfForm.file && (
                    <span className="text-xs text-slate-400">{(pdfForm.file.size / 1024 / 1024).toFixed(2)} MB</span>
                  )}
                  <input type="file" accept="application/pdf" className="hidden"
                    onChange={(e) => setPdfForm((p) => ({ ...p, file: e.target.files[0] ?? null }))} />
                </label>
              </div>

              {/* Options */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Questions</label>
                  <input type="number" min="1" max="50" value={pdfForm.questionCount}
                    onChange={(e) => setPdfForm((p) => ({ ...p, questionCount: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Difficulty</label>
                  <select value={pdfForm.difficulty}
                    onChange={(e) => setPdfForm((p) => ({ ...p, difficulty: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
                    {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Exam Type</label>
                  <select value={pdfForm.examType}
                    onChange={(e) => setPdfForm((p) => ({ ...p, examType: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
                    {EXAM_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Progress */}
              {pdfGenerating && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Extracting questions from PDF…</span>
                    <span>{pdfProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#0b2c4a] transition-all duration-300"
                      style={{ width: `${pdfProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onClose} disabled={saving}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          {mode === "structured" ? (
            <>
              <button type="button" disabled={saving} onClick={() => handleStructuredSave("Draft")}
                className="rounded-xl border border-[#0b2c4a] px-5 py-2.5 text-sm font-semibold text-[#0b2c4a] hover:bg-slate-50 disabled:opacity-50">
                {saving ? "Saving…" : "Save Draft"}
              </button>
              <button type="button" disabled={saving} onClick={() => handleStructuredSave("Published")}
                className="rounded-xl bg-[#0b2c4a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#153a63] disabled:opacity-50">
                {saving ? "Publishing…" : "Publish Now"}
              </button>
            </>
          ) : mode === "ai" ? (
            <button type="button" disabled={saving} onClick={handleAiGenerate}
              className="flex items-center gap-2 rounded-xl bg-[#0b2c4a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#153a63] disabled:opacity-50">
              {saving ? (
                <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg> Generating…</>
              ) : (
                <><HiLightningBolt className="h-4 w-4" /> Generate with AI</>
              )}
            </button>
          ) : (
            <button type="button" disabled={pdfGenerating || !pdfForm.file} onClick={handlePdfGenerate}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {pdfGenerating ? (
                <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg> Extracting…</>
              ) : (
                <><HiLightningBolt className="h-4 w-4" /> Generate Questions</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ExamCard ──────────────────────────────────────────────────────────────────
function ExamCard({ exam, onDelete, onRefresh }) {
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState("");
  const code = exam.code;

  const changeStatus = async (status) => {
    setBusy(true); setError("");
    try {
      await updateExam(code, {
        title: exam.title,
        type: exam.type,
        startTime: exam.startTime,
        endTime: exam.endTime,
        status: STATUS_MAP[status] ?? exam.status,
      });
      onRefresh();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  };

  const handleAutoGrade = async () => {
    if (!window.confirm("Auto-grade all MCQ/True-False submissions?")) return;
    setBusy(true); setError("");
    try {
      await autoGradeExam(exam.id);
      onRefresh();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete exam "${exam.title}"?`)) return;
    console.log("exam object:", exam);
    console.log("code being sent:", code);
    setBusy(true);
    try { await onDelete(code); }
    finally { setBusy(false); }
  };

  const status = exam.status ?? "Draft";
  const totalMarks = exam.totalMarks ?? exam.questions?.reduce((s, q) => s + (q.mark ?? 0), 0) ?? 0;

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-800">{exam.title}</h3>
          {exam.subjectName && (
            <p className="text-xs text-slate-500 mt-0.5">{exam.subjectName}</p>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[status] ?? STATUS_COLORS.Draft}`}>
          {status}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          {exam.type ?? "—"}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          {exam.questions?.length ?? 0} questions
        </span>
        {totalMarks > 0 && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{totalMarks} marks</span>
        )}
        {exam.mode && (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-600">{exam.mode}</span>
        )}
        {exam.isRandomized && (
          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-purple-600">
            Randomized ({exam.questionsPerStudent}/student)
          </span>
        )}
      </div>

      {(exam.startTime || exam.endTime) && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <HiClock className="h-3.5 w-3.5" />
          {fmtDate(exam.startTime)} → {fmtDate(exam.endTime)}
        </div>
      )}

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Link to={`/prof/exams/${exam.id}/results`}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          Submissions
        </Link>

        {status === "Draft" && (
          <button type="button" disabled={busy} onClick={() => changeStatus("Published")}
            className="rounded-xl border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
            Publish
          </button>
        )}
        {status === "Published" && (
          <>
            <button type="button" disabled={busy} onClick={() => changeStatus("Closed")}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              Close
            </button>
            <button type="button" disabled={busy} onClick={() => changeStatus("Draft")}
              className="rounded-xl border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50">
              Unpublish
            </button>
          </>
        )}
        {status === "Closed" && (
          <button type="button" disabled={busy} onClick={handleAutoGrade}
            className="flex items-center gap-1 rounded-xl border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
            <HiCheckCircle className="h-3.5 w-3.5" /> Auto-Grade
          </button>
        )}

        <button type="button" disabled={busy} onClick={handleDelete}
          className="rounded-xl border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50">
          {busy ? "…" : <><HiTrash className="inline h-3.5 w-3.5 mr-1" />Delete</>}
        </button>
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function ProfessorExamsPage() {
  const [exams,      setExams]      = useState([]);
  const [offerings,  setOfferings]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await fetchMyExams();
      setExams(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load doctor offerings for the create form
  useEffect(() => {
    apiClient.get("/subjectofferings/my-offerings")
      .then((res) => {
        const p = res.data?.data ?? res.data;
        setOfferings(Array.isArray(p) ? p : p?.items ?? []);
      })
      .catch(() => setOfferings([]));
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const handleCreated = useCallback((exam) => {
    setExams((prev) => [exam, ...prev]);
  }, []);

  const handleDelete = useCallback(async (code) => {
    await deleteExam(code);
    setExams((prev) => prev.filter((e) => e.code !== code));
  }, []);

  const sorted = useMemo(
    () => [...exams].sort((a, b) => new Date(b.startTime ?? 0) - new Date(a.startTime ?? 0)),
    [exams]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0b2c4a]">My Exams</h1>
          <p className="text-sm text-slate-500">Create and manage exams for your students.</p>
        </div>
        <button type="button" onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-[#0b2c4a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#153a63]">
          <HiPlus className="h-4 w-4" /> Create Exam
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          <span className="flex-1">{error}</span>
          <button onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold hover:bg-red-100">
            <HiRefresh className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading exams…</div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          <HiBookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          No exams yet. Create your first exam!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((exam) => (
            <ExamCard key={exam.id ?? exam.code} exam={exam}
              onDelete={handleDelete}
              onRefresh={() => setRefreshKey((k) => k + 1)} />
          ))}
        </div>
      )}

      <CreateExamDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={handleCreated}
        offerings={offerings}
      />
    </div>
  );
}

export default ProfessorExamsPage;
