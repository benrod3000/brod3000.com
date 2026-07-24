/**
 * brod3000.com Runtime v2
 * ES module. Navigation, scroll reveals, form handling.
 * Ambient background is now a static CSS gradient mesh. Zero JS.
 */

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

  // Make background content inert while drawer is open
  const main = document.getElementById('main');
  if (main) {
    if (isOpen) main.setAttribute('inert', '');
    else main.removeAttribute('inert');
  }

  // Focus trap: move focus into drawer, or restore to toggle
  if (isOpen) {
    const firstLink = mobileNavDrawer.querySelector('a');
    if (firstLink) firstLink.focus();
  } else if (mobileNavToggle) {
    mobileNavToggle.focus();
  }
}

function closeMobileNav() {
  if (!mobileNavDrawer || !mobileNavDrawer.classList.contains('is-open')) return;
  mobileNavDrawer.classList.remove('is-open');
  mobileNavDrawer.setAttribute('aria-hidden', 'true');
  if (mobileNavToggle) mobileNavToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';

  const main = document.getElementById('main');
  if (main) main.removeAttribute('inert');
  if (mobileNavToggle) mobileNavToggle.focus();
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

  // Focus trap: Tab/Shift+Tab cycle within drawer
  mobileNavDrawer.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const links = mobileNavDrawer.querySelectorAll('a');
    if (!links.length) return;
    const first = links[0];
    const last = links[links.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

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

function initLegalModal() {
  const modal = document.getElementById('legal-modal');
  const content = document.getElementById('legal-modal-content');
  const closeBtn = modal?.querySelector('.legal-modal-close');
  const backdrop = modal?.querySelector('.legal-modal-backdrop');
  if (!modal || !content) return;

  function open(slug) {
    const source = document.getElementById('legal-content-' + slug);
    if (!source) return;
    content.innerHTML = source.innerHTML;
    const oldTitle = document.getElementById('legal-modal-title');
    if (oldTitle) oldTitle.removeAttribute('id');
    const h2 = content.querySelector('h2');
    if (h2) h2.id = 'legal-modal-title';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });

  document.querySelectorAll('[data-modal]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      open(link.dataset.modal);
    });
  });
}

function initFooterYear() {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollReveal();
  initMobileNav();     // MUST run before initNavTracking. It clones .nav-link.
  initNavTracking();   // into the drawer, and tracking caches the link list.
  initContactForm();
  initFooterYear();
  initLegalModal();
});
