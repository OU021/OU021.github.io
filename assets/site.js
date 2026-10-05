const more = document.querySelector('.nav-links details');
if (more) {
  document.addEventListener('click', event => { if (!more.contains(event.target)) more.open = false; });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && more.open) { more.open = false; more.querySelector('summary').focus(); }
  });
}

const copyEmail = document.querySelector('[data-copy-email]');
if (copyEmail && navigator.clipboard?.writeText) {
  const status = document.querySelector('[data-copy-status]');
  let resetFeedback;
  copyEmail.hidden = false;
  copyEmail.addEventListener('click', async () => {
    clearTimeout(resetFeedback);
    copyEmail.classList.remove('is-copy-error');
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(copyEmail.dataset.copyEmail);
      copyEmail.dataset.copyLabel = 'Copied';
      copyEmail.classList.add('is-copied');
      status.textContent = 'Email address copied.';
      resetFeedback = setTimeout(() => {
        copyEmail.classList.remove('is-copied');
        copyEmail.dataset.copyLabel = 'Copy email';
      }, 2200);
    } catch {
      copyEmail.classList.remove('is-copied');
      copyEmail.classList.add('is-copy-error');
      copyEmail.dataset.copyLabel = copyEmail.dataset.copyEmail;
      status.textContent = `Could not copy. Email address: ${copyEmail.dataset.copyEmail}`;
    }
  });
}

