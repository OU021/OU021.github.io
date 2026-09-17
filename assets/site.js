const more = document.querySelector('details');
if (more) {
  document.addEventListener('click', event => { if (!more.contains(event.target)) more.open = false; });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && more.open) { more.open = false; more.querySelector('summary').focus(); }
  });
}

const figureDialog = document.querySelector('.figure-dialog');
if (figureDialog && typeof figureDialog.showModal === 'function') {
  const dialogImage = figureDialog.querySelector('img');
  document.querySelectorAll('[data-figure]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const preview = link.querySelector('img');
      dialogImage.src = link.href;
      dialogImage.alt = preview.alt;
      dialogImage.width = preview.width;
      dialogImage.height = preview.height;
      figureDialog.setAttribute('aria-label', preview.alt);
      figureDialog.showModal();
      document.body.classList.add('modal-open');
    });
  });
  figureDialog.querySelector('button').setAttribute('aria-label', 'Close image preview');
  figureDialog.querySelector('button').addEventListener('click', () => figureDialog.close());
  figureDialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
  figureDialog.addEventListener('click', event => { if (event.target === figureDialog) figureDialog.close(); });
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window) {
  if (!reducedMotion.matches) {
    const reveal = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        reveal.unobserve(entry.target);
      }
    }, {threshold: .06});
    document.querySelectorAll('.section, .photo-note').forEach(section => {
      if (section.getBoundingClientRect().top > window.innerHeight) { section.classList.add('reveal'); reveal.observe(section); }
    });
  }
  const navLinks = [...document.querySelectorAll('.nav-links > a')];
  const visibleSections = new Set();
  const updateActive = () => {
    const sections = [...visibleSections];
    const selected = sections.find(section => '#' + section.id === location.hash) || sections.sort((a,b) => a.getBoundingClientRect().top-b.getBoundingClientRect().top)[0];
    navLinks.forEach(link => {
      if (selected && link.hash === '#' + selected.id) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  };
  const active = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visibleSections.add(entry.target) : visibleSections.delete(entry.target));
    updateActive();
  }, {rootMargin: '-15% 0px -65% 0px', threshold:0});
  window.addEventListener('hashchange', updateActive);
  document.querySelectorAll('main .section').forEach(section => active.observe(section));
}

