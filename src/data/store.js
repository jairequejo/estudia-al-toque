import { createClient } from '@supabase/supabase-js';
import { demoCatalog, allDemoQuestions, demoExams } from './demo.js';
import { buildReviewPlan } from './review.js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
export const isConfigured = Boolean(url && publishableKey);
const supabase = isConfigured ? createClient(url, publishableKey) : null;
const storageKey = 'educacion-fisica-demo:attempts:v1';

const copy = (value) => structuredClone(value);

function localAttempts() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveLocalAttempt(attempt) {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...localAttempts(), attempt]));
  } catch {
    throw new Error('No se pudo guardar el avance en este navegador. Revisa el espacio o los permisos de almacenamiento.');
  }
}

function mapQuestion(row) {
  return {
    id: row.id,
    topicId: row.topic_id,
    prompt: row.prompt,
    options: row.options,
    correctIndex: row.correct_index,
    explanation: row.explanation,
    optionExplanations: row.option_explanations,
    source: row.source,
    year: row.year,
    isDemo: row.is_demo,
  };
}

async function currentUser() {
  if (!supabase) return null;
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw friendlyError(sessionError);
  if (!sessionData.session) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw friendlyError(error);
  return data.user;
}

function friendlyError(error) {
  const messages = {
    invalid_credentials: 'El correo o la contraseña no coinciden.',
    email_not_confirmed: 'Confirma tu correo antes de ingresar.',
    user_already_exists: 'Ese correo ya tiene una cuenta.',
    email_address_invalid: 'Ingresa un correo válido.',
    weak_password: 'La contraseña no cumple los requisitos de seguridad.',
    over_email_send_rate_limit: 'Se enviaron demasiados correos. Espera un momento e inténtalo de nuevo.',
  };
  return new Error(messages[error.code] || error.message || 'No se pudo completar la operación.');
}

function authUnavailable() {
  throw new Error('El acceso con correo aún no está conectado. Puedes practicar en modo demostración y guardar tu avance en este navegador.');
}

function redirectUrl() {
  return new URL(import.meta.env.BASE_URL || '/', window.location.origin).toString();
}

export async function getCatalog() {
  if (!supabase) return copy(demoCatalog);
  const [coursesResult, topicsResult] = await Promise.all([
    supabase.from('courses').select('id,title,description').eq('is_published', true).order('sort_order'),
    supabase.from('topics').select('id,course_id,title,description,audio_url,sort_order,questions(id)').eq('is_published', true).order('sort_order'),
  ]);
  if (coursesResult.error) throw friendlyError(coursesResult.error);
  if (topicsResult.error) throw friendlyError(topicsResult.error);
  return {
    courses: coursesResult.data.map((course) => ({
      ...course,
      topics: topicsResult.data.filter((topic) => topic.course_id === course.id).map((topic) => ({
        id: topic.id,
        title: topic.title,
        description: topic.description,
        questionCount: topic.questions?.length || 0,
        audioUrl: topic.audio_url,
      })),
    })),
  };
}

export async function getQuestions(topicId) {
  if (!supabase) return copy(allDemoQuestions.filter((question) => question.topicId === topicId));
  const { data, error } = await supabase.from('questions')
    .select('id,topic_id,prompt,options,correct_index,explanation,option_explanations,source,year,is_demo')
    .eq('topic_id', topicId).eq('is_published', true).order('sort_order');
  if (error) throw friendlyError(error);
  return data.map(mapQuestion);
}

export async function getExams() {
  if (!supabase) return copy(demoExams.map(exam => ({ ...exam, questionCount: exam.questionIds.length, topicIds: demoCatalog.courses.flatMap(course => course.topics.map(topic => topic.id)) })));
  // No se declara un examen oficial cargado sin un catálogo editorial verificado.
  return [];
}

export async function getExamQuestions(examId) {
  if (!supabase) {
    const exam = demoExams.find(item => item.id === examId);
    if (!exam) throw new Error('Examen no disponible.');
    const byId = new Map(allDemoQuestions.map(question => [question.id, question]));
    return copy(exam.questionIds.map(id => byId.get(id)).filter(Boolean));
  }
  throw new Error('Aún no hay exámenes cargados en esta cuenta.');
}

export async function getReviewPlan() {
  const catalog = await getCatalog();
  const topics = catalog.courses.flatMap(course => course.topics);
  const groups = await Promise.all(topics.map(item => getQuestions(item.id)));
  return buildReviewPlan(groups.flat(), await allAttempts());
}

