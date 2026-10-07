const settingKey = 'educacion-fisica:review-notifications:v1';
const sentKey = 'educacion-fisica:review-notified:v1';

export function remindersEnabled() { return localStorage.getItem(settingKey) === 'on'; }
export function disableReminders() { localStorage.setItem(settingKey, 'off'); }

export async function enableReminders() {
  if (!('Notification' in window) || !window.isSecureContext) throw new Error('Este navegador necesita HTTPS o localhost para mostrar notificaciones.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('No se concedió el permiso. Puedes activarlo desde la configuración del navegador.');
  localStorage.setItem(settingKey, 'on');
}

export async function notifyDueReviews(plan) {
  if (!remindersEnabled() || !plan.due.length || !('Notification' in window) || Notification.permission !== 'granted') return;
  const today = new Date().toLocaleDateString('en-CA');
  const fingerprint = `${today}:${plan.due.map(item => item.id).sort().join(',')}`;
  if (localStorage.getItem(sentKey) === fingerprint) return;
  const title = 'Tienes preguntas por repasar';
  const body = `${plan.due.length} ${plan.due.length === 1 ? 'pregunta te espera' : 'preguntas te esperan'} en Educación Física.`;
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
      await registration.showNotification(title, { body, tag: 'repaso-educacion-fisica' });
    } else {
      new Notification(title, { body, tag: 'repaso-educacion-fisica' });
    }
    localStorage.setItem(sentKey, fingerprint);
  } catch {
    // La lista de repasos sigue disponible aunque el sistema bloquee el aviso.
  }
}
