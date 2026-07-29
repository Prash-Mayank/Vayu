function initNavToggle() {
  const toggle = document.getElementById('lpNavToggle');
  const links = document.getElementById('lpNavLinks');
  if (!toggle || !links) return;
  const close = () => {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  document.addEventListener('click', (e) => {
    if (!links.classList.contains('open')) return;
    if (!links.contains(e.target) && !toggle.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

function initHeroSlideshow() {
  const slides = document.querySelectorAll('.lp-hero-slide');
  if (!slides.length) return;
  slides.forEach((slide, i) => {
    const bg = slide.dataset.bg;
    if (bg) slide.style.backgroundImage = `url('${bg}')`;
  });
  if (slides.length < 2) return;
  let index = 0;
  setInterval(() => {
    slides[index].classList.remove('active');
    index = (index + 1) % slides.length;
    slides[index].classList.add('active');
  }, 6000);
}

function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('in-view'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  targets.forEach((el) => observer.observe(el));
}

function initRippleButtons() {
  document.querySelectorAll('.ripple-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${(e.clientX || rect.left + rect.width / 2) - rect.left - size / 2}px`;
      ripple.style.top = `${(e.clientY || rect.top + rect.height / 2) - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
}

function initFooterYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function initInstallPrompt() {
  const buttons = ['installBtnNav', 'installBtnHero', 'installBtnCta']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const notes = ['installedNote', 'installedNoteCta']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!buttons.length && !notes.length) return;

  let deferredPrompt = null;

  const showInstalled = () => {
    buttons.forEach((b) => { b.hidden = true; });
    notes.forEach((n) => { n.hidden = false; });
  };
  const showInstallable = () => {
    buttons.forEach((b) => { b.hidden = false; b.disabled = false; });
  };

  if (isStandalone()) {
    showInstalled();
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallable();
  });

  buttons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      buttons.forEach((b) => { b.hidden = true; });
    });
  });

  window.addEventListener('appinstalled', showInstalled);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => { });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initHeroSlideshow();
  initScrollReveal();
  initRippleButtons();
  initFooterYear();
  initInstallPrompt();
});