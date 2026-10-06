import './styles.css';
import {
  getCatalog,
  getQuestions,
  recordAnswer,
  getProgress,
  getMistakes,
  signUp,
  signIn,
  signOut,
  resetPassword,
  updatePassword,
  getSession,
  isConfigured,
} from './data/store.js';

const app = document.querySelector('#app');
// Identidad provisional: cambiar aquí cuando Edwin confirme el nombre comercial.
const identity = { title: 'Educación Física', byline: 'Edwin Requejo' };
const state = {
  view: 'home', catalog: { courses: [] }, progress: null, session: null,
  topicId: null, questions: [], index: 0, answer: null, feedback: null,
  mode: 'practice', examAnswers: [], examEndsAt: 0, examResult: null,
  authTab: 'signin', notice: '', busy: false, timer: null,
};

const icon = {
  bolt: '<path d="m13 2-9 11h7l-1 9 10-12h-7l1-8Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  rotate: '<path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sound: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M5 5l14 14M19 5 5 19"/>',
};
const svg = (name, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon[name]}</svg>`;
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const allTopics = () => state.catalog.courses.flatMap(course => course.topics.map(topic => ({ ...topic, courseTitle: course.title })));
const topic = (id) => allTopics().find(item => item.id === id);
const percent = (num, den) => den ? Math.round(num / den * 100) : 0;
const initials = (email) => (email || 'J').slice(0, 1).toUpperCase();
const sourceLabel = (question) => question.isDemo ? 'Pregunta propia de demostración' : (question.source || 'Material de estudio');

function setNotice(message) {
  state.notice = message;
  render();
}
function closeNotice() { state.notice = ''; render(); }
function setBusy(value) { state.busy = value; render(); }
function stopTimer() { if (state.timer) clearInterval(state.timer); state.timer = null; }
function nav(view) {
  stopTimer(); state.view = view; state.notice = ''; state.examResult = null;
  render(); window.scrollTo({ top: 0, behavior: 'smooth' });
}
function formatTime(seconds) {
  const n = Math.max(0, seconds);
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
}
function timeLeft() { return Math.max(0, Math.ceil((state.examEndsAt - Date.now()) / 1000)); }
function safeAudioUrl(value) {
  if (!value) return '';
  try { const url = new URL(value, window.location.href); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
}

function shell(content) {
  const active = state.view;
  const links = [
    ['home', 'Mi espacio', 'grid'], ['topics', 'Practicar', 'book'],
    ['challenge', 'Reto breve', 'bolt'], ['mistakes', 'Mis errores', 'rotate'],
    ['exam', 'Simulacro', 'target'],
  ];
  const navLinks = links.map(([view, label, symbol]) => `<button class="nav-link ${active === view ? 'active' : ''}" data-nav="${view}" aria-current="${active === view ? 'page' : 'false'}">${svg(symbol)}<span>${label}</span>${active === view ? '<span class="active-dot"></span>' : ''}</button>`).join('');
  return `<div class="app-shell">
    <aside class="sidebar">
      <button class="brand" data-nav="home" aria-label="Educación Física con Edwin Requejo, ir al inicio"><span class="brand-mark">${svg('bolt', 24)}</span><span>${identity.title}<br><strong>Edwin Requejo<span class="brand-period">.</span></strong></span></button>
      <div class="sidebar-label">TU RUTA DE ESTUDIO</div>
      <nav aria-label="Navegación principal">${navLinks}</nav>
      <div class="sidebar-bottom"><div class="aside-card"><span class="aside-card-icon">✦</span><strong>Un paso a la vez.</strong><p>Practica, entiende y vuelve a intentar. Cada sesión cuenta.</p></div><span class="demo-tag">Contenido propio de demostración</span></div>
    </aside>
    <div class="main-column">
      <header class="topbar"><div class="topbar-mobile"><button class="brand compact" data-nav="home" aria-label="Inicio"><span class="brand-mark">${svg('bolt', 20)}</span><span>Educación Física <strong>· Edwin Requejo</strong></span></button></div><div class="topbar-spacer"></div><span class="connection-pill ${isConfigured ? 'connected' : ''}"><span></span>${isConfigured ? 'Supabase conectado' : 'Modo demostración'}</span><button class="profile-button" data-nav="account" title="Cuenta">${state.session?.user?.email ? initials(state.session.user.email) : svg('user', 18)}<span>${state.session?.user?.email ? esc(state.session.user.email) : 'Mi cuenta'}</span></button></header>
      ${state.notice ? `<div class="notice" role="status"><span>${esc(state.notice)}</span><button data-action="dismiss-notice" aria-label="Cerrar aviso">${svg('close', 16)}</button></div>` : ''}
      <main id="main-content">${content}</main>
      <footer class="footer"><span>Proyecto educativo de Edwin Requejo · versión de demostración</span><span>Preguntas de muestra creadas para esta demo, aún no revisadas por Edwin.</span></footer>
    </div>
    <nav class="mobile-nav" aria-label="Navegación móvil">${links.map(([view, label, symbol]) => `<button class="mobile-link ${active === view ? 'active' : ''}" data-nav="${view}" aria-label="${label}">${svg(symbol, 20)}<span>${label}</span></button>`).join('')}</nav>
  </div>`;
}

function sectionHeading(kicker, title, subtitle) {
  return `<div class="section-heading"><div><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${subtitle}</p></div></div>`;
}
function emptyState(symbol, title, copy, action, label) {
  return `<div class="empty-state"><span class="empty-symbol">${symbol}</span><h2>${title}</h2><p>${copy}</p>${action ? `<button class="button button-primary" data-nav="${action}">${label}${svg('arrow', 18)}</button>` : ''}</div>`;
}
function topicCards() {
  const topics = allTopics();
  return topics.map((item, i) => {
    const stats = state.progress?.byTopic?.[item.id] || {};
    const rate = percent(stats.correctAnswers || 0, stats.totalAnswered || 0);
    const audio = safeAudioUrl(item.audioUrl);
    return `<article class="topic-card"><div class="topic-card-top"><span class="topic-index">${String(i + 1).padStart(2, '0')}</span><span class="topic-count">${item.questionCount || 0} preguntas</span></div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><div class="topic-card-bottom"><div class="topic-stat"><span>${stats.totalAnswered ? `${rate}% de aciertos` : 'Aún sin practicar'}</span><div class="mini-track"><span style="width:${rate}%"></span></div></div><button class="circle-button" data-action="start-practice" data-topic="${esc(item.id)}" aria-label="Practicar ${esc(item.title)}">${svg('arrow', 18)}</button></div>${audio ? `<div class="topic-audio"><span>${svg('sound', 16)} Audio del tema</span><audio controls preload="none" src="${esc(audio)}"></audio></div>` : ''}</article>`;
  }).join('');
}
function homeView() {
  const p = state.progress || { totalAnswered: 0, correctAnswers: 0, streak: 0 };
  const rate = percent(p.correctAnswers, p.totalAnswered);
  const first = allTopics()[0];
  return `<div class="page home-page">
    <section class="hero"><div class="hero-content"><span class="hero-kicker"><span class="sparkle">✦</span> PREPARACIÓN DOCENTE · EDUCACIÓN FÍSICA</span><h1>Aprende a tu ritmo.<br><em>Avanza con criterio.</em></h1><p>Un espacio de estudio de Edwin Requejo: practica por temas, entiende cada alternativa y refuerza lo que necesitas.</p><div class="hero-actions"><button class="button button-dark" data-action="start-practice" data-topic="${esc(first?.id || '')}">Empezar a practicar ${svg('arrow', 18)}</button><button class="button button-light" data-nav="exam">Ver simulacro</button></div><div class="hero-footnote">✳ Preguntas de muestra propias de esta demo; Edwin aún no las ha revisado. No son preguntas oficiales.</div></div><div class="hero-visual" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="visual-card visual-card-back"><span>01</span><div class="visual-lines"><i></i><i></i><i></i></div></div><div class="visual-card visual-card-front"><div class="visual-badge">✦</div><strong>¡Vas<br>muy bien!</strong><span>Un intento a la vez.</span><div class="visual-dots"><b></b><b></b><b></b><b></b></div></div><div class="visual-star star-one">✳</div><div class="visual-star star-two">✦</div></div></section>
    <section class="stats-grid" aria-label="Tu progreso"><div class="stat-card"><span class="stat-icon coral">${svg('book', 22)}</span><strong>${p.totalAnswered || 0}</strong><span>respuestas registradas</span></div><div class="stat-card"><span class="stat-icon blue">${svg('target', 22)}</span><strong>${rate}%</strong><span>aciertos acumulados</span></div><div class="stat-card"><span class="stat-icon yellow">${svg('bolt', 22)}</span><strong>${p.streak || 0}</strong><span>aciertos seguidos</span></div></section>
    <div class="content-row"><div class="content-intro"><span class="eyebrow">ELIGE TU SIGUIENTE PASO</span><h2>Una práctica que se adapta a ti.</h2></div><button class="text-link" data-nav="topics">Ver todos los temas ${svg('arrow', 17)}</button></div>
    <section class="action-grid"><button class="action-card action-peach" data-nav="topics"><span class="action-icon">${svg('book', 23)}</span><span><strong>Practica por tema</strong><small>Aprende con explicación en cada pregunta.</small></span>${svg('arrow', 19)}</button><button class="action-card action-lime" data-nav="challenge"><span class="action-icon">${svg('bolt', 23)}</span><span><strong>Reto breve</strong><small>Cinco preguntas para entrar en ritmo.</small></span>${svg('arrow', 19)}</button><button class="action-card action-blue" data-nav="mistakes"><span class="action-icon">${svg('rotate', 23)}</span><span><strong>Repasa errores</strong><small>Vuelve a las preguntas que cuestan.</small></span>${svg('arrow', 19)}</button></section>
    <section class="home-topics"><div class="content-row"><div class="content-intro"><span class="eyebrow">CONTENIDO DISPONIBLE</span><h2>Empieza por un tema.</h2></div></div><div class="topic-grid">${topicCards()}</div></section>
    <section class="coming-soon"><span class="coming-symbol">✦</span><div><strong>Contenido en preparación</strong><p>El banco de preguntas revisado por Edwin Requejo se incorporará más adelante. Estas preguntas de muestra permiten probar la experiencia mientras tanto.</p></div></section>
    <section class="official-resource"><div><span class="eyebrow">RECURSO EXTERNO</span><h2>Consulta los cuadernillos oficiales.</h2><p>El Minedu publica instrumentos y claves del concurso de nombramiento 2024. Son material externo; las preguntas de esta demo son originales y diferentes.</p></div><a href="https://evaluaciondocente.perueduca.pe/nombramiento24/nombramientoinstrumentos2024/" target="_blank" rel="noopener noreferrer">Cuadernillos oficiales Minedu ${svg('arrow', 17)}</a></section>
  </div>`;
}
function topicsView() {
  return `<div class="page">${sectionHeading('PRACTICA CON PROPÓSITO', 'Elige un tema.', 'Responde sin prisa y descubre por qué cada opción es correcta o incorrecta.')}
    <div class="info-strip">${svg('book', 19)} <span>Esta primera versión incluye preguntas propias de demostración para probar la experiencia.</span></div>
    <div class="topic-grid">${topicCards()}</div></div>`;
}
function questionMeta(q) {
  return `<span class="question-source">${esc(sourceLabel(q))}${q.year ? ` · ${esc(q.year)}` : ''}</span>`;
}
function questionCard(q, index, total, mode, selected, feedback) {
  const answered = Boolean(feedback);
  const exam = mode === 'exam';
  const choices = q.options.map((option, choiceIndex) => {
    const selectedChoice = selected === choiceIndex;
    const correctChoice = answered && feedback.correctIndex === choiceIndex;
    const wrongChoice = answered && selectedChoice && !correctChoice;
    return `<button class="choice ${selectedChoice ? 'selected' : ''} ${correctChoice ? 'correct' : ''} ${wrongChoice ? 'wrong' : ''}" data-action="choose" data-choice="${choiceIndex}" ${answered ? 'disabled' : ''} aria-pressed="${selectedChoice}"><span class="choice-letter">${String.fromCharCode(65 + choiceIndex)}</span><span class="choice-text">${esc(option)}</span><span class="choice-indicator">${correctChoice ? svg('check', 18) : ''}</span></button>`;
  }).join('');
  const title = exam ? 'Simulacro' : mode === 'challenge' ? 'Reto breve' : mode === 'mistakes' ? 'Repaso de errores' : 'Práctica por tema';
  return `<div class="question-layout"><div class="quiz-topline"><button class="back-link" data-nav="${mode === 'practice' ? 'topics' : mode === 'mistakes' ? 'mistakes' : 'home'}">← Volver</button><span class="quiz-mode">${title}</span></div>
    <div class="quiz-progress-row"><span>Pregunta <strong>${index + 1}</strong> de ${total}</span>${exam ? `<span class="timer" id="exam-timer">${svg('clock', 18)} ${formatTime(timeLeft())}</span>` : `<span>${esc(topic(q.topicId)?.title || '')}</span>`}</div><div class="progress-track"><span style="width:${percent(index + (answered || exam && selected !== null ? 1 : 0), total)}%"></span></div>
    <section class="question-panel" aria-label="Pregunta ${index + 1}"><div class="question-top">${questionMeta(q)}<span class="question-number">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span></div><h1>${esc(q.prompt)}</h1><p class="choose-hint">${exam ? 'Elige una alternativa. Las explicaciones aparecerán al finalizar.' : 'Elige la alternativa que consideres correcta.'}</p><div class="choices">${choices}</div>
    ${answered ? feedbackMarkup(q, feedback, selected) : ''}
    <div class="question-actions">${exam ? `<button class="button button-primary" data-action="exam-next" ${selected === null ? 'disabled' : ''}>${index + 1 === total ? 'Terminar simulacro' : 'Siguiente pregunta'} ${svg('arrow', 18)}</button>` : answered ? `<button class="button button-primary" data-action="next-question">${index + 1 === total ? 'Ver mi avance' : 'Siguiente pregunta'} ${svg('arrow', 18)}</button>` : `<button class="button button-primary" data-action="check-answer" ${selected === null ? 'disabled' : ''}>Comprobar respuesta ${svg('arrow', 18)}</button>`}</div></section></div>`;
}
function feedbackMarkup(q, feedback, selected) {
  const good = feedback.isCorrect;
  const alternatives = (feedback.optionExplanations || q.optionExplanations || []).map((explanation, i) => explanation ? `<li><strong>${String.fromCharCode(65 + i)}${i === feedback.correctIndex ? ' · correcta' : ''}:</strong> ${esc(explanation)}</li>` : '').join('');
  return `<div class="feedback ${good ? 'feedback-good' : 'feedback-try'}" role="status"><div class="feedback-title"><span>${good ? svg('check', 20) : svg('rotate', 20)}</span><strong>${good ? '¡Bien resuelto!' : 'Buena oportunidad para aprender'}</strong></div><p>${esc(feedback.explanation || q.explanation || '')}</p>${alternatives ? `<details><summary>¿Qué pasa con las otras alternativas?</summary><ul>${alternatives}</ul></details>` : ''}${!good ? `<p class="correct-answer">Respuesta correcta: <strong>${String.fromCharCode(65 + feedback.correctIndex)}. ${esc(q.options[feedback.correctIndex])}</strong></p>` : ''}</div>`;
}
function quizView() {
  if (!state.questions.length) return emptyState('✳', 'No hay preguntas aquí todavía.', 'Elige otro tema para seguir practicando.', 'topics', 'Ver temas');
  if (state.index >= state.questions.length) return finishView();
  return `<div class="page quiz-page">${questionCard(state.questions[state.index], state.index, state.questions.length, state.mode, state.answer, state.feedback)}</div>`;
}
function finishView() {
  const type = state.mode === 'challenge' ? 'reto' : state.mode === 'mistakes' ? 'repaso' : 'práctica';
  return `<div class="page finish-page"><div class="finish-card"><span class="finish-spark">✳</span><span class="eyebrow">SESIÓN COMPLETADA</span><h1>¡Bien hecho!</h1><p>Terminaste este ${type}. Lo valioso es entender cada respuesta y volver a intentarlo.</p><div class="finish-actions"><button class="button button-primary" data-nav="topics">Practicar otro tema ${svg('arrow', 18)}</button><button class="button button-outline" data-nav="home">Ver mi progreso</button></div></div></div>`;
}
function mistakesView() {
  const questions = state.mistakes || [];
  return `<div class="page">${sectionHeading('APRENDER TAMBIÉN ES VOLVER', 'Mis errores.', 'Aquí aparecen las preguntas falladas hasta que vuelvas a responderlas correctamente.')}${questions.length ? `<div class="review-intro"><div><strong>${questions.length} ${questions.length === 1 ? 'pregunta' : 'preguntas'} por revisar</strong><p>Repásalas a tu ritmo. Un acierto las retira de esta lista.</p></div><button class="button button-primary" data-action="start-mistakes">Empezar repaso ${svg('arrow', 18)}</button></div><div class="review-list">${questions.map((q, i) => `<article class="review-item"><span class="review-number">${String(i + 1).padStart(2, '0')}</span><div><span>${esc(topic(q.topicId)?.title || 'Tema')}</span><h3>${esc(q.prompt)}</h3></div>${svg('arrow', 18)}</article>`).join('')}</div>` : emptyState('✦', 'Tu lista está al día.', 'Cuando una pregunta te cueste, aparecerá aquí para que puedas reforzarla.', 'topics', 'Ir a practicar')}</div>`;
}
function examIntroView() {
  return `<div class="page">${sectionHeading('PONTE A PRUEBA', 'Simulacro.', 'Un espacio separado de la práctica para medir tu avance con tiempo.')}
    <div class="exam-intro"><div class="exam-illustration"><div class="exam-circle">${svg('target', 54)}</div><span class="exam-deco one">✦</span><span class="exam-deco two">✳</span></div><div><span class="eyebrow">ANTES DE EMPEZAR</span><h2>Concéntrate en una pregunta a la vez.</h2><p>Responderás hasta 10 preguntas de los temas disponibles. Tendrás 8 minutos. Al terminar verás tu resultado y las explicaciones.</p><div class="exam-facts"><span>${svg('book', 18)} Hasta 10 preguntas</span><span>${svg('clock', 18)} 8 minutos</span><span>${svg('target', 18)} Resultado al final</span></div><button class="button button-dark" data-action="start-exam">Iniciar simulacro ${svg('arrow', 18)}</button><small>Simulacro de demostración con preguntas propias. No reproduce un examen oficial.</small></div></div></div>`;
}
function examResultView() {
  const result = state.examResult;
  const count = result.questions.length;
  return `<div class="page result-page"><div class="result-hero"><span class="eyebrow">SIMULACRO COMPLETADO</span><h1>Tu resultado: <em>${result.correct}/${count}</em></h1><p>Revisa cada respuesta y sigue practicando los temas que más necesitas.</p><div class="result-actions"><button class="button button-dark" data-nav="topics">Practicar por tema ${svg('arrow', 18)}</button><button class="button button-light" data-nav="home">Mi espacio</button></div></div><div class="result-list"><h2>Revisión de respuestas</h2>${result.questions.map((q, i) => {
    const selected = result.answers[i];
    const good = selected === q.correctIndex;
    return `<article class="result-item"><div class="result-item-head"><span class="result-status ${good ? 'good' : 'wrong'}">${good ? '✓ Correcta' : '↗ Por repasar'}</span><span>Pregunta ${i + 1}</span></div><h3>${esc(q.prompt)}</h3><p>Tu respuesta: <strong>${selected === null ? 'Sin responder' : esc(q.options[selected])}</strong></p><p>Respuesta correcta: <strong>${esc(q.options[q.correctIndex])}</strong></p><div class="result-explanation">${esc(q.explanation)}${q.optionExplanations?.length ? `<ul>${q.optionExplanations.map((detail, j) => detail ? `<li><strong>${String.fromCharCode(65 + j)}:</strong> ${esc(detail)}</li>` : '').join('')}</ul>` : ''}</div></article>`;
  }).join('')}</div></div>`;
}
function accountView() {
  const email = state.session?.user?.email;
  if (email) return `<div class="page account-page">${sectionHeading('TU CUENTA', 'Hola de nuevo.', 'Tu sesión está activa y tu avance se guarda en tu cuenta.')}<div class="account-card"><div class="avatar-large">${initials(email)}</div><div><span>Sesión iniciada como</span><strong>${esc(email)}</strong></div><button class="button button-outline" data-action="signout">Cerrar sesión</button></div></div>`;
  const disabled = !isConfigured;
  return `<div class="page account-page">${sectionHeading('TU CUENTA', 'Estudia a tu manera.', isConfigured ? 'Entra para guardar tu progreso y continuar desde tu cuenta.' : 'Explora la demostración. El acceso con correo estará disponible cuando se conecte Supabase.')}
    <div class="account-layout"><div class="auth-card"><div class="auth-tabs"><button class="${state.authTab === 'signin' ? 'active' : ''}" data-auth-tab="signin">Ingresar</button><button class="${state.authTab === 'signup' ? 'active' : ''}" data-auth-tab="signup">Crear cuenta</button></div><h2>${state.authTab === 'signin' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}</h2><p>${state.authTab === 'signin' ? 'Continúa desde donde te quedaste.' : 'Empieza a construir tu ruta de estudio.'}</p><form id="auth-form"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" placeholder="tu@correo.com" required ${disabled ? 'disabled' : ''}/><label for="password">Contraseña</label><input id="password" name="password" type="password" autocomplete="${state.authTab === 'signin' ? 'current-password' : 'new-password'}" minlength="6" placeholder="Mínimo 6 caracteres" required ${disabled ? 'disabled' : ''}/><button class="button button-primary full" type="submit" ${disabled || state.busy ? 'disabled' : ''}>${state.authTab === 'signin' ? 'Ingresar' : 'Crear cuenta'} ${svg('arrow', 18)}</button></form>${state.authTab === 'signin' ? `<button class="forgot-link" data-action="show-recovery" ${disabled ? 'disabled' : ''}>Olvidé mi contraseña</button>` : '<small>Es posible que debas confirmar tu correo antes de ingresar.</small>'}</div><div class="account-side"><span class="account-side-icon">✦</span><h2>Tu avance, en tus manos.</h2><p>Con una cuenta conectada podrás conservar tus respuestas, revisar tus errores y retomar tu preparación.</p><div class="side-lines"><span></span><span></span><span></span></div>${disabled ? '<div class="demo-explainer"><strong>Modo demostración</strong><p>Las respuestas se guardan solo en este navegador. El acceso con correo aún no está conectado.</p></div>' : ''}</div></div></div>`;
}
function recoveryView() {
  return `<div class="page account-page">${sectionHeading('RECUPERAR ACCESO', 'Volvamos a empezar.', 'Te enviaremos un enlace para crear una nueva contraseña.')}<div class="auth-card recovery-card"><form id="recovery-form"><label for="recovery-email">Correo electrónico</label><input id="recovery-email" name="email" type="email" autocomplete="email" placeholder="tu@correo.com" required/><button class="button button-primary full" type="submit" ${state.busy ? 'disabled' : ''}>Enviar enlace ${svg('arrow', 18)}</button></form><button class="forgot-link" data-nav="account">← Volver a ingresar</button></div></div>`;
}
function passwordUpdateView() {
  return `<div class="page account-page">${sectionHeading('NUEVA CONTRASEÑA', 'Recupera tu acceso.', 'Escribe una nueva contraseña para terminar la recuperación.')}<div class="auth-card recovery-card"><form id="password-update-form"><label for="new-password">Nueva contraseña</label><input id="new-password" name="password" type="password" autocomplete="new-password" minlength="6" placeholder="Mínimo 6 caracteres" required/><button class="button button-primary full" type="submit" ${state.busy ? 'disabled' : ''}>Guardar contraseña ${svg('arrow', 18)}</button></form></div></div>`;
}
function render() {
  let content;
  switch (state.view) {
    case 'topics': content = topicsView(); break;
    case 'quiz': content = quizView(); break;
    case 'mistakes': content = mistakesView(); break;
    case 'exam': content = examIntroView(); break;
    case 'exam-result': content = examResultView(); break;
    case 'account': content = accountView(); break;
    case 'recovery': content = recoveryView(); break;
    case 'password-update': content = passwordUpdateView(); break;
    default: content = homeView();
  }
  app.innerHTML = shell(content);
}

