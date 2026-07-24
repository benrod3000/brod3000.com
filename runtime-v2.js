/**
 * brod3000.com Runtime v2
 * ES module. Handles: canvas ambient animation, navigation behavior.
 * Uses Intersection Observer for scroll-driven effects (replaces GSAP).
 */

// ============================================================================
// CANVAS AMBIENT ANIMATION
// ============================================================================

/** @type {HTMLCanvasElement|null} */
let ambientCanvas = null;
/** @type {CanvasRenderingContext2D|null} */
let ctx = null;
/** @type {HTMLCanvasElement|null} */
let bufferCanvas = null;
/** @type {CanvasRenderingContext2D|null} */
let bCtx = null;
/** @type {Float32Array} */
let particles;
let animFrameId = null;
const PARTICLE_PROPS = 8;
const DESKTOP_COUNT = 150;
const MOBILE_COUNT = 90;
const RES_CAP = 2048;

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let lowPowerViewport = window.matchMedia('(max-width: 768px)');

function getAccentHue() {
  if (!ambientCanvas) return 156;
  const style = getComputedStyle(ambientCanvas);
  const h = parseInt(style.getPropertyValue('--accent-h'), 10);
  return isNaN(h) ? 156 : h;
}

function resizeCanvas() {
  if (!ambientCanvas || !ctx || !bCtx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, RES_CAP / Math.max(window.innerWidth, window.innerHeight));
  const w = window.innerWidth;
  const h = window.innerHeight;
  ambientCanvas.width = w * dpr;
  ambientCanvas.height = h * dpr;
  ambientCanvas.style.width = w + 'px';
  ambientCanvas.style.height = h + 'px';   // was 'dvh' — h is a pixel count, so this set height:900dvh and stretched the backing store ~9x vertically.
  bufferCanvas.width = w * dpr;
  bufferCanvas.height = h * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  bCtx.setTransform(1, 0, 0, 1, 0, 0);
}

function createParticles(count) {
  particles = new Float32Array(count * PARTICLE_PROPS);
  const accentHue = getAccentHue();
  for (let i = 0; i < count; i++) {
    const offset = i * PARTICLE_PROPS;
    particles[offset] = Math.random() * (ambientCanvas?.width || window.innerWidth);
    particles[offset + 1] = Math.random() * (ambientCanvas?.height || window.innerHeight);
    particles[offset + 2] = (Math.random() - 0.5) * 0.5;
    particles[offset + 3] = (Math.random() - 0.5) * 0.5;
    particles[offset + 4] = 0;
    particles[offset + 5] = 80 + Math.random() * 200;
    particles[offset + 6] = 1 + Math.random() * 2.5;
    particles[offset + 7] = accentHue + (Math.random() - 0.5) * 40;
  }
}

