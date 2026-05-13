/* =========================
   PROGRESS BAR
========================= */
const progressBar = document.querySelector(".progress-bar");

/* =========================
   SCROLL REVEALS
========================= */
const revealEls = document.querySelectorAll(
  ".hero, .about-hero, .quote-rail, .fragment, .layered-type, .terminal-card, .folder-grid, .margin-notes, .about-cta, .cta-inner, .stat"
);

revealEls.forEach(el => el.classList.add("fade-up"));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

revealEls.forEach(el => observer.observe(el));

/* =========================
   NAV ACTIVE STATE
========================= */
const navLinks = document.querySelectorAll(".nav nav a");

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        navLinks.forEach(link => {
          link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
        });
      }
    });
  },
  { rootMargin: "-40% 0px -55% 0px" }
);

document.querySelectorAll("section[id]").forEach(s => sectionObserver.observe(s));

/* =========================
   SERVICE CARD STAGGER
========================= */
const baseServiceCards = document.querySelectorAll(".service-card");

const cardObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        baseServiceCards.forEach((card, i) => {
          setTimeout(() => card.classList.add("visible"), i * 80);
        });
        cardObserver.disconnect();
      }
    });
  },
  { threshold: 0.15 }
);

if (baseServiceCards.length) {
  cardObserver.observe(baseServiceCards[0].closest("section") || baseServiceCards[0]);
}

/* =========================
   WORK CARD STAGGER
========================= */
const baseWorkCards = document.querySelectorAll(".work-card");

const workObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        baseWorkCards.forEach((card, i) => {
          setTimeout(() => card.classList.add("visible"), i * 100);
        });
        workObserver.disconnect();
      }
    });
  },
  { threshold: 0.1 }
);

if (baseWorkCards.length) {
  workObserver.observe(baseWorkCards[0].closest("section") || baseWorkCards[0]);
}

/* =========================
   HERO TITLE SCROLL MORPH
========================= */
const heroTitle = document.querySelector(".hero-title");

const phrases = [
  "Attention is rented",
  "Systems build ownership",
  "I turn attention into ownership"
];

let phraseIndex = 0;

/* =========================
   SYSTEM COMPACT MODE
========================= */
const system = document.querySelector(".system");
const servicesSection = document.querySelector(".services");

/* =========================
   THROTTLED SCROLL HANDLER
========================= */
let ticking = false;

function onScroll() {
  const scroll = window.scrollY;

  // Progress bar
  if (progressBar) {
    const total = document.body.scrollHeight - window.innerHeight;
    progressBar.style.width = `${(scroll / total) * 100}%`;
  }

  // Hero title morph
  if (heroTitle) {
    if (scroll > 200 && phraseIndex === 0) {
      heroTitle.textContent = phrases[1];
      phraseIndex = 1;
    }
    if (scroll > 500 && phraseIndex === 1) {
      heroTitle.textContent = phrases[2];
      phraseIndex = 2;
    }
  }

  // System compact mode
  if (system && servicesSection) {
    const triggerPoint = servicesSection.offsetTop - 300;
    system.classList.toggle("compact", scroll > triggerPoint);
  }

  ticking = false;
}

window.addEventListener("scroll", () => {
  if (!ticking) {
    window.requestAnimationFrame(onScroll);
    ticking = true;
  }
});

/* =========================
   GSAP SCROLL ANIMATIONS
========================= */
if (window.gsap && window.ScrollTrigger) {
  // Register ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  // Animate service cards with stagger
  const gsapServiceCards = document.querySelectorAll(".service-card.animate");
  if (gsapServiceCards.length) {
    gsap.from(gsapServiceCards, {
      scrollTrigger: {
        trigger: ".services",
        start: "top 80%",
        end: "top 20%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 40,
      duration: 0.8,
      stagger: {
        amount: 0.3,
        from: "start"
      },
      ease: "power3.out"
    });
  }

  // Animate pillar cards with stagger
  const gsapPillarCards = document.querySelectorAll(".pillar.animate");
  if (gsapPillarCards.length) {
    gsap.from(gsapPillarCards, {
      scrollTrigger: {
        trigger: ".pillars",
        start: "top 80%",
        end: "top 20%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 40,
      duration: 0.8,
      stagger: {
        amount: 0.3,
        from: "start"
      },
      ease: "power3.out"
    });
  }

  // Animate work cards with stagger
  const gsapWorkCards = document.querySelectorAll(".work-card.animate");
  if (gsapWorkCards.length) {
    gsap.from(gsapWorkCards, {
      scrollTrigger: {
        trigger: ".work",
        start: "top 80%",
        end: "top 20%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 40,
      duration: 0.8,
      stagger: {
        amount: 0.3,
        from: "start"
      },
      ease: "power3.out"
    });
  }
}

// Fallback: ensure animated elements are visible if GSAP hasn't animated them yet
// Run immediately and again after page load
function makeAnimatedElementsVisible() {
  document.querySelectorAll(".animate").forEach((el) => {
    if (window.getComputedStyle(el).opacity === '0') {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }
  });
}

// Run immediately
setTimeout(makeAnimatedElementsVisible, 100);
window.addEventListener('load', makeAnimatedElementsVisible);

/* =========================
   FINALITY TRIGGER
========================= */
const cta = document.querySelector(".cta");

const ctaObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.body.classList.add("ownership-achieved");
      }
    });
  },
  { threshold: 0.6 }
);