async function refreshProgress() { state.progress = await getProgress(); }
async function startQuestions(mode, topicId) {
  setBusy(true);
  try {
    let questions = mode === 'mistakes' ? await getMistakes() : await getQuestions(topicId);
    if (mode === 'challenge') questions = questions.slice(0, 5);
    state.questions = questions; state.topicId = topicId; state.mode = mode;
    state.index = 0; state.answer = null; state.feedback = null; state.view = 'quiz';
    state.notice = questions.length ? '' : 'Todavía no hay preguntas disponibles en este tema.';
  } catch (error) { state.notice = error.message || 'No se pudieron cargar las preguntas.'; }
  finally { state.busy = false; render(); window.scrollTo(0, 0); }
}
async function startChallenge() {
  const topics = allTopics();
  const groups = await Promise.all(topics.map(item => getQuestions(item.id)));
  const questions = groups.flat().sort((a, b) => a.id.localeCompare(b.id)).slice(0, 5);
  state.questions = questions; state.topicId = null; state.mode = 'challenge';
  state.index = 0; state.answer = null; state.feedback = null; state.view = 'quiz'; render();
}
async function startExam() {
  setBusy(true);
  try {
    const groups = await Promise.all(allTopics().map(item => getQuestions(item.id)));
    const questions = groups.flat().sort(() => Math.random() - .5).slice(0, 10);
    if (!questions.length) { state.notice = 'Aún no hay preguntas para el simulacro.'; return; }
    state.questions = questions; state.examAnswers = []; state.examResult = null;
    state.mode = 'exam'; state.index = 0; state.answer = null; state.feedback = null;
    state.examEndsAt = Date.now() + 8 * 60 * 1000; state.view = 'quiz';
    stopTimer();
    state.timer = setInterval(() => {
      const clock = document.querySelector('#exam-timer');
      if (clock) clock.innerHTML = `${svg('clock', 18)} ${formatTime(timeLeft())}`;
      if (!timeLeft()) finishExam();
    }, 1000);
  } catch (error) { state.notice = error.message || 'No se pudo iniciar el simulacro.'; }
  finally { state.busy = false; render(); window.scrollTo(0, 0); }
}
async function finishExam() {
  if (state.examResult || state.busy) return;
  stopTimer(); state.busy = true; render();
  try {
    const answers = state.examAnswers.slice();
    if (state.index < state.questions.length) answers[state.index] = state.answer;
    while (answers.length < state.questions.length) answers.push(null);
    let correct = 0;
    for (let i = 0; i < state.questions.length; i++) {
      const q = state.questions[i];
      if (answers[i] === q.correctIndex) correct++;
      if (answers[i] !== null) await recordAnswer({ questionId: q.id, selectedIndex: answers[i], mode: 'mock' });
    }
    state.examResult = { questions: state.questions, answers, correct };
    await refreshProgress(); state.view = 'exam-result';
  } catch (error) { state.notice = error.message || 'No se pudo guardar el resultado.'; }
  finally { state.busy = false; render(); window.scrollTo(0, 0); }
}

