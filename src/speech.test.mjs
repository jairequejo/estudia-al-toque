import test from 'node:test';
import assert from 'node:assert/strict';
import { rankVoice } from './speech.js';

test('prioriza una voz natural en español cuando está disponible', () => {
  const basic = { name: 'Español básico', lang: 'es-PE', localService: true };
  const natural = { name: 'Microsoft Natural Español', lang: 'es-ES', localService: false };
  assert.ok(rankVoice(natural) > rankVoice(basic));
});
