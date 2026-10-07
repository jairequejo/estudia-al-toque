import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReviewPlan } from './review.js';

test('repaso espaciado: aumenta con aciertos y reinicia tras un error', () => {
  const question = [{ id: 'q1', topicId: 'movimiento', prompt: 'Caso de prueba' }];
  const base = Date.parse('2026-10-01T12:00:00Z');
  const attempt = (days, isCorrect) => ({ questionId: 'q1', isCorrect, createdAt: new Date(base + days * 86400000).toISOString() });
  const first = buildReviewPlan(question, [attempt(0, true)], base + 86400000);
  assert.equal(first.due.length, 1);
  assert.equal(first.due[0].intervalDays, 1);
  const second = buildReviewPlan(question, [attempt(0, true), attempt(1, true)], base + 2 * 86400000);
  assert.equal(second.upcoming[0].intervalDays, 3);
  assert.equal(second.upcoming[0].topicId, 'movimiento');
  const reset = buildReviewPlan(question, [attempt(0, true), attempt(1, true), attempt(2, false)], base + 3 * 86400000);
  assert.equal(reset.due[0].intervalDays, 1);
  assert.equal(reset.due[0].streak, 0);
});
