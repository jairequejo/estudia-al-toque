let registration;
let applying = false;

export async function initPwa(onUpdate) {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return false;
  registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' });
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) onUpdate();
    });
  });
  if (registration.waiting) onUpdate();
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (applying) window.location.reload();
  });
  return true;
}

export async function checkForUpdate() {
  const response = await fetch(`${import.meta.env.BASE_URL}version.json?check=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('No se pudo consultar la versión publicada.');
  const { build } = await response.json();
  if (registration) await registration.update();
  return Boolean(registration?.waiting || build !== __APP_BUILD__);
}

export function applyUpdate() {
  applying = true;
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    setTimeout(() => window.location.reload(), 4000);
  } else {
    window.location.reload();
  }
}

export const currentBuild = __APP_BUILD__;
