/**
 * @fileoverview SPA runtime — section routing, canvas, animations, forms.
 */

// Declare global gtag for TypeScript — gtag-init.js provides the implementation.
/** @type {function(...*): void} */
var gtag;

const cardShell = document.querySelector('.digital-container');
const stage = document.getElementById('card-content-wrapper');

// If the wrapper is missing, log an error and stop.
if (!stage) {
  console.error('Main content wrapper (#card-content-wrapper) not found.');
} else {
  stage.classList.add('has-js-content');
}

const rotator = document.getElementById('sidebar-rotator');
const cursor = document.getElementById('ui-cursor');
const ambientCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById('ambient-canvas'));
const profileCard = document.querySelector('.profile-card');
const railNav = document.querySelector('.rail-nav');
const railTabs = [...document.querySelectorAll('.rail-tab')];
/* The footer lives inside the scrolling stage, which gets wiped on each section
   change, so keep a handle and re-append it as the last child after every mount. */
const workspaceFooter = document.querySelector('.workspace-footer');
const placeFooter = () => {
  if (workspaceFooter && stage) {
    stage.appendChild(workspaceFooter);
    // Keep the copyright year current — the static fallback in index.html
    // uses a hardcoded year, but the runtime always updates it on mount.
    const yearSpan = workspaceFooter.querySelector('span');
    if (yearSpan) {
      yearSpan.textContent = `© ${new Date().getFullYear()} BR. All rights reserved.`;
    }
  }
};
const radialTrigger = document.querySelector('.radial-trigger');
const interactiveTargets = () => document.querySelectorAll('.rail-tab, .workspace-back, .profile-cta, .profile-socials a, .contact-form button');
const phrases = ['Growth Systems Architect', 'Audience Ownership Strategist', 'Paid + Organic Scale Operator'];
let bindCursorTargets = () => {};
let phraseIndex = 0;
let currentSection = /** @type {string|null} */ (null);
let workflowPulseInterval = /** @type {number|null} */ (null);
const compactProfileQuery = window.matchMedia('(max-width: 920px)');
const compactProfileThreshold = 36;
const dockScrollThreshold = 18;

/* =========================================================================
   ERROR SURFACE — logs to console and reports to GA
   ========================================================================= */

/**
 * @param {string} scope
 * @param {Error|string} error
 */
function reportError(scope, error) {
  console.error('[' + scope + ']', error);
  if (typeof gtag === 'function') {
    gtag('event', 'exception', {
      description: scope + ': ' + (error?.message ?? String(error)),
      fatal: false,
    });
  }
}

