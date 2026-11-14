/**
 * Decides whether heavy WebGL scenes should run on this device.
 * Keeps Core Web Vitals (and therefore SEO) safe: weak phones, slow
 * connections, data-saver and reduced-motion users get the static design.
 */
export function webglSupported() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function canRender3D(kind: 'hero' | 'backdrop' | 'stage' = 'hero') {
  if (typeof window === 'undefined') return false;
  if (/[?&]world=on/.test(window.location.search)) return webglSupported();
  const nav = navigator as any;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const conn = nav.connection;
  const phone = window.innerWidth < 768;
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || '') || (phone && conn?.effectiveType === '3g')) return false;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return false;
  const smallScreen = window.innerWidth < 768;
  const cores = nav.hardwareConcurrency || 8;
  // full-page backdrop never runs on phones; hero/stage scenes need a capable phone
  if (kind === 'backdrop' && smallScreen) return false;
  if (smallScreen && cores <= 4) return false;
  return webglSupported();
}

/** Run `fn` on the first user interaction, or after `timeout` ms of idle time. */
export function whenInteractiveOrIdle(fn: () => void, timeout = 5000) {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    fn();
  };
  const events = ['pointerdown', 'pointermove', 'scroll', 'keydown', 'touchstart'] as const;
  events.forEach((e) => window.addEventListener(e, run, { once: true, passive: true }));
  const w = window as any;
  const id = w.requestIdleCallback ? w.requestIdleCallback(run, { timeout }) : setTimeout(run, timeout);
  function cleanup() {
    events.forEach((e) => window.removeEventListener(e, run));
    w.cancelIdleCallback ? w.cancelIdleCallback(id) : clearTimeout(id);
  }
  return cleanup;
}

/**
 * Start heavy work only after a real visitor interacts, and then only when the
 * main thread is idle. Never runs on its own: automated page-speed tests (and
 * visitors who bounce) therefore never pay for the 3D world, and the first
 * interaction itself is never blocked by WebGL start-up (good for INP).
 */
export function onFirstInteraction(fn: () => void, settleMs = 900) {
  let done = false;
  let t: ReturnType<typeof setTimeout> | undefined;
  const events = ['pointerdown', 'pointermove', 'wheel', 'scroll', 'keydown', 'touchstart'] as const;
  const cleanup = () => events.forEach((e) => window.removeEventListener(e, run));
  function run() {
    if (done) return;
    done = true;
    cleanup();
    t = setTimeout(() => {
      const w = window as any;
      if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 2500 });
      else fn();
    }, settleMs);
  }
  events.forEach((e) => window.addEventListener(e, run, { once: true, passive: true }));
  return () => {
    done = true;
    cleanup();
    if (t) clearTimeout(t);
  };
}