function drawFrame() {
  if (!ctx || !bCtx || !ambientCanvas || !bufferCanvas) return;
  const w = ambientCanvas.width;
  const h = ambientCanvas.height;
  const count = particles.length / PARTICLE_PROPS;
  const accentHue = getAccentHue();
  bCtx.clearRect(0, 0, w, h);
  for (let i = 0; i < count; i++) {
    const offset = i * PARTICLE_PROPS;
    const px = particles[offset];
    const py = particles[offset + 1];
    let life = particles[offset + 4];
    const ttl = particles[offset + 5];
    particles[offset] += particles[offset + 2];
    particles[offset + 1] += particles[offset + 3];
    life++;
    particles[offset + 4] = life;
    if (life >= ttl || px < -20 || px > w + 20 || py < -20 || py > h + 20) {
      particles[offset] = Math.random() * w;
      particles[offset + 1] = Math.random() * h;
      particles[offset + 2] = (Math.random() - 0.5) * 0.5;
      particles[offset + 3] = (Math.random() - 0.5) * 0.5;
      particles[offset + 4] = 0;
      particles[offset + 5] = 80 + Math.random() * 200;
      particles[offset + 6] = 1 + Math.random() * 2.5;
      particles[offset + 7] = accentHue + (Math.random() - 0.5) * 40;
    }
    let alpha = 1;
    const fadeIn = Math.min(ttl * 0.15, 60);
    const fadeOut = Math.max(ttl * 0.15, 40);
    if (life < fadeIn) alpha = life / fadeIn;
    else if (life > ttl - fadeOut) alpha = (ttl - life) / fadeOut;
    alpha = Math.max(0, Math.min(1, alpha));
    bCtx.beginPath();
    bCtx.arc(px, py, particles[offset + 6], 0, Math.PI * 2);
    bCtx.fillStyle = `hsla(${particles[offset + 7]}, 50%, 39%, ${alpha * 0.6})`;
    bCtx.fill();
  }
  ctx.clearRect(0, 0, w, h);
  ctx.filter = `blur(${lowPowerViewport.matches ? 38 : 52}px)`;
  ctx.drawImage(bufferCanvas, 0, 0);
  ctx.filter = 'blur(0px)';
  ctx.globalAlpha = 0.32;
  ctx.drawImage(bufferCanvas, 0, 0);
  ctx.globalAlpha = 1;
  animFrameId = requestAnimationFrame(drawFrame);
}

function startCanvas() {
  if (reducedMotionQuery.matches) { drawFrame(); if (animFrameId) cancelAnimationFrame(animFrameId); animFrameId = null; return; }
  if (animFrameId) cancelAnimationFrame(animFrameId);
  drawFrame();
}

function stopCanvas() {
  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
  if (ambientCanvas && ctx) { ambientCanvas.width = 0; ambientCanvas.height = 0; ctx.clearRect(0, 0, 0, 0); }
  if (bufferCanvas && bCtx) { bufferCanvas.width = 0; bufferCanvas.height = 0; }
}

function initAmbientCanvas() {
  ambientCanvas = document.getElementById('ambient-canvas');
  if (!ambientCanvas) return;
  ctx = ambientCanvas.getContext('2d');
  if (!ctx) return;
  bufferCanvas = document.createElement('canvas');
  bCtx = bufferCanvas.getContext('2d');
  if (!bCtx) return;
  resizeCanvas();
  createParticles(lowPowerViewport.matches ? MOBILE_COUNT : DESKTOP_COUNT);
  startCanvas();
  window.addEventListener('resize', () => resizeCanvas());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopCanvas();
    else { resizeCanvas(); startCanvas(); }
  });
  reducedMotionQuery.addEventListener('change', () => {
    if (reducedMotionQuery.matches) { stopCanvas(); if (ambientCanvas && ctx && bufferCanvas && bCtx) { resizeCanvas(); drawFrame(); } }
    else { resizeCanvas(); startCanvas(); }
  });
}

// ============================================================================
// NAVIGATION
// ============================================================================

let navTop = null;

function onScroll() {
  if (!navTop) return;
  navTop.classList.toggle('is-scrolled', window.scrollY > 60);
}

function initNav() {
  navTop = document.getElementById('nav-top');
  if (!navTop) return;
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ============================================================================
// SCROLL REVEAL ANIMATIONS
// ============================================================================

function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  if (!revealElements.length) return;
  // Fallback ONLY where IO is unsupported. An unconditional timer revealed
  // everything below the fold before the user scrolled there, so the
  // choreography only played for chapter 01.
  if (!('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('revealed'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealElements.forEach(el => observer.observe(el));
}

// ============================================================================
// NAV ACTIVE SECTION TRACKING
// ============================================================================

function initNavTracking() {
  const sections = document.querySelectorAll('main section[id]');
  // Queried AFTER initMobileNav so the cloned drawer links are included.
  const navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;
  const visible = new Map();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.set(entry.target, entry.intersectionRect.height);
      else visible.delete(entry.target);
    });
    let best = null, bestHeight = 0;
    visible.forEach((height, el) => { if (height > bestHeight) { bestHeight = height; best = el; } });
    if (!best) return;
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + best.id));
    // threshold 0, NOT 0.3. With the root shrunk to ~40% of the viewport,
    // a section taller than ~1.3 viewports can never expose 30% of ITSELF,
    // so the old config silently never fired.
  }, { threshold: 0, rootMargin: '-20% 0px -60% 0px' });
  sections.forEach(section => observer.observe(section));
}

