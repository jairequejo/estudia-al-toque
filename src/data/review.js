const intervals = [1, 3, 7, 14, 30];
const dayMs = 24 * 60 * 60 * 1000;

// Cada acierto consecutivo amplía el intervalo; un error reinicia la secuencia.
export function buildReviewPlan(questions, attempts, now = Date.now()) {
  const progress = new Map();
  for (const attempt of attempts) {
    const previous = progress.get(attempt.questionId);
    const streak = attempt.isCorrect ? (previous?.streak || 0) + 1 : 0;
    const intervalDays = intervals[Math.min(Math.max(streak - 1, 0), intervals.length - 1)];
    const answeredAt = Date.parse(attempt.createdAt);
    if (!Number.isFinite(answeredAt)) continue;
    progress.set(attempt.questionId, {
      streak, intervalDays, dueAt: new Date(answeredAt + intervalDays * dayMs).toISOString(),
      lastCorrect: attempt.isCorrect,
    });
  }
  const items = questions.flatMap(question => {
    const schedule = progress.get(question.id);
    return schedule ? [{ ...question, ...schedule, isDue: Date.parse(schedule.dueAt) <= now }] : [];
  }).sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
  return { items, due: items.filter(item => item.isDue), upcoming: items.filter(item => !item.isDue) };
}