window.addEventListener('error', (e) => reportError('window', e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => reportError('promise', e.reason));

function initAmbientCanvas() {
  if (!ambientCanvas) {
    return;
  }

  const viewCtx = ambientCanvas.getContext('2d', { alpha: true });
  if (!viewCtx) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const lowPowerViewport = window.matchMedia('(max-width: 768px)');
  const rootStyles = getComputedStyle(document.documentElement);
  const accentHue = Number.parseFloat(rootStyles.getPropertyValue('--accent-h')) || 156;
  const canvasSat = rootStyles.getPropertyValue('--canvas-sat').trim() || '50%';
  const canvasLight = rootStyles.getPropertyValue('--canvas-light').trim() || '39%';
  const canvasAlphaBase = Number.parseFloat(rootStyles.getPropertyValue('--canvas-alpha')) || 0.16;

  const TAU = Math.PI * 2;
  const propCount = 8;
  const baseSpeed = 0.08;
  const rangeSpeed = 0.6;
  const baseTtl = 140;
  const rangeTtl = 180;
  const baseRadius = 72;
  const rangeRadius = 170;
  const rangeHue = 55;
  const xOff = 0.0015;
  const yOff = 0.0015;
  const zOff = 0.0015;

  const bufferCanvas = document.createElement('canvas');
  const bufferCtx = bufferCanvas.getContext('2d', { alpha: true });
  if (!bufferCtx) {
    return;
  }

  let rafId = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let circleCount = 0;
  let circleProps = /** @type {Float32Array} */ (null);
  let baseHue = accentHue;

  /** @param {number} n */
  const rand = (n) => Math.random() * n;
  /** @param {number} t @param {number} ttl */
  const fadeInOut = (t, ttl) => {
    const half = 0.5 * ttl;
    return Math.abs(((t + half) % ttl) - half) / half;
  };

  const pseudoNoise3D = (x, y, z) => {
    const value = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  };

  function initCircle(offset) {
    const x = rand(width);
    const y = rand(height);
    const n = pseudoNoise3D(x * xOff, y * yOff, baseHue * zOff);
    const angle = rand(TAU);
    const speed = baseSpeed + rand(rangeSpeed);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const life = 0;
    const ttl = baseTtl + rand(rangeTtl);
    const radius = baseRadius + rand(rangeRadius);
    const hue = baseHue + n * rangeHue;

    circleProps[offset] = x;
    circleProps[offset + 1] = y;
    circleProps[offset + 2] = vx;
    circleProps[offset + 3] = vy;
    circleProps[offset + 4] = life;
    circleProps[offset + 5] = ttl;
    circleProps[offset + 6] = radius;
    circleProps[offset + 7] = hue;
  }

  function initCircles() {
    circleCount = lowPowerViewport.matches ? 90 : 150;
    circleProps = new Float32Array(circleCount * propCount);

    for (let i = 0; i < circleProps.length; i += propCount) {
      initCircle(i);
    }
  }

  function drawCircle(x, y, life, ttl, radius, hue) {
    const alpha = fadeInOut(life, ttl) * canvasAlphaBase;
    bufferCtx.fillStyle = `hsla(${hue}, ${canvasSat}, ${canvasLight}, ${alpha})`;
    bufferCtx.beginPath();
    bufferCtx.arc(x, y, radius, 0, TAU);
    bufferCtx.fill();
  }

  function isOutOfBounds(x, y, radius) {
    return x < -radius || x > width + radius || y < -radius || y > height + radius;
  }

  function updateCircles() {
    baseHue += 0.25;

    for (let i = 0; i < circleProps.length; i += propCount) {
      const x = circleProps[i];
      const y = circleProps[i + 1];
      const vx = circleProps[i + 2];
      const vy = circleProps[i + 3];
      const life = circleProps[i + 4];
      const ttl = circleProps[i + 5];
      const radius = circleProps[i + 6];
      const hue = circleProps[i + 7];

      drawCircle(x, y, life, ttl, radius, hue);

      const nextLife = life + 1;
      circleProps[i] = x + vx;
      circleProps[i + 1] = y + vy;
      circleProps[i + 4] = nextLife;

      if (nextLife > ttl || isOutOfBounds(x, y, radius)) {
        initCircle(i);
      }
    }
  }

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Cap the canvas resolution at 2048px in either dimension.
    // The canvas is rendered at 0.14 opacity behind a 52px blur — there is
    // zero perceptual quality loss from downscaling, but memory drops from
    // ~118 MB → ~30 MB on large (2560×1440) displays.
    const MAX_DIM = 2048;
    const scale = Math.min(1, MAX_DIM / (width * dpr), MAX_DIM / (height * dpr));
    const canvasW = Math.max(1, Math.floor(width * dpr * scale));
    const canvasH = Math.max(1, Math.floor(height * dpr * scale));

    ambientCanvas.width = canvasW;
    ambientCanvas.height = canvasH;
    bufferCanvas.width = canvasW;
    bufferCanvas.height = canvasH;
    ambientCanvas.style.width = `${width}px`;
    ambientCanvas.style.height = `${height}px`;

    viewCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bufferCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initCircles();
  }

  function paintFrame() {
    bufferCtx.clearRect(0, 0, width, height);
    viewCtx.clearRect(0, 0, width, height);

    updateCircles();

    viewCtx.save();
    viewCtx.filter = lowPowerViewport.matches ? 'blur(38px)' : 'blur(52px)';
    viewCtx.drawImage(bufferCanvas, 0, 0, width, height);
    viewCtx.restore();

    viewCtx.save();
    viewCtx.globalAlpha = 0.32;
    viewCtx.drawImage(bufferCanvas, 0, 0, width, height);
    viewCtx.restore();
  }

  function frame() {
    paintFrame();
    rafId = window.requestAnimationFrame(frame);
  }

  function refreshAnimationMode() {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    paintFrame();

    if (!prefersReducedMotion.matches) {
      rafId = window.requestAnimationFrame(frame);
    }
  }

  resizeCanvas();
  refreshAnimationMode();

  window.addEventListener('resize', () => {
    resizeCanvas();
    refreshAnimationMode();
  });

  prefersReducedMotion.addEventListener('change', refreshAnimationMode);

  // Stop canvas when tab is hidden — saves battery and releases GPU memory.
  // On return, resizeCanvas() reallocates buffers and restart the rAF loop.
  // Reallocation cost is ~10–20 ms (imperceptible at 0.14 opacity).
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      // Release GPU backing stores while hidden
      ambientCanvas.width = 0;
      ambientCanvas.height = 0;
      bufferCanvas.width = 0;
      bufferCanvas.height = 0;
    } else if (!document.hidden && !prefersReducedMotion.matches && !rafId) {
      resizeCanvas();
      refreshAnimationMode();
    }
  });
}

initAmbientCanvas();

function syncMobileProfileCompaction() {
  if (!profileCard || !stage) {
    return;
  }

  const shouldCompact = compactProfileQuery.matches && stage.scrollTop > compactProfileThreshold;
  profileCard.classList.toggle('is-compact', shouldCompact);

  if (railNav) {
    const shouldElevateDock = compactProfileQuery.matches && stage.scrollTop > dockScrollThreshold;
    railNav.classList.toggle('is-scrolled', shouldElevateDock);
  }
}