async function allAttempts() {
  const user = await currentUser();
  if (!user) return localAttempts();
  const attempts = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('attempts')
      .select('id,question_id,selected_index,is_correct,mode,created_at')
      .eq('user_id', user.id).order('created_at', { ascending: true }).order('id', { ascending: true })
      .range(offset, offset + 499);
    if (error) throw friendlyError(error);
    attempts.push(...data.map((row) => ({ questionId: row.question_id, selectedIndex: row.selected_index, isCorrect: row.is_correct, mode: row.mode, createdAt: row.created_at })));
    if (data.length < 500) break;
  }
  return attempts;
}

export async function recordAnswer({ questionId, selectedIndex, mode = 'practice' }) {
  if (mode === 'exam') mode = 'mock'; // Nombre usado por la pantalla de simulacro.
  if (!['practice', 'challenge', 'mock'].includes(mode)) throw new Error('Modo de práctica no válido.');
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0) throw new Error('Selecciona una alternativa válida.');
  if (supabase) {
    const user = await currentUser();
    if (user) {
      const { data, error } = await supabase.rpc('submit_answer', { p_question_id: questionId, p_selected_index: selectedIndex, p_mode: mode });
      if (error) throw friendlyError(error);
      const result = Array.isArray(data) ? data[0] : data;
      return { isCorrect: result.is_correct, correctIndex: result.correct_index, explanation: result.explanation, optionExplanations: result.option_explanations };
    }
  }
  let question = allDemoQuestions.find((item) => item.id === questionId);
  if (!question && supabase) {
    const { data, error } = await supabase.from('questions')
      .select('id,topic_id,prompt,options,correct_index,explanation,option_explanations,source,year,is_demo')
      .eq('id', questionId).eq('is_published', true).maybeSingle();
    if (error) throw friendlyError(error);
    if (data) question = mapQuestion(data);
  }
  if (!question) throw new Error('Pregunta no disponible en la demostración.');
  if (selectedIndex >= question.options.length) throw new Error('Alternativa fuera de rango.');
  const isCorrect = selectedIndex === question.correctIndex;
  saveLocalAttempt({ questionId, selectedIndex, isCorrect, mode, createdAt: new Date().toISOString() });
  return { isCorrect, correctIndex: question.correctIndex, explanation: question.explanation, optionExplanations: question.optionExplanations };
}

export async function getProgress() {
  const attempts = await allAttempts();
  const remoteTopicIds = new Map();
  if (supabase && await currentUser() && attempts.length) {
    const { data, error } = await supabase.from('questions').select('id,topic_id').in('id', [...new Set(attempts.map((attempt) => attempt.questionId))]);
    if (error) throw friendlyError(error);
    for (const question of data) remoteTopicIds.set(question.id, question.topic_id);
  }
  const byTopic = {};
  let correctAnswers = 0;
  let streak = 0;
  for (const attempt of attempts) {
    if (attempt.isCorrect) { correctAnswers += 1; streak += 1; } else { streak = 0; }
    const topicId = remoteTopicIds.get(attempt.questionId) || allDemoQuestions.find((question) => question.id === attempt.questionId)?.topicId;
    if (!topicId) continue;
    byTopic[topicId] ||= { totalAnswered: 0, correctAnswers: 0 };
    byTopic[topicId].totalAnswered += 1;
    if (attempt.isCorrect) byTopic[topicId].correctAnswers += 1;
  }
  return { totalAnswered: attempts.length, correctAnswers, streak, byTopic };
}

export async function getMistakes() {
  const attempts = await allAttempts();
  const pending = new Map();
  for (const attempt of attempts) {
    if (attempt.isCorrect) pending.delete(attempt.questionId);
    else pending.set(attempt.questionId, attempt.selectedIndex);
  }
  if (!pending.size) return [];
  let questions;
  if (supabase && await currentUser()) {
    const { data, error } = await supabase.from('questions')
      .select('id,topic_id,prompt,options,correct_index,explanation,option_explanations,source,year,is_demo')
      .in('id', [...pending.keys()]);
    if (error) throw friendlyError(error);
    questions = data.map(mapQuestion);
  } else {
    questions = allDemoQuestions;
  }
  return copy(questions.filter((question) => pending.has(question.id)).map((question) => ({ ...question, lastSelectedIndex: pending.get(question.id) })));
}

export async function signUp(email, password) {
  if (!supabase) authUnavailable();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl() } });
  if (error) throw friendlyError(error);
  return data;
}

export async function signIn(email, password) {
  if (!supabase) authUnavailable();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw friendlyError(error);
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw friendlyError(error);
}

export async function resetPassword(email) {
  if (!supabase) authUnavailable();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() });
  if (error) throw friendlyError(error);
  return data;
}

export async function updatePassword(password) {
  if (!supabase) authUnavailable();
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw friendlyError(error);
  return data;
}

export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw friendlyError(error);
  return data.session;
}
