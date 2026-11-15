// Pega O Desconto — landing
const CWS_URL = 'https://chromewebstore.google.com/detail/pega-o-desconto/nkjhgolgbhlejnagekgpfadmhadejgfm';

document.querySelectorAll('[data-cws]').forEach((a) => { a.href = CWS_URL; });

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const t = (key, fallback) => (window.podT ? window.podT(key) || fallback : fallback);

// ------------------------------------------------------------------- menu
const toggle = document.querySelector('.nav-toggle');
const menu = document.getElementById('menu');
if (toggle && menu) {
  const setMenu = (open) => {
    menu.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? t('nav.aria.close', 'Fechar menu') : t('nav.aria.open', 'Abrir menu'));
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980 && menu.classList.contains('open')) setMenu(false);
  });
  document.addEventListener('pod:langchange', () => {
    if (menu.classList.contains('open')) toggle.setAttribute('aria-label', t('nav.aria.close', 'Fechar menu'));
  });
}

const ano = document.getElementById('ano');
if (ano) ano.textContent = String(new Date().getFullYear());

// ------------------------------------------------------- header e parallax
const header = document.querySelector('.site-header');
const heroMedia = document.querySelector('.hero-media img');
const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const linkById = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));

let ticking = false;
const onScroll = () => {
  const y = window.scrollY;
  if (header) header.classList.toggle('is-scrolled', y > 24);

  if (heroMedia && !reduceMotion) {
    const shift = Math.min(y * 0.12, 90);
    heroMedia.style.transform = `scale(1.06) translate3d(0, ${shift}px, 0)`;
  }

  if (sections.length) {
    const probe = y + 140;
    let current = null;
    for (const s of sections) if (s.offsetTop <= probe) current = s;
    linkById.forEach((a, id) => a.classList.toggle('is-current', !!current && current.id === id));
  }
  ticking = false;
};
window.addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();

// --------------------------------------------------------------- reveals
const revealTargets = document.querySelectorAll('.reveal');
if (!reduceMotion && 'IntersectionObserver' in window) {
  const perParent = new Map();
  revealTargets.forEach((el) => {
    const parent = el.parentElement;
    const n = perParent.get(parent) || 0;
    perParent.set(parent, n + 1);
    el.style.transitionDelay = Math.min(n * 80, 420) + 'ms';
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealTargets.forEach((el) => io.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('in'));
}