function applyScanLeadEmphasis(root) {
  const targets = root.querySelectorAll('.card-title-wrap p, .about-block p, .timeline-item p, .service-card p, .project-card p, .method-card p');
  targets.forEach((paragraph) => {
    if (paragraph.dataset.scanLead === 'true') return;
    const text = paragraph.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const words = text.split(' ');
    if (words.length < 5) return;
    const lead = words.slice(0, 3).join(' ');
    const rest = words.slice(3).join(' ');
    const strong = document.createElement('strong');
    strong.className = 'scan-lead';
    strong.textContent = lead;
    paragraph.replaceChildren(strong, document.createTextNode(` ${rest}`));
    paragraph.dataset.scanLead = 'true';
  });
}

function bindContactFormHandlers(root) {
  const forms = root.querySelectorAll('.contact-form');
  forms.forEach((form) => {
    if (form.dataset.submitBound === 'true') return;
    form.dataset.submitBound = 'true';

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      if (!submitBtn) {
        console.error('[form] No submit button found');
        return;
      }
      const originalBtnText = submitBtn.textContent;
      let statusDiv = form.querySelector('#form-status');
      
      if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'form-status';
        statusDiv.style.marginTop = '12px';
        statusDiv.style.fontSize = '14px';
        form.appendChild(statusDiv);
      }
      
      submitBtn.textContent = 'SENDING...';
      submitBtn.disabled = true;
      statusDiv.replaceChildren();
      
      const formData = new FormData(form);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        
        if (response.ok) {
          const okSpan = document.createElement('span');
          okSpan.className = 'form-status--ok';
          okSpan.textContent = '✓ Message sent successfully! I\'ll get back to you soon.';
          statusDiv.appendChild(okSpan);
          form.reset();
        } else {
          let errorMsg = 'Something went wrong. Please email me directly at ben@brod3000.com.';
          try {
            const data = await response.json();
            if (Array.isArray(data.errors) && data.errors.length) {
              errorMsg = data.errors.map((e) => e.message).filter(Boolean).join(', ');
            }
          } catch {
            // Non-JSON error body — keep generic message
          }
          const errSpan = document.createElement('span');
          errSpan.className = 'form-status--error';
          errSpan.textContent = '✗ ' + errorMsg;
          statusDiv.appendChild(errSpan);
        }
      } catch (error) {
        reportError('contact-form', error);
        const msg = error.name === 'AbortError'
          ? '✗ Request timed out. Please try again or email ben@brod3000.com.'
          : '✗ Network error. Please check your connection and try again.';
        const errSpan = document.createElement('span');
        errSpan.className = 'form-status--error';
        errSpan.textContent = msg;
        statusDiv.appendChild(errSpan);
      } finally {
        clearTimeout(timeout);
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
      }
    });
  });
}