app.addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button || button.disabled || state.busy) return;
  const view = button.dataset.nav;
  if (view) {
    if (view === 'challenge') { try { await startChallenge(); } catch (error) { setNotice(error.message); } return; }
    if (view === 'mistakes') { try { state.mistakes = await getMistakes(); } catch (error) { state.mistakes = []; state.notice = error.message; } }
    nav(view); return;
  }
  const authTab = button.dataset.authTab;
  if (authTab) { state.authTab = authTab; render(); return; }
  const action = button.dataset.action;
  if (action === 'dismiss-notice') return closeNotice();
  if (action === 'start-practice') return startQuestions('practice', button.dataset.topic);
  if (action === 'start-mistakes') return startQuestions('mistakes');
  if (action === 'start-exam') return startExam();
  if (action === 'show-recovery') return nav('recovery');
  if (action === 'signout') {
    try { setBusy(true); await signOut(); state.session = null; await refreshProgress(); state.view = 'account'; state.notice = 'Sesión cerrada.'; }
    catch (error) { state.notice = error.message; }
    finally { state.busy = false; render(); }
    return;
  }
  if (action === 'choose') { state.answer = Number(button.dataset.choice); render(); return; }
  if (action === 'check-answer') {
    if (state.answer === null || state.feedback) return;
    const q = state.questions[state.index];
    try { setBusy(true); state.feedback = await recordAnswer({ questionId: q.id, selectedIndex: state.answer, mode: state.mode === 'mistakes' ? 'practice' : state.mode }); await refreshProgress(); }
    catch (error) { state.notice = error.message || 'No se pudo guardar la respuesta.'; }
    finally { state.busy = false; render(); }
    return;
  }
  if (action === 'next-question') { state.index++; state.answer = null; state.feedback = null; render(); window.scrollTo(0, 0); return; }
  if (action === 'exam-next') {
    if (state.answer === null) return;
    state.examAnswers[state.index] = state.answer;
    if (state.index + 1 === state.questions.length) return finishExam();
    state.index++; state.answer = null; render(); window.scrollTo(0, 0);
  }
});

