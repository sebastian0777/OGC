const year = document.getElementById('year');
if (year) {
  year.textContent = String(new Date().getFullYear());
}

const animated = document.querySelectorAll('.reveal, .reveal-delay');
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

animated.forEach((el) => observer.observe(el));

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const easeInOutCubic = (t) => {
  if (t < 0.5) {
    return 4 * t * t * t;
  }
  return 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const smoothScrollTo = (targetY, duration = 820) => {
  const startY = window.scrollY;
  const distance = targetY - startY;
  let startTime = null;

  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);

    window.scrollTo(0, startY + distance * eased);

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
};

const getHeaderOffset = () => {
  const header = document.querySelector('.site-header');
  return header ? header.offsetHeight + 8 : 0;
};

const internalLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
const navToggle = document.querySelector('.nav-toggle');
const navScrim = document.querySelector('.nav-scrim');

const closeMobileNav = () => {
  if (document.body.classList.contains('nav-open')) {
    document.body.classList.remove('nav-open');
  }
  if (navToggle) {
    navToggle.setAttribute('aria-expanded', 'false');
  }
};

internalLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const hash = link.getAttribute('href');
    const target = hash ? document.querySelector(hash) : null;

    if (!target) return;

    event.preventDefault();

    const targetY = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();

    if (prefersReducedMotion) {
      window.scrollTo(0, targetY);
    } else {
      smoothScrollTo(targetY);
    }

    history.pushState(null, '', hash);

    closeMobileNav();
  });
});

if (navToggle) {
  navToggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

if (navScrim) {
  navScrim.addEventListener('click', closeMobileNav);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMobileNav();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 980) {
    closeMobileNav();
  }
});
