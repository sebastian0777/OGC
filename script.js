const year = document.getElementById('year');
if (year) {
  year.textContent = String(new Date().getFullYear());
}

const navToggle = document.querySelector('.nav-toggle');
const navScrim = document.querySelector('.nav-scrim');
const modeToggle = document.getElementById('mode-toggle');
const modeToggleLabel = modeToggle ? modeToggle.querySelector('strong') : null;
const homeSections = document.querySelectorAll('.mode-home');
const shopSections = document.querySelectorAll('.mode-shop');
let switchingMode = false;

const closeMobileNav = () => {
  document.body.classList.remove('nav-open');
  if (navToggle) {
    navToggle.setAttribute('aria-expanded', 'false');
  }
};

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

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const introScreen = document.getElementById('intro-screen');

if (introScreen) {
  const introDuration = prefersReducedMotion ? 120 : 1740;
  window.setTimeout(() => {
    introScreen.classList.add('hidden');
  }, introDuration);
}

const easeInOutCubic = (t) => {
  if (t < 0.5) return 4 * t * t * t;
  return 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const smoothScrollTo = (targetY, duration = 700) => {
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

const scrollToTarget = (target) => {
  const targetY = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();

  if (prefersReducedMotion) {
    window.scrollTo(0, targetY);
  } else {
    smoothScrollTo(targetY);
  }
};

const setShopMode = (enabled, options = {}) => {
  const { scrollToTop = false } = options;
  document.body.classList.toggle('shop-mode', enabled);

  if (modeToggle) {
    if (modeToggleLabel) {
      modeToggleLabel.textContent = enabled ? 'Servicios' : 'Tienda';
    }
    modeToggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  }

  homeSections.forEach((section) => section.setAttribute('aria-hidden', enabled ? 'true' : 'false'));
  shopSections.forEach((section) => section.setAttribute('aria-hidden', enabled ? 'false' : 'true'));

  if (scrollToTop) {
    if (prefersReducedMotion) {
      window.scrollTo(0, 0);
    } else {
      smoothScrollTo(0, 480);
    }
  }
};

const toggleModeWithTransition = () => {
  if (switchingMode) return;
  if (prefersReducedMotion) {
    const nextIsShopMode = !document.body.classList.contains('shop-mode');
    setShopMode(nextIsShopMode, { scrollToTop: true });
    return;
  }

  switchingMode = true;
  const nextIsShopMode = !document.body.classList.contains('shop-mode');

  document.body.classList.add('mode-switching');
  window.setTimeout(() => {
    setShopMode(nextIsShopMode, { scrollToTop: true });
  }, 220);

  window.setTimeout(() => {
    document.body.classList.remove('mode-switching');
    switchingMode = false;
  }, 760);
};

if (modeToggle) {
  modeToggle.addEventListener('click', () => {
    toggleModeWithTransition();
    closeMobileNav();
  });
}

setShopMode(window.location.hash === '#tienda', { scrollToTop: false });

const internalLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
internalLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const hash = link.getAttribute('href');
    const target = hash ? document.querySelector(hash) : null;
    if (!target) return;

    const goShop = hash === '#tienda';
    const shopModeActive = document.body.classList.contains('shop-mode');
    const isHomeTarget = target.classList.contains('mode-home');

    if (goShop && !shopModeActive) {
      event.preventDefault();
      setShopMode(true, { scrollToTop: false });
      requestAnimationFrame(() => {
        scrollToTarget(target);
        history.pushState(null, '', hash);
      });
      closeMobileNav();
      return;
    }

    if (!goShop && shopModeActive && isHomeTarget) {
      event.preventDefault();
      setShopMode(false, { scrollToTop: false });
      requestAnimationFrame(() => {
        scrollToTarget(target);
        history.pushState(null, '', hash);
      });
      closeMobileNav();
      return;
    }

    event.preventDefault();
    scrollToTarget(target);

    history.pushState(null, '', hash);
    closeMobileNav();
  });
});

