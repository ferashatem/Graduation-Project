import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  collection, deleteDoc, doc, getDocs, onSnapshot,
  query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from "firebase/firestore";
import { HiBookOpen, HiPencil, HiPlus, HiTrash, HiX, HiChevronDown, HiChevronUp } from "react-icons/hi";
import { db } from "../../firebase/firebaseConfig";

// ─── helpers ──────────────────────────────────────────────────────────────────
const uid = () => crypto.randomUUID();
const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return d.toLocaleString();
};

const emptyQuestion = () => ({
  id: uid(),
  text: "",
  type: "mcq",
  options: ["", "", "", ""],
  correctAnswer: "",
  points: 1,
});

const emptyForm = () => ({
  title: "",
  description: "",
  collegeId: "",
  yearId: "",
  departmentId: "",
  startTime: "",
  durationMinutes: 30,
  questions: [emptyQuestion()],
});

// ─── QuestionRow ──────────────────────────────────────────────────────────────
function QuestionRow({ q, idx, onChange, onRemove }) {
  const isTF = q.type === "truefalse";
  const options = isTF ? ["True", "False"] : q.options;

  const set = (field, val) => onChange({ ...q, [field]: val });
  const setOption = (i, val) => {
    const next = [...q.options];
    next[i] = val;
    onChange({ ...q, options: next, correctAnswer: q.correctAnswer === q.options[i] ? val : q.correctAnswer });
  };
  const switchType = (t) => {
    onChange({
      ...q,
      type: t,
      options: t === "truefalse" ? ["True", "False"] : ["", "", "", ""],
      correctAnswer: "",
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Q{idx + 1}</span>
        <div className="flex items-center gap-2">
          <select
            value={q.type}
            onChange={(e) => switchType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="mcq">MCQ</option>
            <option value="truefalse">True / False</option>
          </select>
          <input
            type="number"
            min="1"
            value={q.points}
            onChange={(e) => set("points", Number(e.target.value))}
            className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-center outline-none"
            title="Points"
          />
          <button type="button" onClick={onRemove} className="rounded-xl p-1.5 text-red-400 hover:bg-red-50">
            <HiTrash className="h-4 w-4" />
          </button>
        </div>
      </div>
      <input
        type="text"
        placeholder="Question text…"
        value={q.text}
        onChange={(e) => set("text", e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none"
        required
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((opt, i) => (
          <label key={i} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 cursor-pointer">
            <input
              type="radio"
              name={`correct-${q.id}`}
              checked={q.correctAnswer === (isTF ? opt : q.options[i])}
              onChange={() => set("correctAnswer", isTF ? opt : q.options[i])}
              className="accent-[#0b2c4a]"
            />
            {isTF ? (
              <span className="text-sm text-slate-700">{opt}</span>
            ) : (
              <input
                type="text"
                placeholder={`Option ${i + 1}`}
                value={q.options[i]}
                onChange={(e) => setOption(i, e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-700 outline-none"
                required
              />
            )}
          </label>
        ))}
      </div>
      {!q.correctAnswer && (
        <p className="text-xs text-amber-600">Select the correct answer above.</p>
      )}
    </div>
  );
}

// ─── QuizModal ────────────────────────────────────────────────────────────────
function QuizModal({ open, onClose, professorUid, professorCollegeId, editingQuiz }) {
  const isEdit = Boolean(editingQuiz);
  const [form, setForm] = useState(emptyForm);
  const [colleges, setColleges] = useState([]);
  const [years, setYears] = useState([]);
  const [depts, setDepts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  const [pdfFile, setPdfFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [genSuccess, setGenSuccess] = useState(false);

  const handleGenerateFromPdf = async () => {
    if (!pdfFile) return;
    setGenerating(true);
    setGenError('');
    setGenSuccess(false);
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      const url = process.env.REACT_APP_GENERATE_QUIZ_URL || '/api/generate-quiz';
      const res = await fetch(url, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      const mapped = data.questions.map((q) => ({
        id: uid(),
        type: 'mcq',
        text: q.question,
        options: q.options,
        correctAnswer: q.options[q.correctIndex] ?? '',
        points: 1,
      }));
      setForm((f) => ({ ...f, questions: mapped }));
      setGenSuccess(true);
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Populate form when editing
  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      const q = editingQuiz;
      setForm({
        title: q.title || "",
        description: q.description || "",
        collegeId: q.collegeId || "",
        yearId: q.yearId || "",
        departmentId: q.departmentId || "",
        startTime: q.startTime ? new Date(q.startTime.seconds * 1000).toISOString().slice(0, 16) : "",
        durationMinutes: q.durationMinutes || 30,
        questions: q.questions?.length ? q.questions : [emptyQuestion()],
      });
    } else {
      setForm({ ...emptyForm(), collegeId: professorCollegeId || "" });
    }
    setError("");
  }, [open, isEdit, editingQuiz, professorCollegeId]);

  // Load colleges
  useEffect(() => {
    if (!open) return;
    getDocs(collection(db, "colleges")).then((snap) => {
      setColleges(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }).catch(() => {});
  }, [open]);

  // Load years when college changes
  useEffect(() => {
    if (!form.collegeId) { setYears([]); setDepts([]); return; }
    getDocs(collection(db, "colleges", form.collegeId, "years")).then((snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setYears(items);
    }).catch(() => setYears([]));
  }, [form.collegeId]);

  // Load depts when year changes
  useEffect(() => {
    if (!form.collegeId || !form.yearId) { setDepts([]); return; }
    getDocs(collection(db, "colleges", form.collegeId, "years", form.yearId, "departments")).then((snap) => {
      setDepts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }).catch(() => setDepts([]));
  }, [form.collegeId, form.yearId]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const addQuestion = () => {
    setForm((f) => ({ ...f, questions: [...f.questions, emptyQuestion()] }));
    setTimeout(() => scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 50);
  };
  const updateQuestion = (idx, q) =>
    setForm((f) => { const qs = [...f.questions]; qs[idx] = q; return { ...f, questions: qs }; });
  const removeQuestion = (idx) =>
    setForm((f) => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));

  const handleSave = async (publish) => {
    setError("");
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.collegeId || !form.yearId || !form.departmentId) return setError("Select college, year, and department.");
    if (!form.startTime) return setError("Start time is required.");
    if (form.questions.length === 0) return setError("Add at least one question.");
    for (const q of form.questions) {
      if (!q.text.trim()) return setError("All questions need text.");
      if (!q.correctAnswer) return setError("All questions need a correct answer selected.");
      if (q.type === "mcq" && q.options.some((o) => !o.trim())) return setError("Fill all MCQ options.");
    }
    setSaving(true);
    try {
      const docId = isEdit ? editingQuiz.id : uid();
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        createdBy: professorUid,
        collegeId: form.collegeId,
        yearId: form.yearId,
        departmentId: form.departmentId,
        startTime: new Date(form.startTime),
        durationMinutes: Number(form.durationMinutes),
        isPublished: publish,
        questions: form.questions.map((q) => ({
          id: q.id,
          text: q.text.trim(),
          type: q.type,
          options: q.type === "truefalse" ? ["True", "False"] : q.options.map((o) => o.trim()),
          correctAnswer: q.correctAnswer,
          points: Number(q.points) || 1,
        })),
        ...(isEdit ? { updatedAt: serverTimestamp() } : { createdAt: serverTimestamp() }),
      };
      await setDoc(doc(db, "quizzes", docId), payload, { merge: true });
      onClose();
    } catch (e) {
      setError(e.message || "Save failed.");
    } finally {
      setSaving(false);
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
          <h2 className="text-lg font-semibold text-slate-800">{isEdit ? "Edit Quiz" : "Create Quiz"}</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <HiX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* PDF Auto-Generate Zone */}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 space-y-2">
            <p className="text-sm font-semibold text-slate-700">📄 Upload Lecture PDF to Auto-Generate Questions</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                accept="application/pdf"
                disabled={generating}
                onChange={(e) => { setPdfFile(e.target.files[0] || null); setGenSuccess(false); setGenError(''); }}
                className="text-xs text-slate-600 file:mr-2 file:rounded-xl file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 disabled:opacity-50"
              />
              <button
                type="button"
                disabled={!pdfFile || generating}
                onClick={handleGenerateFromPdf}
                className="flex items-center gap-1.5 rounded-xl bg-[#0b2c4a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#153a63] disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Generating…
                  </>
                ) : "Generate ✨"}
              </button>
            </div>
            <p className="text-xs text-slate-400">(or fill questions manually below)</p>
            {genSuccess && (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                ✓ 10 questions generated from PDF
              </p>
            )}
            {genError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{genError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label-xs">Title</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder="Quiz title…" className="field" required />
            </div>
            <div className="sm:col-span-2">
              <label className="label-xs">Description (optional)</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                rows={2} placeholder="Short description…" className="field resize-none" />
            </div>

            <div>
              <label className="label-xs">College</label>
              <select value={form.collegeId}
                onChange={(e) => { set("collegeId", e.target.value); set("yearId", ""); set("departmentId", ""); }}
                className="field">
                <option value="">Select college</option>
                {colleges.map((c) => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
              </select>
            </div>
            <div>
              <label className="label-xs">Year</label>
              <select value={form.yearId}
                onChange={(e) => { set("yearId", e.target.value); set("departmentId", ""); }}
                disabled={!form.collegeId} className="field disabled:opacity-50">
                <option value="">Select year</option>
                {years.map((y) => <option key={y.id} value={y.id}>{y.name || y.id}</option>)}
              </select>
            </div>
            <div>
              <label className="label-xs">Department</label>
              <select value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)}
                disabled={!form.yearId} className="field disabled:opacity-50">
                <option value="">Select department</option>
                {depts.map((d) => <option key={d.id} value={d.id}>{d.name || d.id}</option>)}
              </select>
            </div>
            <div>
              <label className="label-xs">Duration (minutes)</label>
              <input type="number" min="1" value={form.durationMinutes}
                onChange={(e) => set("durationMinutes", e.target.value)} className="field" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-xs">Start Time</label>
              <input type="datetime-local" value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)} className="field" />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Questions ({form.questions.length})</p>
              <button type="button" onClick={addQuestion}
                className="flex items-center gap-1.5 rounded-xl bg-[#0b2c4a] px-3 py-1.5 text-xs font-semibold text-white">
                <HiPlus className="h-3.5 w-3.5" /> Add Question
              </button>
            </div>
            {form.questions.map((q, i) => (
              <QuestionRow key={q.id} q={q} idx={i}
                onChange={(updated) => updateQuestion(i, updated)}
                onRemove={() => removeQuestion(i)} />
            ))}
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" disabled={saving} onClick={() => handleSave(false)}
            className="rounded-xl border border-[#0b2c4a] px-5 py-2.5 text-sm font-semibold text-[#0b2c4a] hover:bg-slate-50 disabled:opacity-50">
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button type="button" disabled={saving} onClick={() => handleSave(true)}
            className="rounded-xl bg-[#0b2c4a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#153a63] disabled:opacity-50">
            {saving ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── QuizCard ──────────────────────────────────────────────────────────────────
function QuizCard({ quiz, onEdit, onDelete, onTogglePublish }) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try { await onTogglePublish(quiz); } finally { setToggling(false); }
  };
  const handleDelete = async () => {
    if (!window.confirm(`Delete quiz "${quiz.title}"? This will also delete all student submissions.`)) return;
    setDeleting(true);
    try { await onDelete(quiz); } finally { setDeleting(false); }
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-800">{quiz.title}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${quiz.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          {quiz.isPublished ? "Published" : "Draft"}
        </span>
      </div>
      {quiz.description ? <p className="text-sm text-slate-500 line-clamp-2">{quiz.description}</p> : null}
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2.5 py-1">{quiz.questions?.length || 0} questions</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">{quiz.durationMinutes} min</span>
        {quiz.startTime && <span className="rounded-full bg-slate-100 px-2.5 py-1">{fmtDate(quiz.startTime)}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="button" onClick={handleToggle} disabled={toggling}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
          {toggling ? "…" : quiz.isPublished ? "Unpublish" : "Publish"}
        </button>
        <Link to={`/prof/quizzes/${quiz.id}/results`}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          View Results
        </Link>
        <button type="button" onClick={() => onEdit(quiz)}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          <HiPencil className="inline h-3.5 w-3.5 mr-1" />Edit
        </button>
        <button type="button" onClick={handleDelete} disabled={deleting}
          className="rounded-xl border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50">
          {deleting ? "…" : <><HiTrash className="inline h-3.5 w-3.5 mr-1" />Delete</>}
        </button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
function ProfessorQuizzesPage() {
  const { user, profile } = useOutletContext() || {};
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  const collegeId = profile?.collegeId || profile?.college || "";

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    const q = query(collection(db, "quizzes"), where("createdBy", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setQuizzes(items);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user?.uid]);

  const handleEdit = useCallback((quiz) => { setEditingQuiz(quiz); setModalOpen(true); }, []);
  const handleCloseModal = useCallback(() => { setModalOpen(false); setEditingQuiz(null); }, []);

  const handleTogglePublish = useCallback(async (quiz) => {
    await updateDoc(doc(db, "quizzes", quiz.id), { isPublished: !quiz.isPublished });
  }, []);

  const handleDelete = useCallback(async (quiz) => {
    const subSnap = await getDocs(query(collection(db, "quizSubmissions"), where("quizId", "==", quiz.id)));
    const batch = writeBatch(db);
    subSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, "quizzes", quiz.id));
    await batch.commit();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0b2c4a]">My Quizzes</h1>
          <p className="text-sm text-slate-500">Create and manage quizzes for your students.</p>
        </div>
        <button type="button" onClick={() => { setEditingQuiz(null); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-2xl bg-[#0b2c4a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#153a63]">
          <HiPlus className="h-4 w-4" /> Create Quiz
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500 py-8 text-center">Loading quizzes…</div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          <HiBookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          No quizzes yet. Create your first quiz!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTogglePublish={handleTogglePublish} />
          ))}
        </div>
      )}

      <QuizModal
        open={modalOpen}
        onClose={handleCloseModal}
        professorUid={user?.uid}
        professorCollegeId={collegeId}
        editingQuiz={editingQuiz}
      />
    </div>
  );
}

export default ProfessorQuizzesPage;
