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
  return (voice.localService === false ? 20 : 0) // Cloud voices
    + (/(pablo|raul|alvaro|tomas|dario|jorge|juan|diego|carlos|rodrigo|male|hombre)/.test(name) ? 25 : 0) // Prioridad absoluta a voz masculina
    + (/(natural|neural|premium|enhanced|multilingual)/.test(name) ? 15 : 0)
    + (/google/.test(name) ? 6 : 0)
    + (/microsoft/.test(name) ? 5 : 0)
    + (lang === 'es-pe' ? 4 : 0)
    + (lang === 'es-mx' ? 2 : 0)
    - (/(compact|e-speak|espeak|android|female|mujer)/.test(name) ? 15 : 0);
}

let cachedVoice = null;

export function stopSpeech() {
  if (speechAvailable() && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
    window.speechSynthesis.cancel();
  }
}

export function setVoiceEnabled(enabled) {
  localStorage.setItem(preferenceKey, enabled ? 'on' : 'off');
  if (!enabled) stopSpeech();
}

function getBestVoice() {
  if (cachedVoice) return cachedVoice;
  const voices = availableSpanishVoices();
  if (voices.length === 0) return null; // No cachear si aún no han cargado las voces
  cachedVoice = voices.find(voice => voice.name === preferredVoice()) || voices.sort((a, b) => rankVoice(b) - rankVoice(a))[0] || null;
  return cachedVoice;
}

export function readQuestion(question, { force = false } = {}) {
  if ((!voiceEnabled() && !force) || !speechAvailable() || !question) return false;
  
  stopSpeech();
  
  // Bugfix: Chrome a veces se cuelga si se hace speak inmediatamente tras cancel
  setTimeout(() => {
    const voiceToUse = getBestVoice();
    
    // Función ayudante para encolar fragmentos (evita que el motor TTS tarde en renderizar audios largos)
    const speakChunk = (text) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-PE';
      utterance.rate = 0.85; // Un poco más natural, no tan exageradamente lento
      utterance.pitch = 0.9;
      if (voiceToUse) utterance.voice = voiceToUse;
      window.speechSynthesis.speak(utterance);
    };

    // 1. Hablar la pregunta de inmediato (arranca rápido)
    speakChunk(question.prompt);

    // 2. Encolar las opciones
    question.options.forEach((option, index) => {
      speakChunk(`Opción ${String.fromCharCode(65 + index)}... ${option}`);
    });
  }, 50);

  return true;
}
