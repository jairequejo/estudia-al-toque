import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('demo: respuesta, errores pendientes, repaso y persistencia', async () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const store = await vite.ssrLoadModule('/src/data/store.js');
    assert.equal(store.isConfigured, false);
    const catalog = await store.getCatalog();
    assert.equal(catalog.courses[0].topics.length, 3);
    const exams = await store.getExams();
    assert.equal(exams.length, 3);
    assert.ok(exams.every(exam => exam.type === 'demo' && exam.questionCount === 9));
    const examQuestions = await Promise.all(exams.map(exam => store.getExamQuestions(exam.id)));
    assert.ok(examQuestions.every(questions => questions.length === 9));
    assert.equal(new Set(examQuestions.flat().map(question => question.id)).size, 27);
    for (const topic of catalog.courses[0].topics) {
      const questions = await store.getQuestions(topic.id);
      assert.equal(questions.length, topic.questionCount);
      for (const item of questions) {
        assert.equal(item.options.length, 3);
        assert.equal(item.optionExplanations.length, 3);
        assert.ok(item.correctIndex >= 0 && item.correctIndex < 3);
      }
    }
    const [question] = await store.getQuestions('planificacion');
    const wrongIndex = (question.correctIndex + 1) % question.options.length;
    const wrong = await store.recordAnswer({ questionId: question.id, selectedIndex: wrongIndex, mode: 'practice' });
    assert.equal(wrong.isCorrect, false);
    assert.equal((await store.getMistakes())[0].id, question.id);
    assert.equal((await store.getProgress()).totalAnswered, 1);
    assert.equal((await store.getProgress()).correctAnswers, 0);
    assert.equal((await store.getReviewPlan()).upcoming.length, 1);
    const correct = await store.recordAnswer({ questionId: question.id, selectedIndex: question.correctIndex, mode: 'challenge' });
    assert.equal(correct.isCorrect, true);
    assert.equal((await store.getMistakes()).length, 0);
    assert.deepEqual(await store.getProgress(), {
      totalAnswered: 2, correctAnswers: 1, streak: 1,
      byTopic: { planificacion: { totalAnswered: 2, correctAnswers: 1 } },
    });
    assert.equal(JSON.parse(values.values().next().value).length, 2);
    await store.recordAnswer({ questionId: question.id, selectedIndex: question.correctIndex, mode: 'exam' });
    assert.equal(JSON.parse(values.values().next().value)[2].mode, 'mock');
    await assert.rejects(() => store.signIn('a@example.com', 'secret'), /aún no está conectado/);
  } finally {
    await vite.close();
    delete globalThis.localStorage;
  }
});