if (cta) ctaObserver.observe(cta);

/* =========================
   DESIGN TOGGLE - CLASSIC/BOLD/DIGITAL
========================= */
/* =========================
   DESIGN TOGGLE - NAVIGATE BETWEEN VERSIONS
========================= */
const designToggle = document.querySelector('.design-toggle');

if (designToggle) {
  designToggle.addEventListener('click', () => {
    // Check which page we're currently on
    if (window.location.pathname.includes('digital.html')) {
      // On digital.html - go back to index.html
      window.location.href = 'index.html';
    } else {
      // On index.html - check current version
      const currentDesign = localStorage.getItem('design-preference') || 'classic';
      
      if (currentDesign === 'classic') {
        // Classic → Bold
        localStorage.setItem('design-preference', 'bold');
        // Load bold stylesheet
        const stylesheet = document.getElementById('design-stylesheet');
        if (stylesheet) stylesheet.href = 'styles-bold.css?v=20260512-2';
        // Update button
        designToggle.textContent = 'VERSION 2';
        designToggle.style.opacity = '0.5';
        setTimeout(() => { designToggle.style.opacity = '1'; }, 150);
        // Add body class
        document.body.classList.add('design-bold');
      } else if (currentDesign === 'bold') {
        // Bold → Digital (navigate to digital.html)
        localStorage.setItem('design-preference', 'digital');
        window.location.href = 'digital.html';
      } else {
        // Digital → Classic (reset)
        localStorage.setItem('design-preference', 'classic');
        window.location.href = 'index.html';
      }
    }
  });
}

// Load correct stylesheet on page load for index.html
if (!window.location.pathname.includes('digital.html')) {
  const currentDesign = localStorage.getItem('design-preference') || 'classic';
  const stylesheet = document.getElementById('design-stylesheet');
  const designToggleBtn = document.querySelector('.design-toggle');
  
  if (currentDesign === 'bold' && stylesheet) {
    stylesheet.href = 'styles-bold.css?v=20260512-2';
    document.body.classList.add('design-bold');
    if (designToggleBtn) designToggleBtn.textContent = 'VERSION 2';
  } else if (currentDesign === 'digital') {
    localStorage.setItem('design-preference', 'classic');
    if (stylesheet) stylesheet.href = '';
    document.body.classList.remove('design-bold', 'design-digital');
    if (designToggleBtn) designToggleBtn.textContent = 'VERSION 1';
  }
}

/* =========================
   DIGITAL DESIGN - NAVIGATION & INTERACTIONS (on digital.html only)
========================= */
if (window.location.pathname.includes('digital.html')) {
  const navRailBtns = document.querySelectorAll('.nav-rail-btn');
  const cardSections = document.querySelectorAll('.card-section');
  const cardContainer = document.querySelector('.card-container');

  navRailBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.getAttribute('data-section');
      // Update active button
      navRailBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Hide all card sections
      cardSections.forEach(s => s.classList.remove('active'));
      // Show selected section
      const activeSection = document.querySelector(`.card-section[data-section="${section}"]`);
      if (activeSection) {
        activeSection.classList.add('active');
        // Trigger skill bar animations if in services section
        if (section === 'services') {
          animateSkillBars();
        }
        // Scroll to top
        if (cardContainer) {
          cardContainer.scrollTop = 0;
        }
      }
    });
  });

  /* =========================
     SKILL BAR ANIMATIONS
  ========================= */
  function animateSkillBars() {
    const skillBars = document.querySelectorAll('.skill-bar-fill');
    skillBars.forEach(bar => {
      bar.style.animation = 'none';
      setTimeout(() => {
        bar.style.animation = '';
      }, 10);
    });
  }

  // Trigger animations when Services button is clicked
  const servicesBtn = document.querySelector('.nav-rail-btn[data-section="services"]');
  if (servicesBtn) {
    servicesBtn.addEventListener('click', () => {
      setTimeout(() => {
        animateSkillBars();
      }, 300);
    });
  }
}

/* =========================
   ABOUT SECTION - FOLDER CARDS
========================= */
const folderHeaders = document.querySelectorAll('.folder-header');

folderHeaders.forEach(header => {
  header.addEventListener('click', () => {
    const isExpanded = header.getAttribute('aria-expanded') === 'true';
    
    // Close other folders
    folderHeaders.forEach(h => {
      if (h !== header) {
        h.setAttribute('aria-expanded', 'false');
      }
    });
    
    // Toggle current folder
    header.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
  });
});

/* =========================
   ABOUT SECTION - QUOTE MARQUEE SCROLL
========================= */
const marquee = document.querySelector('.quote-marquee');
if (marquee) {
  // Duplicate the content for seamless looping
  const items = marquee.querySelectorAll('.quote-line');
  items.forEach(item => {
    const clone = item.cloneNode(true);
    marquee.appendChild(clone);
  });
}

/* =========================
   ABOUT CTA BUTTONS
========================= */
const ctaButtons = document.querySelectorAll('.about-cta [data-action]');

ctaButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const action = btn.getAttribute('data-action');
    
    if (action === 'contact') {
      // Scroll to contact section or open contact form
      const contactSection = document.querySelector('.cta');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Fallback: scroll to footer
        document.querySelector('footer')?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (action === 'work') {
      // Scroll to work section
      const workSection = document.querySelector('.work');
      if (workSection) {
        workSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});
