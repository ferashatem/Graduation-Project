/**
 * Calculate a quiz result from questions and submitted answers.
 *
 * @param {Array} questions - Array of question objects from the quizzes doc.
 * @param {Array} answers   - Array of { questionId, selectedAnswer } objects.
 * @returns {{ score: number, totalPoints: number, percentage: number, wrongQuestions: string[] }}
 */
export function calculateResult(questions, answers) {
  let score = 0;
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
  const wrongQuestions = [];

  answers.forEach(({ questionId, selectedAnswer }) => {
    const q = questions.find((q) => q.id === questionId);
    if (!q) return;
    if (selectedAnswer === q.correctAnswer) {
      score += q.points || 1;
    } else {
      wrongQuestions.push(questionId);
    }
  });

  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  return { score, totalPoints, percentage, wrongQuestions };
}