const figureDialog = document.querySelector('.figure-dialog');
if (figureDialog && typeof figureDialog.showModal === 'function') {
  const dialogImage = figureDialog.querySelector('img');
  const closeButton = figureDialog.querySelector('.figure-close');
  const links = [...document.querySelectorAll('[data-figure]')];
  const page = document.querySelector('[data-photo-region]');
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
  let album = [], current = 0, opener = null, backdropDown = false, swipe = null;
  const photoTones = new Map();
  const photoTone = image => {
    if (!image?.complete || !image.naturalWidth) return null;
    const source = image.currentSrc || image.src;
    if (photoTones.has(source)) return photoTones.get(source);
    try {
      // A tiny, local colour sample only; the displayed photograph stays untouched.
      const sample = document.createElement('canvas');
      sample.width = sample.height = 24;
      const context = sample.getContext('2d',{willReadFrequently:true});
      if (!context) return null;
      context.drawImage(image,0,0,24,24);
      const pixels = context.getImageData(0,0,24,24).data;
      const tones = Array.from({length:12},()=>({weight:0,r:0,g:0,b:0}));
      for (let i=0;i<pixels.length;i+=4) {
        const [r,g,b] = [pixels[i],pixels[i+1],pixels[i+2]];
        const max = Math.max(r,g,b), min = Math.min(r,g,b), chroma = max-min;
        if (pixels[i+3]<128 || max<35 || min>225 || chroma<18) continue;
        let hue = max===r ? (g-b)/chroma : max===g ? (b-r)/chroma+2 : (r-g)/chroma+4;
        hue = (hue+6)%6;
        const tone = tones[Math.floor(hue*2)];
        const weight = Math.min(chroma/max,.65);
        tone.weight += weight;
        tone.r += r*weight; tone.g += g*weight; tone.b += b*weight;
      }
      const dominant = tones.reduce((a,b)=>b.weight>a.weight?b:a);
      const colour = dominant.weight>3
        ? ['r','g','b'].map((channel,i)=>Math.round(dominant[channel]/dominant.weight*.34+[40,37,34][i]*.66))
        : [50,45,40];
      const tone = `rgb(${colour.join(' ')} / .68)`;
      photoTones.set(source,tone);
      return tone;
    } catch { return null; }
  };
  const updatePhotoLight = () => {
    const link = album[current];
    if (!link?.dataset.album) { figureDialog.style.removeProperty('--photo-backdrop'); return; }
    const tone = photoTone(link.querySelector('img')) || (dialogImage.src===link.href ? photoTone(dialogImage) : null);
    if (tone) figureDialog.style.setProperty('--photo-backdrop',tone);
    else figureDialog.style.removeProperty('--photo-backdrop');
  };
  dialogImage.addEventListener('load',updatePhotoLight);
  const languageKey = page?.classList.contains('exhibitions-page') ? 'zhilin-exhibitions-language-choice' : 'zhilin-photography-language-choice';
  const normalizeLanguage = value => value === 'zh' ? 'zh-Hant' : ['en','zh-Hans','zh-Hant'].includes(value) ? value : 'en';
  const photoLabels = {
    en: {language:'Language',view:'View photograph: ',close:'Put the photo away',previous:'Previous photograph',next:'Next photograph',paging:'Photograph navigation',zoomIn:'View details',zoomOut:'Full photo',zoomed:'Photo enlarged. Drag or use arrow keys to explore; click the photo again to fit.',imageRegion:'Photo detail viewer'},
    'zh-Hans': {language:'语言',view:'查看照片：',close:'收起照片',previous:'上一张照片',next:'下一张照片',paging:'翻阅照片',zoomIn:'看看细节',zoomOut:'完整照片',zoomed:'照片已放大。拖动或使用方向键查看，再次点击照片还原。',imageRegion:'照片细节浏览'},
    'zh-Hant': {language:'語言',view:'查看照片：',close:'收起照片',previous:'上一張照片',next:'下一張照片',paging:'翻閱照片',zoomIn:'看看細節',zoomOut:'完整照片',zoomed:'照片已放大。拖動或使用方向鍵查看，再次點擊照片還原。',imageRegion:'照片細節瀏覽'},
  };
  const photoZoom = window.createPhotoZoom?.({
    dialog:figureDialog,image:dialogImage,
    stage:figureDialog.querySelector('.figure-image-stage'),
    button:figureDialog.querySelector('.figure-zoom'),
    status:figureDialog.querySelector('[data-zoom-status]'),
  });
  let language = 'en';
  try {
    const saved = page ? localStorage.getItem(languageKey) : null;
    language = normalizeLanguage(saved);
  } catch {}
  const textFor = (link,name) => link.getAttribute(`data-photo-${name}-${language}`) || '';
  const showImage = link => {
    swipe = null;
    photoZoom?.reset();
    window.previewMotion?.cancel(figureDialog);
    const preview = link.querySelector('img');
    const isPhoto = !!link.dataset.album;
    dialogImage.src = link.href;
    updatePhotoLight();
    dialogImage.alt = isPhoto ? textFor(link,'alt') : preview.alt;
    dialogImage.width = Number(preview.getAttribute('width'));
    dialogImage.height = Number(preview.getAttribute('height'));
    figureDialog.setAttribute('aria-label',dialogImage.alt);
    figureDialog.lang = isPhoto ? language : 'en';
    dialogLanguage.hidden = !isPhoto || !page;
    title.textContent = isPhoto ? textFor(link,'title') : '';
    caption.textContent = isPhoto ? textFor(link,'caption') : '';
    metadata.textContent = isPhoto ? textFor(link,'meta') : '';
    metadata.hidden = !metadata.textContent;
    bottom.hidden = !isPhoto;
    paging.hidden = album.length < 2;
    counter.textContent = `${current + 1} / ${album.length}`;
    figureDialog.classList.toggle('has-caption',isPhoto);
    const labels = photoLabels[isPhoto ? language : 'en'];
    const closeLabel = isPhoto ? labels.close : 'Close';
    closeButton.firstChild.textContent = closeLabel + ' ';
    closeButton.setAttribute('aria-label',isPhoto ? closeLabel : 'Close framework preview');
    previous.setAttribute('aria-label',labels.previous);
    next.setAttribute('aria-label',labels.next);
    paging.setAttribute('aria-label',labels.paging);
    photoZoom?.update({enabled:isPhoto,labels});
  };
  const updateLanguage = () => {
    const labels = photoLabels[language];
    if (page) { page.dataset.lang = language; page.lang = language; }
    languageButtons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.setPhotoLang === language)));
    document.querySelectorAll('.photo-language').forEach(group => group.setAttribute('aria-label',labels.language));
    links.filter(link => link.dataset.album).forEach(link => {
      link.setAttribute('aria-label',labels.view + textFor(link,'title'));
      link.querySelector('img').alt = textFor(link,'alt');
    });
    page?.querySelectorAll('img[data-alt-en]').forEach(image => {
      image.alt = image.getAttribute(`data-alt-${language}`);
    });
    if (figureDialog.open && album[current]?.dataset.album) showImage(album[current]);
  };
  if (page) page.querySelector('.photo-language').hidden = false;
  languageButtons.forEach(button => button.addEventListener('click', () => {
    if (!page) return;
    language = normalizeLanguage(button.dataset.setPhotoLang);
    try { localStorage.setItem(languageKey,language); } catch {}
    updateLanguage();
  }));
  updateLanguage();
  const step = offset => {
    if (album.length < 2) return;
    current = (current + offset + album.length) % album.length;
    showImage(album[current]);
  };
  // Swiping belongs to the photo surface; text, vertical scrolling and pinch zoom stay native.
  const zoomed = () => (window.visualViewport?.scale || 1)>1.01;
  dialogImage.addEventListener('pointerdown',event => {
    if (event.pointerType!=='touch') return;
    swipe = event.isPrimary && figureDialog.open && album.length>1 && !zoomed() && !photoZoom?.isZoomed
      ? {id:event.pointerId,x:event.clientX,y:event.clientY,time:event.timeStamp} : null;
  },{passive:true});
  figureDialog.addEventListener('pointerdown',event => {
    if (event.pointerType==='touch' && !event.isPrimary) swipe = null;
  },{passive:true});
  dialogImage.addEventListener('pointermove',event => {
    if (!swipe || event.pointerId!==swipe.id) return;
    const dx=Math.abs(event.clientX-swipe.x), dy=Math.abs(event.clientY-swipe.y);
    if (zoomed() || (dy>12 && dy>dx)) swipe=null;
  },{passive:true});
  dialogImage.addEventListener('pointerup',event => {
    const start=swipe; swipe=null;
    if (!start || event.pointerId!==start.id || zoomed() || photoZoom?.isZoomed || !figureDialog.open) return;
    const dx=event.clientX-start.x, dy=event.clientY-start.y;
    const threshold=Math.max(42,Math.min(90,dialogImage.clientWidth*.14));
    if (Math.abs(dx)>=threshold && Math.abs(dx)>Math.abs(dy)*1.5 && event.timeStamp-start.time<1000) step(dx<0?1:-1);
  },{passive:true});
  for (const event of ['pointercancel','lostpointercapture']) dialogImage.addEventListener(event,()=>{swipe=null;},{passive:true});
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
      photoZoom?.refresh();
      document.body.classList.add('modal-open');
      window.previewMotion?.open(figureDialog,link.querySelector('img'),dialogImage);
    });
  });
  const closeFigure = () => window.previewMotion ? window.previewMotion.close(figureDialog,photoZoom?.isZoomed ? null : album[current]?.querySelector('img'),dialogImage) : figureDialog.close();
  closeButton.addEventListener('click',closeFigure);
  figureDialog.addEventListener('cancel',event => { event.preventDefault(); closeFigure(); });
  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  figureDialog.addEventListener('keydown', event => {
    if (photoZoom?.handleKey(event)) return;
    if (album.length > 1 && ['ArrowLeft','ArrowRight'].includes(event.key)) {
      event.preventDefault(); step(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  figureDialog.addEventListener('close', () => {
    swipe = null;
    photoZoom?.reset();
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
