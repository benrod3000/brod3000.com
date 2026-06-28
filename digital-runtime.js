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
const ambientCanvas = document.getElementById('ambient-canvas');
const profileCard = document.querySelector('.profile-card');
const railNav = document.querySelector('.rail-nav');
const railTabs = [...document.querySelectorAll('.rail-tab')];
const radialTrigger = document.querySelector('.radial-trigger');
const interactiveTargets = () => document.querySelectorAll('.rail-tab, .workspace-back, .profile-cta, .profile-socials a, .contact-form button');
const phrases = ['Growth Systems Architect', 'Audience Ownership Strategist', 'Paid + Organic Scale Operator'];
let bindCursorTargets = () => {};
let phraseIndex = 0;
let currentSection = 'about';
let workflowPulseInterval = null;
const compactProfileQuery = window.matchMedia('(max-width: 920px)');
const compactProfileThreshold = 36;
const dockScrollThreshold = 18;

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
  let circleProps;
  let baseHue = accentHue;

  const rand = (n) => Math.random() * n;
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

    ambientCanvas.width = Math.max(1, Math.floor(width * dpr));
    ambientCanvas.height = Math.max(1, Math.floor(height * dpr));
    bufferCanvas.width = ambientCanvas.width;
    bufferCanvas.height = ambientCanvas.height;
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
      statusDiv.innerHTML = '';
      
      const formData = new FormData(form);
      
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          statusDiv.innerHTML = '<span style="color: #00e060;">✓ Message sent successfully! I\'ll get back to you soon.</span>';
          form.reset();
        } else {
          const data = await response.json();
          let errorMsg = 'Sorry, something went wrong. Please try again.';
          if (data.errors) {
            errorMsg = data.errors.map(e => e.message).join(', ');
          }
          statusDiv.innerHTML = `<span style="color: #e8180a;">✗ ${errorMsg}</span>`;
        }
      } catch (error) {
        statusDiv.innerHTML = '<span style="color: #e8180a;">✗ Network error. Please check your connection and try again.</span>';
      } finally {
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
  cardShell.addEventListener('mousemove', (event) => {
    const rect = cardShell.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    cardShell.style.transform = `perspective(1200px) rotateX(${(-py * maxTilt).toFixed(2)}deg) rotateY(${(px * maxTilt).toFixed(2)}deg)`;
  });

  cardShell.addEventListener('mouseleave', () => {
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
  window.addEventListener('mousemove', (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });

  bindCursorTargets = () => {
    interactiveTargets().forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('active'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });
  };

  bindCursorTargets();
}

// Rotator with null guard
setInterval(() => {
  if (!rotator) return;
  phraseIndex = (phraseIndex + 1) % phrases.length;
  rotator.textContent = phrases[phraseIndex];
}, 2600);

function sectionTemplate(section) {
  if (section === 'about') {
    return `
      <article class="stage-card section-enter" data-section="about" data-ghost="ABOUT">
        <div class="card-title-wrap">
          <span class="card-kicker">About</span>
          <h3>I build systems for growth.</h3>
          <p><strong>Systems first growth architecture</strong> demands a move away from "growth hacks" toward durable, high leverage digital structures.</p>
          <p><strong>Complexity requires clarity</strong> when managing multi channel campaigns; we solve for the bottleneck before we solve for the volume.</p>
          <p><strong>Engineered for scale</strong> is how I approach every campaign, ensuring that the infrastructure can support the ambition.</p>
        </div>

        <div class="about-grid">
          <div class="about-block">
            <h4>Alignment</h4>
            <p><strong>Methodology over history</strong> is the cornerstone of my practice; I provide the operating manual, not just the labor.</p>
          </div>
          <div class="about-block">
            <h4>Principle</h4>
            <p><strong>Eleven years' tenure</strong> at the intersection of culture and commerce has refined my ability to scale brands without losing their soul.</p>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-pill"><strong data-count-target="11" data-count-suffix="+">0+</strong><span>Years in Talent Management</span></div>
          <div class="stat-pill"><strong data-count-target="20" data-count-suffix="+">0+</strong><span>Campaigns Launched</span></div>
          <div class="stat-pill"><strong data-count-target="3" data-count-suffix="x">0x</strong><span>Average Return on Ad Spend</span></div>
        </div>

        <div class="about-bridge" aria-hidden="true"></div>
      </article>
    `;
  }

  if (section === 'services') {
    return `
      <article class="stage-card section-enter" data-section="services" data-ghost="RESUME">
        <div class="card-title-wrap">
          <span class="card-kicker">Capabilities</span>
          <h3>Results built on repeatable systems</h3>
          <p><strong>Unified operating logic</strong> aligns strategy, paid media, web, and lifecycle so execution stays fast, measurable, and resilient.</p>
        </div>

        <div class="resume-layout">
          <div class="resume-column">
            <h4 class="resume-heading">Experience</h4>
            <div class="timeline-list">
              <article class="timeline-item active">
                <span class="timeline-date">2016 to 2021</span>
                <h5>Digital Marketing Director</h5>
                <p>Owned the digital roadmap across paid media, web, email, and reporting operations. Led cross functional launches, standardized campaign QA, and aligned channel KPIs to business goals. Result: faster launch cycles, cleaner attribution, and sustained performance with average return on ad spend around 3x on core campaigns.</p>
              </article>
              <article class="timeline-item">
                <span class="timeline-date">2011 to 2016</span>
                <h5>Digital Marketing Manager</h5>
                <p>Managed day to day campaign execution, content calendars, landing page workflows, and stakeholder reporting. Built repeatable testing and weekly optimization rhythms that improved decision speed and reduced channel drift across active campaigns.</p>
              </article>
              <article class="timeline-item">
                <span class="timeline-date">2010 to 2011</span>
                <h5>Assistant Tour Manager / Merch Manager</h5>
                <p>Managed tour logistics and merch operations across venues, including inventory forecasting, point of sale reconciliation, and nightly reporting. Built execution discipline under pressure that later translated directly into digital operations leadership.</p>
              </article>
            </div>
          </div>
          <div class="resume-column">
            <h4 class="resume-heading">Certifications</h4>
            <div class="timeline-list">
              <article class="timeline-item">
                <span class="timeline-date">2019</span>
                <h5>Facebook Blueprint Certification</h5>
                <p>Platform expertise, ad buying, measurement, and compliance for paid social campaigns.</p>
              </article>
              <article class="timeline-item">
                <span class="timeline-date">2017</span>
                <h5>Twitter Flight School</h5>
                <p>Certification in Twitter ads, audience targeting, and campaign optimization strategies.</p>
              </article>
              <article class="timeline-item">
                <span class="timeline-date">2016</span>
                <h5>YouTube Certified</h5>
                <p>Video advertising, audience growth, and content strategy for the YouTube platform.</p>
              </article>
              <article class="timeline-item">
                <span class="timeline-date">Current</span>
                <h5>AWS Cloud Practitioner (In Progress)</h5>
                <p>Specializing in ECS (Elastic Container Service) and SNS (Simple Notification Service) for scalable marketing infrastructure.</p>
              </article>
            </div>
          </div>
        </div>

        <div class="service-grid">
          <div class="service-card animate">
            <div class="service-title-col">
              <h4><svg class="service-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 20h16"/><path d="M7 16v-4"/><path d="M12 16v-8"/><path d="M17 16v-11"/></svg><span>Digital Ecosystem Strategy</span></h4>
              <span class="service-subtitle">System Architecture</span>
              <span class="tag">Roadmap</span>
            </div>
            <div class="service-desc-col">
              <p><strong>High fidelity data loops</strong> move your decision making away from "gut feeling" and toward a rigorous, evidence based marketing cycle.</p>
            </div>
          </div>
          <div class="service-card animate">
            <div class="service-title-col">
              <h4><svg class="service-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 4 3 9l9 5 9-5-9-5Z"/><path d="m3 13 9 5 9-5"/></svg><span>Data Driven Decision Systems</span></h4>
              <span class="service-subtitle">Insight Architecture</span>
              <span class="tag">Ops</span>
            </div>
            <div class="service-desc-col">
              <p><strong>Retention driven lifecycle design</strong> focuses on the compounding value of existing users, turning fleeting interactions into durable brand loyalty.</p>
            </div>
          </div>
          <div class="service-card animate">
            <div class="service-title-col">
              <h4><svg class="service-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 11v2"/><path d="M6 9v6"/><path d="M9 8c6 0 9-3 12-4v16c-3-1-6-4-12-4Z"/></svg><span>Lifecycle Marketing Architecture</span></h4>
              <span class="service-subtitle">Retention Infrastructure</span>
              <span class="tag">Acquisition</span>
            </div>
            <div class="service-desc-col">
              <p><strong>Conversion consistency systems</strong> are built to survive market volatility by focusing on core human behavior rather than platform trends.</p>
            </div>
          </div>
          <div class="service-card animate">
            <div class="service-title-col">
              <h4><svg class="service-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/></svg><span>Conversion Experience Design</span></h4>
              <span class="service-subtitle">Conversion Infrastructure</span>
              <span class="tag">Demand</span>
            </div>
            <div class="service-desc-col">
              <p>Improve conversion consistency over time through web structure, landing page refinement, and UX choices that reduce friction and build trust.</p>
            </div>
          </div>
        </div>

        <div class="proof-grid" aria-label="Capability proof points">
          <article class="proof-card">
            <span class="proof-kicker">Strategy + Analytics</span>
            <h5>Faster decisions, cleaner priorities</h5>
            <p>Built weekly reporting loops that turned channel noise into clear, revenue-aligned actions across teams.</p>
          </article>
          <article class="proof-card">
            <span class="proof-kicker">Paid Distribution</span>
            <h5>Performance with repeatable systems</h5>
            <p>Implemented disciplined testing and pacing frameworks that supported sustained campaign performance around 3x ROAS on core efforts.</p>
          </article>
          <article class="proof-card">
            <span class="proof-kicker">Lifecycle + Retention</span>
            <h5>Retention that compounds over time</h5>
            <p>Rebuilt nurture and re-engagement flows to improve list quality, stabilize retention, and lift long-term customer value.</p>
          </article>
        </div>
      </article>
    `;
  }

  if (section === 'portfolio') {
    return `
      <article class="stage-card section-enter" data-section="portfolio" data-ghost="PORTFOLIO">
        <div class="card-title-wrap">
          <span class="card-kicker">Concepts</span>
          <h3>Theory library for durable digital operation</h3>
          <p>Core principles that guide planning, channel execution, and performance control across the full system.</p>
        </div>

        <div class="method-grid">
          <article class="method-card animate">
            <span class="method-index">01</span>
            <h4>Systems Over Tactics</h4>
            <p><strong>Architectural stability logic</strong> Infrastructure led growth prioritizes repeatable frameworks over transient platform hacks. Strategic resilience is achieved by building systems that outlast individual campaign cycles.</p>
          </article>
          <article class="method-card animate">
            <span class="method-index">02</span>
            <h4>The Durable Narrative</h4>
            <p><strong>Contextual brand filtering</strong> Narrative serves as the primary filter for all incoming data and outgoing creative. A coherent brand identity reduces market friction and accelerates consumer trust building.</p>
          </article>
          <article class="method-card animate">
            <span class="method-index">03</span>
            <h4>Compound Retention</h4>
            <p><strong>Compounding lifecycle physics</strong> Revenue growth is a function of minimizing churn through rigorous user experience design. Sustainable scaling is driven by the lifetime value of established audiences rather than constant acquisition.</p>
          </article>
        </div>

        <section class="workflow-container animate" aria-label="Operating workflow schematic">
          <div class="workflow-header">
            <h4>Operating Workflow</h4>
            <p>From raw signal to hardened system.</p>
          </div>

          <ol class="workflow-track">
            <li class="workflow-node animate">
              <span class="workflow-meta">STEP 01</span>
              <h5>Signal Intake</h5>
              <p>Aggregating raw data, market sentiment, and brand objectives into a single source of truth.</p>
            </li>
            <li class="workflow-node animate">
              <span class="workflow-meta">STEP 02</span>
              <h5>Diagnostic Mapping</h5>
              <p>Identifying systemic bottlenecks and friction points within the existing digital structure.</p>
            </li>
            <li class="workflow-node animate">
              <span class="workflow-meta">STEP 03</span>
              <h5>System Architecture</h5>
              <p>Designing the durable framework and logic flows required to solve the identified friction.</p>
            </li>
            <li class="workflow-node animate">
              <span class="workflow-meta">STEP 04</span>
              <h5>Multi Channel Execution</h5>
              <p>Deploying the architecture across relevant platforms with unified brand logic.</p>
            </li>
            <li class="workflow-node animate">
              <span class="workflow-meta">STEP 05</span>
              <h5>Feedback Integration</h5>
              <p>Capturing real time performance data to refine the system responsiveness.</p>
            </li>
            <li class="workflow-node animate">
              <span class="workflow-meta">STEP 06</span>
              <h5>Iterative Optimization</h5>
              <p>Hardening the system for long term retention and compounding growth.</p>
            </li>
          </ol>
        </section>

        <div class="blog-panel">
          <div class="blog-panel-head">
            <h4>Applied Signals</h4>
            <p>Clear outcome snapshots: context, action, impact.</p>
          </div>
          <div class="blog-grid">
            <article class="blog-card animate">
              <span class="blog-meta">Systems Deployment</span>
              <h5>Audience ownership framework rollout</h5>
              <p><strong>Context:</strong> Planning was fragmented across teams and channels.<br><strong>Action:</strong> Implemented one planning cadence linking content, paid media, and web priorities.<br><strong>Impact:</strong> Faster decisions, clearer campaign choices, steadier execution quality.</p>
            </article>
            <article class="blog-card animate">
              <span class="blog-meta">Paid Media Operations</span>
              <h5>Creative testing system for paid social</h5>
              <p><strong>Context:</strong> Testing was inconsistent and scaling decisions were slow.<br><strong>Action:</strong> Built a repeatable creative test cadence with cleaner hypotheses and reporting loops.<br><strong>Impact:</strong> More learnings per cycle, faster iteration, stronger budget confidence.</p>
            </article>
            <article class="blog-card animate">
              <span class="blog-meta">Retention Systems</span>
              <h5>Email automation reset for dormant audiences</h5>
              <p><strong>Context:</strong> Lifecycle messaging lacked segmentation and reactivation control.<br><strong>Action:</strong> Rebuilt automation flows for nurture, re engagement, and list health management.<br><strong>Impact:</strong> Better audience quality, steadier retention performance, stronger long term value.</p>
            </article>
          </div>
        </div>
      </article>
    `;
  }

  return `
    <article class="stage-card section-enter" data-section="contact" data-ghost="CONTACT">
      <div class="card-title-wrap">
        <span class="card-kicker">Ready to fix the system</span>
        <h3>If your growth depends on constant output, the structure underneath it needs to change</h3>
        <p>Most growth problems are not content problems. They are system problems. When strategy, messaging, and delivery run separately, everything turns reactive, effort rises, clarity drops, outcomes drift. I design systems that bring those layers into alignment, so growth is shaped by structure that holds under pressure and improves over time. The goal is not more activity. It is better signal.</p>
      </div>

      <div class="contact-grid">
        <div class="contact-block">
          <h4>Direct</h4>
          <p><strong>Email:</strong> <a href="mailto:ben@brod3000.com">ben@brod3000.com</a></p>
          <p><strong>Location:</strong> Southern California</p>
          <p>Share what feels misaligned. I'll map a clear next step.</p>
        </div>
        <form class="contact-form" action="https://formspree.io/f/mdavybdy" method="POST">
          <div class="brutalist-container">
            <input placeholder="YOUR NAME" class="brutalist-input" type="text" name="name" required>
            <label class="brutalist-label">Name</label>
          </div>
          <div class="brutalist-container">
            <input placeholder="YOU@COMPANY.COM" class="brutalist-input" type="email" name="email" required>
            <label class="brutalist-label">Email</label>
          </div>
          <div class="brutalist-container">
            <textarea placeholder="SHARE WHAT FEELS MISALIGNED" class="brutalist-input" name="message" rows="4" required></textarea>
            <label class="brutalist-label">Message</label>
          </div>
          <input type="text" name="_gotcha" style="display:none !important;">
          <button type="submit">Start a conversation</button>
        </form>
      </div>
    </article>
  `;
}

const sectionTemplateCache = new Map();

function getSectionCard(section) {
  let template = sectionTemplateCache.get(section);
  if (!template) {
    template = document.createElement('template');
    template.innerHTML = sectionTemplate(section).trim();
    sectionTemplateCache.set(section, template);
  }

  const first = template.content.firstElementChild;
  return first ? first.cloneNode(true) : null;
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

  const activateSectionEffects = () => {
    if (section === 'about') {
      animateAboutStats(nextCard);
    }

    if (section === 'portfolio') {
      // Force portfolio content to be visible
      nextCard.style.display = 'block';
      nextCard.style.visibility = 'visible';
      nextCard.style.opacity = '1';
      
      // Fix workflow track grid
      setTimeout(() => {
        const workflowTrack = nextCard.querySelector('.workflow-track');
        if (workflowTrack) {
          workflowTrack.style.display = 'grid';
          workflowTrack.style.gridTemplateColumns = 'repeat(3, 1fr)';
          workflowTrack.style.gap = '20px';
        }
      }, 10);
      
      // Start the step pulsing animation
      const workflowNodes = [...nextCard.querySelectorAll('.workflow-node')];
      if (workflowNodes.length) {
        // Remove any existing live classes
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
  };

  if (!currentCard) {
    stage.replaceChildren();
    stage.appendChild(nextCard);
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
    requestAnimationFrame(() => {
      nextCard.classList.add('section-enter-active');
      activateSectionEffects();
      bindCursorTargets();
    });
  }, 300);
}

railTabs.forEach((btn) => {
  btn.setAttribute('aria-pressed', String(btn.classList.contains('active')));
  if (btn.classList.contains('active')) {
    btn.setAttribute('aria-current', 'page');
  } else {
    btn.removeAttribute('aria-current');
  }

  btn.addEventListener('click', () => {
    if (btn.dataset.section === currentSection) {
      return;
    }

    railTabs.forEach((b) => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
      b.removeAttribute('aria-current');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    btn.setAttribute('aria-current', 'page');
    mountSection(btn.dataset.section);
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

// Mount the initial section with error handling
try {
  mountSection('about');
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

// Use MutationObserver to catch when new elements are added
const stageMutationObserver = new MutationObserver(() => {
  // Debounce the animation trigger
  clearTimeout(window.animateDebounce);
  window.animateDebounce = setTimeout(() => {
    animatePortfolioCards();
    ScrollTrigger.refresh();
  }, 50);
});

stageMutationObserver.observe(stage, {
  childList: true,
  subtree: true
});

// Initial animation for first section
setTimeout(() => {
  animatePortfolioCards();
  ScrollTrigger.refresh();
}, 300);