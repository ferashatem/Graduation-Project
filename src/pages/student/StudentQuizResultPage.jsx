import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { HiArrowLeft, HiCheckCircle, HiXCircle } from "react-icons/hi";
import { db } from "../../firebase/firebaseConfig";

function StudentQuizResultPage() {
  const { quizId } = useParams();
  const { user } = useOutletContext() || {};

  const [quiz, setQuiz] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid || !quizId) return;
    let active = true;
    setLoading(true);
    Promise.all([
      getDoc(doc(db, "quizzes", quizId)),
      getDocs(query(collection(db, "quizSubmissions"),
        where("quizId", "==", quizId),
        where("studentUid", "==", user.uid))),
    ]).then(([quizSnap, subSnap]) => {
      if (!active) return;
      if (!quizSnap.exists()) { setError("Quiz not found."); setLoading(false); return; }
      setQuiz({ id: quizSnap.id, ...quizSnap.data() });
      if (!subSnap.empty) setSubmission({ id: subSnap.docs[0].id, ...subSnap.docs[0].data() });
      setLoading(false);
    }).catch((e) => { if (active) { setError(e.message || "Failed to load."); setLoading(false); } });
    return () => { active = false; };
  }, [quizId, user?.uid]);

  const answerMap = useMemo(() => {
    if (!submission) return {};
    const m = {};
    (submission.answers || []).forEach((a) => { m[a.questionId] = a.selectedAnswer; });
    return m;
  }, [submission]);

  const passed = submission && submission.percentage >= 50;

  if (loading) return <div className="py-12 text-center text-sm text-slate-500">Loading result…</div>;
  if (error) return <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  if (!submission) {
    return (
      <div className="rounded-2xl bg-amber-50 p-6 text-sm text-amber-700 ring-1 ring-amber-200">
        No submission found for this quiz.{" "}
        <Link to={`/student/quizzes/${quizId}`} className="font-semibold underline">Take the quiz</Link>
      </div>
    );
  }

  const questions = quiz?.questions || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/student/quizzes"
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
        <HiArrowLeft className="h-4 w-4" /> Back to Quizzes
      </Link>

      {/* Score card */}
      <div className={`rounded-2xl p-6 text-center shadow-sm ring-1 ${passed ? "bg-emerald-50 ring-emerald-200" : "bg-red-50 ring-red-200"}`}>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{quiz?.title}</p>
        <div className="mt-3 text-6xl font-bold text-[#0b2c4a]">
          {submission.score}<span className="text-3xl text-slate-400">/{submission.totalPoints}</span>
        </div>
        <div className={`mt-2 text-2xl font-semibold ${passed ? "text-emerald-600" : "text-red-600"}`}>
          {submission.percentage}%
        </div>
        <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
          {passed ? <HiCheckCircle className="h-5 w-5" /> : <HiXCircle className="h-5 w-5" />}
          {passed ? "Passed" : "Failed"}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {submission.wrongQuestions?.length ?? 0} wrong · {questions.length - (submission.wrongQuestions?.length ?? 0)} correct
        </p>
      </div>

      {/* Question breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Question Breakdown</h2>
        {questions.map((q, idx) => {
          const selected = answerMap[q.id] || "—";
          const isWrong = (submission.wrongQuestions || []).includes(q.id);
          return (
            <div key={q.id}
              className={`rounded-2xl p-4 space-y-2 ring-1 ${isWrong ? "bg-red-50 ring-red-200" : "bg-emerald-50 ring-emerald-200"}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-800">
                  <span className="mr-2 text-xs font-semibold text-slate-400">Q{idx + 1}.</span>
                  {q.text}
                </p>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${isWrong ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                  {isWrong ? "✗ Wrong" : "✓ Correct"}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs">
                <span>
                  <span className="font-semibold text-slate-500">Your answer: </span>
                  <span className={`font-semibold ${isWrong ? "text-red-600" : "text-emerald-700"}`}>{selected}</span>
                </span>
                {isWrong && (
                  <span>
                    <span className="font-semibold text-slate-500">Correct answer: </span>
                    <span className="font-semibold text-emerald-700">{q.correctAnswer}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StudentQuizResultPage;