app.addEventListener('submit', async event => {
  if (!['auth-form', 'recovery-form', 'password-update-form'].includes(event.target.id)) return;
  event.preventDefault();
  const data = new FormData(event.target);
  const email = String(data.get('email') || '').trim();
  const password = String(data.get('password') || '');
  try {
    setBusy(true);
    if (event.target.id === 'password-update-form') {
      await updatePassword(password);
      history.replaceState({}, '', location.pathname + location.search);
      state.notice = 'Contraseña actualizada. Ya puedes continuar.';
      state.view = 'account';
    } else if (event.target.id === 'recovery-form') {
      await resetPassword(email);
      state.notice = 'Si ese correo está registrado, recibirás un enlace de recuperación.';
      state.view = 'account';
    } else if (state.authTab === 'signup') {
      await signUp(email, password);
      state.session = await getSession();
      state.notice = state.session ? 'Cuenta creada. ¡Bienvenido!' : 'Revisa tu correo para confirmar la cuenta antes de ingresar.';
      if (state.session) await refreshProgress();
    } else {
      await signIn(email, password);
      state.session = await getSession(); await refreshProgress();
      state.notice = 'Sesión iniciada.'; state.view = 'home';
    }
  } catch (error) { state.notice = error.message || 'No se pudo completar la acción.'; }
  finally { state.busy = false; render(); }
});

async function init() {
  app.innerHTML = '<div class="loading-screen"><span class="brand-mark">✦</span><p>Preparando tu espacio de estudio...</p></div>';
  try {
    [state.catalog, state.progress, state.session] = await Promise.all([getCatalog(), getProgress(), getSession()]);
    if (!state.catalog?.courses) state.catalog = { courses: [] };
    if (isConfigured && /(?:#|&)type=recovery(?:&|$)/.test(location.hash)) state.view = 'password-update';
  } catch (error) { state.notice = error.message || 'No se pudo cargar el contenido.'; }
  render();
}
init();
