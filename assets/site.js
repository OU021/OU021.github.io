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
  const closeButton = figureDialog.querySelector('.figure-close');
  const links = [...document.querySelectorAll('[data-figure]')];
  const page = document.querySelector('.photography-page');
  const languageButtons = [...document.querySelectorAll('[data-set-photo-lang]')];
  const dialogLanguage = figureDialog.querySelector('.photo-language');
  const bottom = figureDialog.querySelector('.figure-bottom');
  const title = figureDialog.querySelector('[data-photo-title]');
  const caption = figureDialog.querySelector('[data-photo-caption]');
  const metadata = figureDialog.querySelector('[data-photo-meta]');
  const paging = figureDialog.querySelector('.figure-paging');
  const counter = figureDialog.querySelector('[data-photo-counter]');
  const previous = figureDialog.querySelector('[data-photo-previous]');
  const next = figureDialog.querySelector('[data-photo-next]');
  let album = [], current = 0, opener = null, backdropDown = false;
  let language = page ? 'zh' : 'en';
  try {
    const saved = localStorage.getItem('zhilin-photography-language');
    if (saved === 'zh' || saved === 'en') language = saved;
  } catch {}
  const textFor = (link,name) => link.getAttribute(`data-photo-${name}-${language}`) || '';
  const showImage = link => {
    window.previewMotion?.cancel(figureDialog);
    const preview = link.querySelector('img');
    const isPhoto = !!link.dataset.album;
    dialogImage.src = link.href;
    dialogImage.alt = isPhoto ? textFor(link,'alt') : preview.alt;
    dialogImage.width = Number(preview.getAttribute('width'));
    dialogImage.height = Number(preview.getAttribute('height'));
    figureDialog.setAttribute('aria-label',dialogImage.alt);
    figureDialog.lang = isPhoto && language === 'zh' ? 'zh-Hant' : 'en';
    dialogLanguage.hidden = !isPhoto;
    title.textContent = isPhoto ? textFor(link,'title') : '';
    caption.textContent = isPhoto ? textFor(link,'caption') : '';
    metadata.textContent = isPhoto ? textFor(link,'meta') : '';
    metadata.hidden = !metadata.textContent;
    bottom.hidden = !isPhoto;
    paging.hidden = album.length < 2;
    counter.textContent = `${current + 1} / ${album.length}`;
    figureDialog.classList.toggle('has-caption',isPhoto);
    const chinese = isPhoto && language === 'zh';
    closeButton.firstChild.textContent = chinese ? '關閉 ' : 'Close ';
    closeButton.setAttribute('aria-label',chinese ? '關閉照片' : 'Close image preview');
    previous.setAttribute('aria-label',chinese ? '上一張照片' : 'Previous photograph');
    next.setAttribute('aria-label',chinese ? '下一張照片' : 'Next photograph');
    paging.setAttribute('aria-label',chinese ? '翻閱照片' : 'Photograph navigation');
  };
  const updateLanguage = () => {
    if (page) { page.dataset.lang = language; page.lang = language === 'zh' ? 'zh-Hant' : 'en'; }
    languageButtons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.setPhotoLang === language)));
    document.querySelectorAll('.photo-language').forEach(group => group.setAttribute('aria-label',language === 'zh' ? '攝影頁語言' : 'Photography language'));
    links.filter(link => link.dataset.album).forEach(link => {
      link.setAttribute('aria-label',(language === 'zh' ? '查看照片：' : 'View photograph: ') + textFor(link,'title'));
      link.querySelector('img').alt = textFor(link,'alt');
    });
    if (figureDialog.open && album[current]?.dataset.album) showImage(album[current]);
  };
  if (page) page.querySelector('.photo-language').hidden = false;
  languageButtons.forEach(button => button.addEventListener('click', () => {
    language = button.dataset.setPhotoLang === 'en' ? 'en' : 'zh';
    try { localStorage.setItem('zhilin-photography-language',language); } catch {}
    updateLanguage();
  }));
  updateLanguage();
  const step = offset => {
    if (album.length < 2) return;
    current = (current + offset + album.length) % album.length;
    showImage(album[current]);
  };
  links.forEach(link => {
    link.setAttribute('aria-haspopup','dialog');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      album = link.dataset.album ? links.filter(item => item.dataset.album === link.dataset.album) : [link];
      current = album.indexOf(link);
      opener = link;
      showImage(link);
      figureDialog.showModal();
      document.body.classList.add('modal-open');
      window.previewMotion?.open(figureDialog,link.querySelector('img'),dialogImage);
    });
  });
  const closeFigure = () => window.previewMotion ? window.previewMotion.close(figureDialog,album[current]?.querySelector('img'),dialogImage) : figureDialog.close();
  closeButton.addEventListener('click',closeFigure);
  figureDialog.addEventListener('cancel',event => { event.preventDefault(); closeFigure(); });
  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  figureDialog.addEventListener('keydown', event => {
    if (album.length > 1 && ['ArrowLeft','ArrowRight'].includes(event.key)) {
      event.preventDefault(); step(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  figureDialog.addEventListener('close', () => {
    window.previewMotion?.cancel(figureDialog);
    document.body.classList.remove('modal-open');
    if (opener?.isConnected) opener.focus({preventScroll:true});
    backdropDown = false;
  });
  const outside = event => {
    const r = figureDialog.getBoundingClientRect();
    return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
  };
  figureDialog.addEventListener('pointerdown', event => { backdropDown = event.target === figureDialog && outside(event); });
  figureDialog.addEventListener('click', event => {
    if (backdropDown && event.target === figureDialog && outside(event)) closeFigure();
    backdropDown = false;
  });
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
