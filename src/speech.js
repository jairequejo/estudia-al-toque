const preferenceKey = 'educacion-fisica:voice-reading:v1';
const voiceKey = 'educacion-fisica:preferred-voice:v1';

export const speechAvailable = () => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
export const voiceEnabled = () => localStorage.getItem(preferenceKey) !== 'off';
export const preferredVoice = () => localStorage.getItem(voiceKey) || '';
export const setPreferredVoice = (name) => localStorage.setItem(voiceKey, name);

export function availableSpanishVoices() {
  if (!speechAvailable()) return [];
  return window.speechSynthesis.getVoices().filter(voice => voice.lang.toLowerCase().startsWith('es'));
}

export function rankVoice(voice) {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  return (/(natural|neural|premium|enhanced)/.test(name) ? 12 : 0)
    + (/google/.test(name) ? 5 : 0)
    + (/microsoft/.test(name) ? 4 : 0)
    + (lang === 'es-pe' ? 3 : 0)
    + (voice.localService === false ? 2 : 0)
    - (/(compact|e-speak|espeak)/.test(name) ? 5 : 0);
}

export function stopSpeech() {
  if (speechAvailable()) window.speechSynthesis.cancel();
}

export function setVoiceEnabled(enabled) {
  localStorage.setItem(preferenceKey, enabled ? 'on' : 'off');
  if (!enabled) stopSpeech();
}

export function readQuestion(question, { force = false } = {}) {
  if ((!voiceEnabled() && !force) || !speechAvailable() || !question) return false;
  stopSpeech();
  const options = question.options.map((option, index) => `Opción ${String.fromCharCode(65 + index)}. ${option}`).join('. ');
  const utterance = new SpeechSynthesisUtterance(`${question.prompt}. ${options}`);
  utterance.lang = 'es-PE';
  utterance.rate = 1;
  const voices = availableSpanishVoices();
  utterance.voice = voices.find(voice => voice.name === preferredVoice()) || voices.sort((a, b) => rankVoice(b) - rankVoice(a))[0] || null;
  window.speechSynthesis.speak(utterance);
  return true;
}
