/* Progressive enhancement: all professional content and icons live in HTML. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  document.documentElement.classList.replace('no-js', 'js');
  $('#year').textContent = new Date().getFullYear();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 801px)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

  // Mobile navigation is modal; its background is inert only while open.
  const menu = $('#mobile-menu');
  const menuButton = $('.menu-toggle');
  const background = [$('#main'), $('footer'), $('.brand')];
  let menuOpen = false;
  function setMenu(open, restoreFocus = true) {
    menuOpen = open;
    menu.inert = !open;
    background.forEach((node) => { node.inert = open; });
    menu.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) menu.querySelector('a').focus();
    else if (restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => setMenu(!menuOpen));
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    setMenu(false, false);
    const target = document.querySelector(link.hash);
    target?.focus({ preventScroll: true });
  }));
  document.addEventListener('keydown', (event) => {
    if (!menuOpen) return;
    if (event.key === 'Escape') { event.preventDefault(); setMenu(false); }
    if (event.key === 'Tab') {
      const items = [menuButton, ...menu.querySelectorAll('a')];
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  desktop.addEventListener('change', () => {
    if (desktop.matches && menuOpen) { setMenu(false, false); $('header nav a').focus(); }
  });
  const header = $('header');
  const updateHeader = () => header.classList.toggle('scrolled', scrollY > 24);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // Keep native fragments/history, with a single current section indicator.
  const navLinks = $$('header nav a');
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => {
        const active = link.hash === '#' + visible.target.id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    $$('main section[id]').forEach((section) => sectionObserver.observe(section));
  }

  // Filter existing cards instead of replacing content or moving keyboard focus.
  $('.filters').hidden = false;
  const cards = $$('.skill');
  $$('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    $$('[data-filter]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    cards.forEach((card) => { card.hidden = category !== 'All' && card.dataset.category !== category; });
    $('#filter-status').textContent = `${cards.filter((card) => !card.hidden).length} ${category === 'All' ? '' : category.toLowerCase() + ' '}capabilities and tools shown.`;
  }));

  // Observe once. Unseen sections remain readable even if observers fail.
  if ('IntersectionObserver' in window && !reduced.matches) {
    const reveals = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('entered'); observer.unobserve(entry.target); }
    }), { threshold: .08 });
    $$('.about-grid,.principles,.heading-row,.experience-item,.practice,.footer-top').forEach((el) => reveals.observe(el));
  }

  // A finite sequence with one cancellable timer; repeated replay never stacks work.
  const workflow = $('.workflow'), phase = $('.phase'), replay = $('.replay');
  const phases = ['01 / INFORMATION', '02 / UNDERSTANDING', '03 / CONNECTION', '04 / CLARITY'];
  let phaseTimer = 0, frame = 0;
  function stopSequence() {
    clearTimeout(phaseTimer); cancelAnimationFrame(frame);
    workflow.classList.remove('running'); phase.textContent = phases[3];
  }
  function startSequence() {
    stopSequence();
    if (reduced.matches || document.hidden) return;
    frame = requestAnimationFrame(() => {
      workflow.classList.add('running'); phase.textContent = phases[0];
      let index = 0;
      const next = () => {
        phase.textContent = phases[++index];
        if (index < 3) phaseTimer = setTimeout(next, 900);
      };
      phaseTimer = setTimeout(next, 900);
    });
  }
  replay.hidden = false;
  replay.addEventListener('click', startSequence);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopSequence(); });
  window.addEventListener('pagehide', stopSequence);
  startSequence();

  // Decorative cursor: native pointer stays intact; no idle animation loop.
  const cursor = $('.cursor');
  let pointerFrame = 0, pointerX = 0, pointerY = 0, over = false;
  function hideCursor() { cancelAnimationFrame(pointerFrame); pointerFrame = 0; cursor.style.opacity = '0'; }
  window.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || reduced.matches || event.pointerType === 'touch') { hideCursor(); return; }
    pointerX = event.clientX; pointerY = event.clientY;
    over = Boolean(event.target.closest('a,button,summary'));
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      cursor.style.transform = `translate3d(${pointerX + 10}px,${pointerY + 10}px,0) scale(${over ? 1.7 : 1})`;
      cursor.classList.toggle('over', over); cursor.style.opacity = '1'; pointerFrame = 0;
    });
  }, { passive: true });
  document.addEventListener('pointerleave', hideCursor);
  window.addEventListener('blur', hideCursor);
  finePointer.addEventListener('change', hideCursor);
  reduced.addEventListener('change', () => { stopSequence(); hideCursor(); });

  let copyTimer = 0;
  $('.copy-email').addEventListener('click', async () => {
    const status = $('.copy-status'); clearTimeout(copyTimer);
    try {
      await navigator.clipboard.writeText('sowndaryas397@gmail.com');
      status.textContent = 'Email address copied.';
    } catch { status.textContent = 'Copy this address: sowndaryas397@gmail.com'; }
    copyTimer = setTimeout(() => { status.textContent = ''; }, 6000);
  });
})();