const openWhatsApp = (message) => {
  const base = 'https://wa.me/573203851590';
  const url = `${base}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const quickButtons = document.querySelectorAll('.wa-option');
quickButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const message = button.dataset.message || 'Hola Oscar, quiero información de tus servicios.';
    openWhatsApp(message);
  });
});

const addCartButtons = document.querySelectorAll('.add-cart');
const cartCount = document.getElementById('cart-count');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartClear = document.getElementById('cart-clear');
const cartCheckout = document.getElementById('cart-checkout');
const cartState = new Map();

const parsePriceCop = (text) => Number((text || '').replace(/[^\d]/g, '')) || 0;

const formatPriceCop = (value) => {
  const safe = Number.isFinite(value) ? value : 0;
  return `$${safe.toLocaleString('es-CO')} COP`;
};

const renderCart = () => {
  if (!cartItems || !cartTotal || !cartCount) return;

  const entries = Array.from(cartState.values());
  const totalUnits = entries.reduce((acc, item) => acc + item.qty, 0);
  const totalValue = entries.reduce((acc, item) => acc + (item.price * item.qty), 0);

  cartCount.textContent = `${totalUnits} ${totalUnits === 1 ? 'producto' : 'productos'}`;
  cartTotal.textContent = formatPriceCop(totalValue);

  if (!entries.length) {
    cartItems.innerHTML = '<li class="empty">Aún no agregas productos.</li>';
    return;
  }

  cartItems.innerHTML = entries.map((item) => `
    <li>
      <div class="item-row"><strong>${item.name}</strong><span>${formatPriceCop(item.price * item.qty)}</span></div>
      <div class="item-meta">${item.qty} x ${formatPriceCop(item.price)}</div>
    </li>
  `).join('');
};

addCartButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const itemCard = button.closest('.shop-item');
    if (!itemCard) return;

    const name = itemCard.querySelector('h3')?.textContent?.trim() || 'Producto';
    const priceText = itemCard.querySelector('.price')?.textContent?.trim() || '$0 COP';
    const price = parsePriceCop(priceText);

    const current = cartState.get(name) || { name, price, qty: 0 };
    current.qty += 1;
    cartState.set(name, current);
    renderCart();
  });
});

if (cartClear) {
  cartClear.addEventListener('click', () => {
    cartState.clear();
    renderCart();
  });
}

if (cartCheckout) {
  cartCheckout.addEventListener('click', () => {
    const entries = Array.from(cartState.values());
    if (!entries.length) return;

    const totalValue = entries.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const detailLines = entries.map((item) => `- ${item.name} x${item.qty} (${formatPriceCop(item.price * item.qty)})`);

    const message = [
      'Hola Oscar, quiero completar esta compra de productos de aseo:',
      ...detailLines,
      `Total estimado: ${formatPriceCop(totalValue)}`,
      'Ciudad: Pereira'
    ].join('\n');

    openWhatsApp(message);
  });
}

renderCart();

const leadForm = document.getElementById('lead-form');
const serviceSelect = document.getElementById('servicio');

if (leadForm) {
  leadForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const servicio = serviceSelect?.value?.trim() || '';
    const descripcion = document.getElementById('descripcion')?.value?.trim() || 'No especificada';
    const ciudad = 'Pereira';

    if (!servicio) {
      document.getElementById('servicio')?.focus();
      return;
    }

    const message = [
      'Hola Oscar, vengo de tu página web y quiero cotizar.',
      `Servicio: ${servicio}`,
      `Descripción: ${descripcion}`,
      `Ciudad/Zona: ${ciudad}`
    ].join('\n');

    openWhatsApp(message);
  });
}

const carousel = document.querySelector('.service-carousel');
const slides = document.querySelectorAll('.carousel-slide');
const prevArrow = document.querySelector('.carousel-arrow.prev');
const nextArrow = document.querySelector('.carousel-arrow.next');
let carouselIndex = 0;
let carouselTimer = null;
let touchStartX = 0;
let touchEndX = 0;

const renderCarousel = (index) => {
  slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
};

const nextCarousel = () => {
  carouselIndex = (carouselIndex + 1) % slides.length;
  renderCarousel(carouselIndex);
};

const prevCarousel = () => {
  carouselIndex = (carouselIndex - 1 + slides.length) % slides.length;
  renderCarousel(carouselIndex);
};

const startCarousel = () => {
  if (slides.length < 2 || prefersReducedMotion) return;
  clearInterval(carouselTimer);
  carouselTimer = setInterval(nextCarousel, 4200);
};

if (slides.length) {
  renderCarousel(carouselIndex);
  startCarousel();

  if (carousel) {
    carousel.addEventListener('mouseenter', () => clearInterval(carouselTimer));
    carousel.addEventListener('mouseleave', startCarousel);
    carousel.addEventListener('touchstart', () => clearInterval(carouselTimer), { passive: true });
    carousel.addEventListener('touchend', startCarousel, { passive: true });

    carousel.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0].clientX;
      touchEndX = touchStartX;
    }, { passive: true });

    carousel.addEventListener('touchmove', (event) => {
      touchEndX = event.changedTouches[0].clientX;
    }, { passive: true });

    carousel.addEventListener('touchend', () => {
      const deltaX = touchEndX - touchStartX;
      const threshold = 40;

      if (Math.abs(deltaX) > threshold) {
        if (deltaX < 0) {
          nextCarousel();
        } else {
          prevCarousel();
        }
        startCarousel();
      }

      touchStartX = 0;
      touchEndX = 0;
    }, { passive: true });
  }

  if (prevArrow) {
    prevArrow.addEventListener('click', () => {
      prevCarousel();
      startCarousel();
    });
  }

  if (nextArrow) {
    nextArrow.addEventListener('click', () => {
      nextCarousel();
      startCarousel();
    });
  }
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

const counters = document.querySelectorAll('.counter');
const animateCounter = (el) => {
  const target = Number(el.dataset.target || '0');
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const duration = 1200;
  const start = performance.now();

  const frame = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = easeInOutCubic(progress);
    const value = Math.round(target * eased);
    el.textContent = `${prefix}${value}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  };

  requestAnimationFrame(frame);
};

if (counters.length) {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.55 }
  );

  counters.forEach((counter) => counterObserver.observe(counter));
}