// ============================================================================
// MOBILE NAV DRAWER
// ============================================================================

let mobileNavToggle = null;
let mobileNavDrawer = null;

function toggleMobileNav() {
  if (!mobileNavDrawer) return;
  const isOpen = mobileNavDrawer.classList.toggle('is-open');
  mobileNavDrawer.setAttribute('aria-hidden', String(!isOpen));
  if (mobileNavToggle) mobileNavToggle.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeMobileNav() {
  if (!mobileNavDrawer || !mobileNavDrawer.classList.contains('is-open')) return;
  mobileNavDrawer.classList.remove('is-open');
  mobileNavDrawer.setAttribute('aria-hidden', 'true');
  if (mobileNavToggle) mobileNavToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

function initMobileNav() {
  const nav = document.getElementById('nav-top');
  if (!nav) return;
  const navInner = nav.querySelector('.nav-inner');
  if (!navInner) return;
  mobileNavToggle = document.createElement('button');
  mobileNavToggle.type = 'button';
  mobileNavToggle.className = 'mobile-nav-toggle';
  mobileNavToggle.setAttribute('aria-label', 'Toggle navigation menu');
  mobileNavToggle.setAttribute('aria-expanded', 'false');
  mobileNavToggle.innerHTML = '<span></span><span></span><span></span>';
  mobileNavToggle.addEventListener('click', toggleMobileNav);
  navInner.appendChild(mobileNavToggle);
  const navLinks = nav.querySelector('.nav-links');
  if (!navLinks) return;
  mobileNavDrawer = document.createElement('div');
  mobileNavDrawer.className = 'mobile-nav-drawer';
  mobileNavDrawer.setAttribute('aria-hidden', 'true');
  mobileNavDrawer.innerHTML = navLinks.innerHTML;
  mobileNavDrawer.addEventListener('click', (e) => { if (e.target === mobileNavDrawer) closeMobileNav(); });
  mobileNavDrawer.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileNav));
  nav.appendChild(mobileNavDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMobileNav(); });
}

// ============================================================================
// CONTACT FORM
// ============================================================================

let contactForm = null;

function showFormStatus(type, message) {
  const status = document.getElementById('form-status');
  if (!status) return;
  status.textContent = message;
  status.className = 'form-status form-status--' + type;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('.form-submit');
  const formData = new FormData(form);
  if (submitBtn) submitBtn.classList.add('is-loading');
  showFormStatus('ok', '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(form.action, { method: 'POST', body: formData, signal: controller.signal, headers: { 'Accept': 'application/json' } });
    clearTimeout(timeout);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.errors?.map(e => e.message).join(', ') || 'Something went wrong.');
    }
    showFormStatus('ok', "Message sent. I'll get back to you soon.");
    form.reset();
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error
      ? (err.name === 'AbortError' ? 'Request timed out. Please try again or email me directly.' : err.message)
      : 'Something went wrong. Please email me directly at ben@brod3000.com.';
    showFormStatus('error', message);
  } finally {
    if (submitBtn) submitBtn.classList.remove('is-loading');
  }
}

function initContactForm() {
  contactForm = document.getElementById('contact-form');
  if (!contactForm) return;
  contactForm.addEventListener('submit', handleFormSubmit);
}

function initFooterYear() {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

document.addEventListener('DOMContentLoaded', () => {
  initAmbientCanvas();
  initNav();
  initScrollReveal();
  initMobileNav();     // MUST run before initNavTracking — it clones .nav-link
  initNavTracking();   // into the drawer, and tracking caches the link list.
  initContactForm();
  initFooterYear();
});
