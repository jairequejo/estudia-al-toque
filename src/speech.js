import { UniversalEdgeTTS } from 'edge-tts-universal';

const preferenceKey = 'educacion-fisica:voice-reading:v1';
const voiceKey = 'educacion-fisica:preferred-voice:v1';

// Voces masculinas neuronales de Microsoft Azure
const DEFAULT_VOICE = 'es-MX-JorgeNeural';

export const speechAvailable = () => true; // Siempre disponible por red
export const voiceEnabled = () => localStorage.getItem(preferenceKey) !== 'off';
export const preferredVoice = () => localStorage.getItem(voiceKey) || DEFAULT_VOICE;
export const setPreferredVoice = (name) => localStorage.setItem(voiceKey, name);

let currentAudio = null;
let synthesisCounter = 0;

export function stopSpeech() {
  synthesisCounter++; // Invalida cualquier síntesis en curso
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function setVoiceEnabled(enabled) {
  localStorage.setItem(preferenceKey, enabled ? 'on' : 'off');
  if (!enabled) stopSpeech();
}

export async function readQuestion(question, { force = false } = {}) {
  if ((!voiceEnabled() && !force) || !question) return false;
  
  stopSpeech();
  const currentId = synthesisCounter;
  
  const options = question.options.map((option, index) => `Opción ${String.fromCharCode(65 + index)}... ${option}`).join('. ');
  const text = `${question.prompt}... ${options}`;
  
  try {
    // Solicitar audio a Microsoft Azure (Edge TTS)
    const tts = new UniversalEdgeTTS(text, preferredVoice(), {
      rate: '-10%', // Ligeramente pausado
      pitch: '-5Hz' // Tono más grave
    });
    
    const result = await tts.synthesize();
    
    // Si el usuario cambió de pregunta mientras se descargaba, ignorar
    if (currentId !== synthesisCounter) return true;
    
    const audioBlob = new Blob([result.audio], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    currentAudio = new Audio(audioUrl);
    await currentAudio.play();
    
  } catch (error) {
    console.error("Error en Edge TTS Neural, usando fallback local:", error);
    if (currentId !== synthesisCounter) return true;
    
    // Fallback nativo robótico por si el usuario pierde conexión
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
  
  return true;
}