function animateAboutStats(root) {
  const statNodes = root.querySelectorAll('.stats-row .stat-pill strong[data-count-target]');
  if (!statNodes.length) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  statNodes.forEach((node, idx) => {
    const target = Number(node.dataset.countTarget || '0');
    const suffix = node.dataset.countSuffix || '';

    if (!Number.isFinite(target)) {
      return;
    }

    const duration = prefersReducedMotion ? 760 + idx * 120 : 980 + idx * 140;
    const start = performance.now();
    const step = prefersReducedMotion ? Math.max(1, Math.ceil(target / 6)) : 1;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const rawValue = Math.round(target * eased);
      const value = progress === 1 ? target : Math.min(target, Math.floor(rawValue / step) * step);
      node.textContent = `${value}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    node.textContent = `0${suffix}`;
    requestAnimationFrame(tick);
  });
}

const isMobile = window.matchMedia('(max-width: 920px)').matches;

// On mobile, the CSS card-in animation leaves an inline transform on
// .digital-container after it finishes. Any transform (even scale(1))
// creates a stacking context that traps position:fixed children (the nav).
// removeProperty first, then force 'none' with !important priority.
if (cardShell) {
  const clearContainerTransform = () => {
    if (window.matchMedia('(max-width: 920px)').matches) {
      cardShell.style.removeProperty('transform');
      cardShell.style.removeProperty('animation');
      cardShell.style.setProperty('transform', 'none', 'important');
    }
  };
  // Run immediately, after short delay, and after animation completes
  clearContainerTransform();
  setTimeout(clearContainerTransform, 100);
  setTimeout(clearContainerTransform, 800);
  window.addEventListener('resize', clearContainerTransform);
}

if (window.matchMedia('(hover: hover)').matches && !isMobile && cardShell) {
  const maxTilt = 1.8;
  let shellRect = cardShell.getBoundingClientRect();
  const refreshRect = () => { shellRect = cardShell.getBoundingClientRect(); };
  window.addEventListener('resize', refreshRect, { passive: true });
  window.addEventListener('scroll', refreshRect, { passive: true });
  let tiltRaf = 0;
  let tiltPx = 0, tiltPy = 0;
  cardShell.addEventListener('mousemove', (event) => {
    tiltPx = (event.clientX - shellRect.left) / shellRect.width - 0.5;
    tiltPy = (event.clientY - shellRect.top) / shellRect.height - 0.5;
    if (!tiltRaf) {
      tiltRaf = requestAnimationFrame(() => {
        cardShell.style.transform = `perspective(1200px) rotateX(${(-tiltPy * maxTilt).toFixed(2)}deg) rotateY(${(tiltPx * maxTilt).toFixed(2)}deg)`;
        tiltRaf = 0;
      });
    }
  });

  cardShell.addEventListener('mouseleave', () => {
    if (tiltRaf) { cancelAnimationFrame(tiltRaf); tiltRaf = 0; }
    cardShell.style.transform = '';
  });
}

document.querySelectorAll('img.blur-up').forEach((img) => {
  const cover = img.closest('.profile-cover');
  const markLoaded = () => {
    img.classList.add('loaded');
    if (cover) cover.classList.add('is-loaded');
  };
  if (img.complete) {
    markLoaded();
  } else {
    img.addEventListener('load', markLoaded, { once: true });
  }
});

if (cursor && window.matchMedia('(hover: hover)').matches) {
  let cx = 0, cy = 0, cursorRaf = 0;
  window.addEventListener('mousemove', (event) => {
    cx = event.clientX;
    cy = event.clientY;
    if (!cursorRaf) {
      cursorRaf = requestAnimationFrame(() => {
        cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        cursorRaf = 0;
      });
    }
  }, { passive: true });

  bindCursorTargets = () => {
    interactiveTargets().forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('active'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });
  };

  bindCursorTargets();
}

// Rotator — only runs when rotator element exists and tab is visible
let rotatorTimer = null;
if (rotator && phrases.length > 1) {
  const advancePhrase = () => {
    phraseIndex = (phraseIndex + 1) % phrases.length;
    rotator.textContent = phrases[phraseIndex];
  };
  rotatorTimer = setInterval(advancePhrase, 2600);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && rotatorTimer) {
      clearInterval(rotatorTimer);
      rotatorTimer = null;
    } else if (!document.hidden && !rotatorTimer) {
      rotatorTimer = setInterval(advancePhrase, 2600);
    }
  });
}

/* =========================================================================
   CONTENT RENDERING — reads from inline JSON (#site-content), builds DOM
   with textContent (injection-safe). All sub-components use <template>
   fragments defined in index.html.
   ========================================================================= */

/** Parse the inline JSON content data. Falls back to empty object. */
function loadSiteContent() {
  try {
    const el = document.getElementById('site-content');
    return el ? JSON.parse(el.textContent) : {};
  } catch (e) {
    console.error('[content] Failed to parse site-content JSON:', e);
    return {};
  }
}

const siteContent = loadSiteContent();

// ---- Template helpers: clone a template fragment and fill with textContent ----

function cloneTpl(id) {
  const tpl = document.getElementById(id);
  if (!tpl) return null;
  const node = tpl.content.firstElementChild;
  return node ? node.cloneNode(true) : null;
}

function cloneTplAndFill(id, fillMap) {
  const node = cloneTpl(id);
  if (!node) return null;
  for (const [sel, value] of Object.entries(fillMap)) {
    const el = node.querySelector(sel);
    if (el) el.textContent = value;
  }
  return node;
}

function createStatPill({ value, suffix, label }) {
  const node = cloneTpl('tpl-stat-pill');
  if (!node) return null;
  const strong = node.querySelector('strong');
  const span = node.querySelector('span');
  if (strong) {
    strong.dataset.countTarget = String(value);
    strong.dataset.countSuffix = suffix || '';
    strong.textContent = '0' + (suffix || '');
  }
  if (span) span.textContent = label;
  return node;
}

function createTimelineItem({ date, title, body, active }) {
  const node = cloneTplAndFill('tpl-timeline-item', {
    '.timeline-date': date,
    'h5': title,
    'p': body
  });
  if (node && active) node.classList.add('active');
  return node;
}

function createServiceCard(data) {
  const node = cloneTpl('tpl-service-card');
  if (!node) return null;
  const svg = node.querySelector('svg');
  const titleSpan = node.querySelector('h4 > span');
  const subtitleEl = node.querySelector('.service-subtitle');
  const tagEl = node.querySelector('.tag');
  const pEl = node.querySelector('.service-desc-col p');
  if (titleSpan) titleSpan.textContent = data.title;
  if (subtitleEl) subtitleEl.textContent = data.subtitle;
  if (tagEl) tagEl.textContent = data.tag;
  if (pEl) pEl.textContent = data.body;
  // Add SVG path elements from the icon string (space-separated d values)
  if (svg && data.icon) {
    const dValues = data.icon.split(/\s+(?=[mcM])/);
    dValues.forEach(d => {
      if (d.trim()) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d.trim());
        svg.appendChild(path);
      }
    });
  }
  return node;
}

function createProofCard({ kicker, heading, body }) {
  return cloneTplAndFill('tpl-proof-card', {
    '.proof-kicker': kicker,
    'h5': heading,
    'p': body
  });
}

function createMethodCard({ index, heading, body }) {
  return cloneTplAndFill('tpl-method-card', {
    '.method-index': index,
    'h4': heading,
    'p': body
  });
}

function createWorkflowNode({ step, heading, body }) {
  return cloneTplAndFill('tpl-workflow-node', {
    '.workflow-meta': step,
    'h5': heading,
    'p': body
  });
}

function createBlogCard({ meta, heading, segments }) {
  const node = cloneTpl('tpl-blog-card');
  if (!node) return null;
  const metaEl = node.querySelector('.blog-meta');
  const h5 = node.querySelector('h5');
  const p = node.querySelector('p');
  if (metaEl) metaEl.textContent = meta;
  if (h5) h5.textContent = heading;
  // Build the paragraph with <strong>label</strong>text<br> segments
  if (p && segments) {
    p.replaceChildren();
    segments.forEach((seg, i) => {
      const strong = document.createElement('strong');
      strong.textContent = seg.label;
      p.appendChild(strong);
      p.appendChild(document.createTextNode(seg.text));
      if (i < segments.length - 1) {
        p.appendChild(document.createElement('br'));
      }
    });
  }
  return node;
}

// ---- Section builders ----

function renderAbout() {
  const data = siteContent.about;
  if (!data) return null;

  const article = document.createElement('article');
  article.className = 'stage-card section-enter';
  article.dataset.section = 'about';
  article.dataset.ghost = 'ABOUT';

  // Title wrap
  const titleWrap = document.createElement('div');
  titleWrap.className = 'card-title-wrap';
  titleWrap.innerHTML = `<span class="card-kicker">${data.kicker}</span><h1>${data.heading}</h1>`;
  (data.paragraphs || []).forEach(text => {
    const p = document.createElement('p');
    p.textContent = text;
    titleWrap.appendChild(p);
  });
  article.appendChild(titleWrap);

  // About grid
  if (data.blocks && data.blocks.length) {
    const grid = document.createElement('div');
    grid.className = 'about-grid';
    data.blocks.forEach(({ heading, text }) => {
      const block = document.createElement('div');
      block.className = 'about-block';
      block.innerHTML = `<h4>${heading}</h4>`;
      const p = document.createElement('p');
      p.textContent = text;
      block.appendChild(p);
      grid.appendChild(block);
    });
    article.appendChild(grid);
  }

  // Stats row
  if (data.stats && data.stats.length) {
    const row = document.createElement('div');
    row.className = 'stats-row';
    data.stats.forEach(s => {
      const stat = { ...s };
      // Derive years from the earliest listed role (2010) instead of a hardcoded value.
      if (stat.label && stat.label.includes('Years')) {
        stat.value = new Date().getFullYear() - 2010;
      }
      const pill = createStatPill(stat);
      if (pill) row.appendChild(pill);
    });
    article.appendChild(row);
  }

  const bridge = document.createElement('div');
  bridge.className = 'about-bridge';
  bridge.setAttribute('aria-hidden', 'true');
  article.appendChild(bridge);

  return article;
}

function renderServices() {
  const data = siteContent.services;
  if (!data) return null;

  const article = document.createElement('article');
  article.className = 'stage-card section-enter';
  article.dataset.section = 'services';
  article.dataset.ghost = 'RESUME';

  // Title wrap
  const titleWrap = document.createElement('div');
  titleWrap.className = 'card-title-wrap';
  titleWrap.innerHTML = `<span class="card-kicker">${data.kicker}</span><h1>${data.heading}</h1>`;
  const ledeP = document.createElement('p');
  ledeP.textContent = data.lede;
  titleWrap.appendChild(ledeP);
  article.appendChild(titleWrap);

  // Resume layout
  const resumeLayout = document.createElement('div');
  resumeLayout.className = 'resume-layout';

  // Experience column
  const expCol = document.createElement('div');
  expCol.className = 'resume-column';
  expCol.innerHTML = '<h4 class="resume-heading">Experience</h4>';
  const expList = document.createElement('div');
  expList.className = 'timeline-list';
  (data.experience || []).forEach(item => {
    const node = createTimelineItem(item);
    if (node) expList.appendChild(node);
  });
  expCol.appendChild(expList);

  // Certifications column
  const certCol = document.createElement('div');
  certCol.className = 'resume-column';
  certCol.innerHTML = '<h4 class="resume-heading">Certifications</h4>';
  const certList = document.createElement('div');
  certList.className = 'timeline-list';
  (data.certifications || []).forEach(item => {
    const node = createTimelineItem(item);
    if (node) certList.appendChild(node);
  });
  certCol.appendChild(certList);

  resumeLayout.appendChild(expCol);
  resumeLayout.appendChild(certCol);
  article.appendChild(resumeLayout);

  // Service grid
  const serviceGrid = document.createElement('div');
  serviceGrid.className = 'service-grid';
  (data.serviceCards || []).forEach(item => {
    const card = createServiceCard(item);
    if (card) {
      card.classList.add('animate');
      serviceGrid.appendChild(card);
    }
  });
  article.appendChild(serviceGrid);

  // Proof grid
  const proofGrid = document.createElement('div');
  proofGrid.className = 'proof-grid';
  proofGrid.setAttribute('aria-label', 'Capability proof points');
  (data.proofCards || []).forEach(item => {
    const card = createProofCard(item);
    if (card) proofGrid.appendChild(card);
  });
  article.appendChild(proofGrid);

  return article;
}

function renderPortfolio() {
  const data = siteContent.portfolio;
  if (!data) return null;

  const article = document.createElement('article');
  article.className = 'stage-card section-enter';
  article.dataset.section = 'portfolio';
  article.dataset.ghost = 'PORTFOLIO';

  // Title wrap
  const titleWrap = document.createElement('div');
  titleWrap.className = 'card-title-wrap';
  titleWrap.innerHTML = `<span class="card-kicker">${data.kicker}</span><h1>${data.heading}</h1>`;
  const ledeP = document.createElement('p');
  ledeP.textContent = data.lede;
  titleWrap.appendChild(ledeP);
  article.appendChild(titleWrap);

  // Method grid
  const methodGrid = document.createElement('div');
  methodGrid.className = 'method-grid';
  (data.methods || []).forEach(item => {
    const card = createMethodCard(item);
    if (card) methodGrid.appendChild(card);
  });
  article.appendChild(methodGrid);

  // Workflow container
  if (data.workflow) {
    const section = document.createElement('section');
    section.className = 'workflow-container animate';
    section.setAttribute('aria-label', 'Operating workflow schematic');
    const header = document.createElement('div');
    header.className = 'workflow-header';
    header.innerHTML = `<h4>${data.workflow.heading}</h4><p>${data.workflow.subheading}</p>`;
    section.appendChild(header);

    const track = document.createElement('ol');
    track.className = 'workflow-track';
    (data.workflow.steps || []).forEach(item => {
      const node = createWorkflowNode(item);
      if (node) track.appendChild(node);
    });
    section.appendChild(track);
    article.appendChild(section);
  }

  // Blog panel
  if (data.blogCards && data.blogCards.length) {
    const panel = document.createElement('div');
    panel.className = 'blog-panel';
    const panelHead = document.createElement('div');
    panelHead.className = 'blog-panel-head';
    panelHead.innerHTML = '<h4>Applied Signals</h4><p>Clear outcome snapshots: context, action, impact.</p>';
    panel.appendChild(panelHead);

    const grid = document.createElement('div');
    grid.className = 'blog-grid';
    data.blogCards.forEach(item => {
      const card = createBlogCard(item);
      if (card) grid.appendChild(card);
    });
    panel.appendChild(grid);
    article.appendChild(panel);
  }

  return article;
}

function renderContact() {
  const data = siteContent.contact;
  if (!data) return null;

  const article = document.createElement('article');
  article.className = 'stage-card section-enter';
  article.dataset.section = 'contact';
  article.dataset.ghost = 'CONTACT';

  // Title wrap
  const titleWrap = document.createElement('div');
  titleWrap.className = 'card-title-wrap';
  titleWrap.innerHTML = `<span class="card-kicker">${data.kicker}</span><h1>${data.heading}</h1>`;
  const ledeP = document.createElement('p');
  ledeP.textContent = data.lede;
  titleWrap.appendChild(ledeP);
  article.appendChild(titleWrap);

  // Contact grid
  const grid = document.createElement('div');
  grid.className = 'contact-grid';

  // Contact block
  const cb = data.contactBlock;
  if (cb) {
    const block = document.createElement('div');
    block.className = 'contact-block';
    block.innerHTML = `<h4>${cb.heading}</h4>`
      + `<p><strong>Email:</strong> <a href="mailto:${cb.email}">${cb.email}</a></p>`
      + `<p><strong>Location:</strong> ${cb.location}</p>`;
    const ctaP = document.createElement('p');
    ctaP.textContent = cb.cta;
    block.appendChild(ctaP);
    grid.appendChild(block);
  }

  // Form
  const form = document.createElement('form');
  form.className = 'contact-form';
  form.action = 'https://formspree.io/f/mdavybdy';
  form.method = 'POST';

  const fields = [
    { placeholder: 'YOUR NAME', type: 'text', name: 'name', label: 'Name' },
    { placeholder: 'YOU@COMPANY.COM', type: 'email', name: 'email', label: 'Email' },
    { placeholder: 'SHARE WHAT FEELS MISALIGNED', type: 'textarea', name: 'message', label: 'Message' }
  ];

  fields.forEach(f => {
    const container = document.createElement('div');
    container.className = 'brutalist-container';
    const fieldId = `contact-${f.name}`;
    if (f.type === 'textarea') {
      const ta = document.createElement('textarea');
      ta.className = 'brutalist-input';
      ta.id = fieldId;
      ta.placeholder = f.placeholder;
      ta.name = f.name;
      ta.rows = 4;
      ta.required = true;
      container.appendChild(ta);
    } else {
      const input = document.createElement('input');
      input.className = 'brutalist-input';
      input.id = fieldId;
      input.placeholder = f.placeholder;
      input.type = f.type;
      input.name = f.name;
      input.required = true;
      if (f.type === 'email') input.autocomplete = 'email';
      if (f.name === 'name') input.autocomplete = 'name';
      container.appendChild(input);
    }
    const label = document.createElement('label');
    label.className = 'brutalist-label';
    label.htmlFor = fieldId;
    label.textContent = f.label;
    container.appendChild(label);
    form.appendChild(container);
  });

  // Honeypot — hidden from assistive tech and keyboard order, not just sighted users
  const gotcha = document.createElement('input');
  gotcha.type = 'text';
  gotcha.name = '_gotcha';
  gotcha.tabIndex = -1;
  gotcha.setAttribute('aria-hidden', 'true');
  gotcha.autocomplete = 'off';
  gotcha.style.display = 'none';
  form.appendChild(gotcha);

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = data.formSubmitText || 'Start a conversation';
  form.appendChild(btn);

  grid.appendChild(form);
  article.appendChild(grid);

  return article;
}

/** @type {Object<string, function(): HTMLElement|null>} */
const SECTION_RENDERERS = {
  about: renderAbout,
  services: renderServices,
  portfolio: renderPortfolio,
  contact: renderContact,
};

function getSectionCard(section) {
  const render = SECTION_RENDERERS[section];
  if (!render) {
    console.error(`[runtime] Unknown section: "${section}"`);
    return null;
  }
  return render();
}

function mountSection(section) {
  // Clear any pending workflow pulse when leaving any section
  if (workflowPulseInterval) {
    window.clearInterval(workflowPulseInterval);
    workflowPulseInterval = null;
  }

  if (section === currentSection && stage.childElementCount > 0) {
    if (section === 'about') {
      const activeCard = stage.querySelector('.stage-card[data-section="about"]');
      if (activeCard) {
        animateAboutStats(activeCard);
      }
    }
    return;
  }

  currentSection = section;
  const currentCard = stage.querySelector('.stage-card');
  const nextCard = getSectionCard(section);

  if (!nextCard) {
    console.error(`Failed to get section card for: ${section}`);
    return;
  }

  applyScanLeadEmphasis(nextCard);
  bindContactFormHandlers(nextCard);

  // Announce section change to screen readers without reading the entire DOM.
  const announcer = document.getElementById('section-announcer');
  if (announcer) {
    const labels = { about: 'About', services: 'Resume', portfolio: 'Concepts', contact: 'Contact' };
    announcer.textContent = labels[section] || section;
  }

  const activateSectionEffects = () => {
    if (section === 'about') {
      animateAboutStats(nextCard);
    }

    if (section === 'portfolio') {
      // Start the step pulsing animation
      const workflowNodes = [...nextCard.querySelectorAll('.workflow-node')];
      if (workflowNodes.length) {
        workflowNodes.forEach(node => node.classList.remove('is-live'));
        let pulseIndex = 0;
        workflowNodes[0].classList.add('is-live');
        workflowPulseInterval = setInterval(() => {
          workflowNodes[pulseIndex].classList.remove('is-live');
          pulseIndex = (pulseIndex + 1) % workflowNodes.length;
          workflowNodes[pulseIndex].classList.add('is-live');
        }, 800);
      }
    }

    // Trigger GSAP scroll animations and refresh for any section
    setTimeout(() => {
      animatePortfolioCards();
      ScrollTrigger.refresh();
    }, 100);
  };

  if (!currentCard) {
    stage.replaceChildren();
    stage.appendChild(nextCard);
    placeFooter();
    requestAnimationFrame(() => {
      nextCard.classList.add('section-enter-active');
      activateSectionEffects();
      bindCursorTargets();
    });
    return;
  }

  currentCard.classList.add('section-exit-active');

  setTimeout(() => {
    currentCard.remove();
    stage.appendChild(nextCard);
    placeFooter();
    requestAnimationFrame(() => {
      nextCard.classList.add('section-enter-active');
      activateSectionEffects();
      bindCursorTargets();
    });
  }, 300);
}

railTabs.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.dataset.section === currentSection) {
      return;
    }

    // navigateTo() syncs the active state for clicks, hash routing and popstate alike.
    navigateTo(btn.dataset.section);
    // Always scroll to top of workspace on section change
    if (stage) {
      stage.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    // Close radial menu on nav
    if (railNav && railNav.classList.contains('is-open')) {
      railNav.classList.remove('is-open');
      if (radialTrigger) {
        radialTrigger.setAttribute('aria-expanded', 'false');
        radialTrigger.setAttribute('aria-label', 'Open navigation');
      }
    }
  });
});

// Radial hamburger toggle
if (radialTrigger && railNav) {
  radialTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = railNav.classList.toggle('is-open');
    radialTrigger.setAttribute('aria-expanded', String(isOpen));
    radialTrigger.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });

  document.addEventListener('click', (e) => {
    if (railNav.classList.contains('is-open') && !railNav.contains(e.target)) {
      railNav.classList.remove('is-open');
      radialTrigger.setAttribute('aria-expanded', 'false');
      radialTrigger.setAttribute('aria-label', 'Open navigation');
    }
  });
}

/* =========================================================================
   HASH ROUTING — makes sections linkable and back-button-correct
   ========================================================================= */

const VALID_SECTIONS = new Set(['about', 'services', 'portfolio', 'contact']);

/* URL slugs are what visitors see and share, so they match the nav labels.
   The internal section keys stay as-is because the content JSON and several
   CSS selectors key off them. Legacy slugs keep old shared links working. */
const SLUG_TO_SECTION = {
  about: 'about',
  resume: 'services',
  concepts: 'portfolio',
  contact: 'contact',
  // legacy
  services: 'services',
  portfolio: 'portfolio',
};

const SECTION_TO_SLUG = {
  about: 'about',
  services: 'resume',
  portfolio: 'concepts',
  contact: 'contact',
};

function sectionFromHash() {
  const raw = window.location.hash.replace(/^#/, '').toLowerCase();
  return SLUG_TO_SECTION[raw] || 'about';
}

/** Keep the rail tabs in sync with whatever section is actually mounted.
    Must run for hash routing and popstate too, not just clicks. */
function syncRailTabs(section) {
  railTabs.forEach((b) => {
    const isActive = b.dataset.section === section;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-pressed', String(isActive));
    if (isActive) {
      b.setAttribute('aria-current', 'page');
    } else {
      b.removeAttribute('aria-current');
    }
  });
}

function navigateTo(section, { pushState = true } = {}) {
  if (!VALID_SECTIONS.has(section)) return;
  const slug = SECTION_TO_SLUG[section] || section;
  if (pushState && sectionFromHash() !== section) {
    history.pushState({ section }, '', '#' + slug);
  }
  mountSection(section);
  syncRailTabs(section);
  if (typeof gtag === 'function') {
    gtag('event', 'page_view', { page_path: '/#' + slug });
  }
}

window.addEventListener('popstate', () => {
  navigateTo(sectionFromHash(), { pushState: false });
});

// Mount the initial section from hash with error handling
try {
  navigateTo(sectionFromHash(), { pushState: false });
} catch (err) {
  console.error('Failed to mount initial section:', err);
}

if (profileCard && stage) {
  stage.addEventListener('scroll', syncMobileProfileCompaction, { passive: true });
  compactProfileQuery.addEventListener('change', () => {
    if (!compactProfileQuery.matches) {
      profileCard.classList.remove('is-compact');
    }
    syncMobileProfileCompaction();
  });
  window.addEventListener('resize', syncMobileProfileCompaction);
  syncMobileProfileCompaction();
}

/* =========================
   GSAP SCROLL ANIMATIONS FOR PORTFOLIO
========================= */
gsap.registerPlugin(ScrollTrigger);

// Watch for new .animate elements and animate them
const animatePortfolioCards = () => {
  const isPortfolio = currentSection === 'portfolio';
  
  // For portfolio section, just show everything without animation
  if (isPortfolio) {
    const portfolioElements = document.querySelectorAll('.workspace-body .method-card, .workspace-body .workflow-container, .workspace-body .workflow-node, .workspace-body .blog-card');
    portfolioElements.forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }
  
  const selector = '.workspace-body .animate';
  const animateElements = document.querySelectorAll(selector);
  if (!animateElements.length) return;

  // Remove any existing animations
  gsap.killTweensOf(animateElements);

  gsap.fromTo(animateElements,
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      delay: 0,
      stagger: {
        amount: 0.2,
        from: "start"
      },
      ease: "power3.out",
      clearProps: "opacity,transform"
    }
  );
};

/* =========================================================================
   MutationObserver removed. Animations are triggered directly from
   mountSection() via activateSectionEffects(). This eliminates an
   800ms-interval ScrollTrigger.refresh() loop on the portfolio section.
   ========================================================================= */