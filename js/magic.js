document.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => document.body.classList.add('loaded'));

  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      reveal.unobserve(entry.target);
    });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el));

  const counts = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting || target.dataset.done) return;
      target.dataset.done = 'true';
      const end = Number(target.dataset.count);
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / 1200, 1);
        target.textContent = Math.round(end * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: .7 });
  document.querySelectorAll('[data-count]').forEach((el) => counts.observe(el));

  const glow = document.querySelector('.cursor-glow');
  const progress = document.querySelector('.scroll-progress');
  const topbar = document.querySelector('.topbar');
  const heroArt = document.querySelector('.hero-art');
  const heroName = document.querySelector('.hero-name');
  let pointerX = 0;
  let pointerY = 0;
  let framePending = false;

  const paintMotion = () => {
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0}%`;
    topbar?.classList.toggle('scrolled', scrollY > 24);
    if (heroArt && scrollY < innerHeight && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      heroArt.style.translate = `${pointerX * 13}px ${scrollY * .08 + pointerY * 9}px`;
      if (heroName) heroName.style.marginLeft = `${pointerX * -8}px`;
    }
    framePending = false;
  };
  const requestPaint = () => {
    if (!framePending) requestAnimationFrame(paintMotion);
    framePending = true;
  };

  if (glow) window.addEventListener('pointermove', (e) => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
    pointerX = e.clientX / innerWidth - .5;
    pointerY = e.clientY / innerHeight - .5;
    requestPaint();
  }, { passive: true });
  window.addEventListener('scroll', requestPaint, { passive: true });
  requestPaint();

  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.project-card');
    if (!card || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - .5;
    const y = (e.clientY - rect.top) / rect.height - .5;
    card.style.transform = `perspective(900px) rotateX(${y * -3}deg) rotateY(${x * 4}deg) translateY(${card.matches(':nth-child(3n+2)') && innerWidth > 800 ? '3rem' : '0'})`;
  }, { passive: true });
  document.addEventListener('pointerout', (e) => {
    const card = e.target.closest?.('.project-card');
    if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
  }, { passive: true });

  const menu = document.querySelector('.menu');
  const nav = document.querySelector('.topbar nav');
  const setMenuState = (open) => {
    nav?.classList.toggle('open', open);
    menu?.classList.toggle('open', open);
    menu?.setAttribute('aria-expanded', String(open));
    menu?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menu?.setAttribute('aria-expanded', 'false');
  menu?.addEventListener('click', () => setMenuState(!nav?.classList.contains('open')));
  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuState(false)));

  const navLinks = [...(nav?.querySelectorAll('a[href^="#"]') || [])];
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${visible.target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-28% 0px -60%', threshold: [0, .15, .5] });
  document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));

});
