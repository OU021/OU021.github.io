(() => {
  const page = document.querySelector('.bookshelf-page') || document.querySelector('[data-book-preview]');
  const homepage = page?.hasAttribute('data-book-preview');
  const dialog = document.querySelector('.bookshelf-dialog');
  const shelf = homepage ? page : document.querySelector('.bookshelf-grid');
  if (!page) return;
  const regions = [page,dialog].filter(Boolean);
  // The old key was written on every load, so it cannot identify a reader's choice.
  const languageKey = 'zhilin-bookshelf-language-choice';
  const normalizeLanguage = value => value === 'zh' ? 'zh-Hant' : ['en','zh-Hans','zh-Hant'].includes(value) ? value : 'en';
  let language = 'en';
  const updateRegion = region => {
    region.dataset.lang = language;
    region.lang = language;
    const labels = [region,...region.querySelectorAll('[data-aria-en]')];
    labels.forEach(element => {
      const value = element.getAttribute(`data-aria-${language}`);
      if (value) element.setAttribute('aria-label',value);
    });
    region.querySelectorAll('[data-alt-en]').forEach(image => {
      image.alt = image.getAttribute(`data-alt-${language}`);
    });
    region.querySelectorAll('[data-set-lang]').forEach(button => {
      button.setAttribute('aria-pressed',String(button.dataset.setLang === language));
    });
  };
  const setLanguage = value => {
    language = normalizeLanguage(value);
    regions.forEach(updateRegion);
  };
  regions.forEach(region => {
    region.querySelectorAll('.bookshelf-language').forEach(toggle => { toggle.hidden = homepage; });
    region.querySelectorAll('[data-set-lang]').forEach(button => {
      button.addEventListener('click', () => {
        if (homepage) return;
        setLanguage(button.dataset.setLang);
        try { localStorage.setItem(languageKey,language); } catch {}
      });
    });
  });
  try {
    const saved = homepage ? null : localStorage.getItem(languageKey);
    language = normalizeLanguage(saved);
  } catch {}
  setLanguage(language);
  if (!dialog || !shelf || typeof dialog.showModal !== 'function') return;
  const content = dialog.querySelector('[data-book-content]');
  const closeButton = dialog.querySelector('.bookshelf-close');
  if (!content || !closeButton) return;
  const bookLinks = [...shelf.querySelectorAll('[data-book-template]')];
  const paging = dialog.querySelector('.book-paging');
  const previous = dialog.querySelector('[data-book-previous]');
  const next = dialog.querySelector('[data-book-next]');
  const counter = dialog.querySelector('[data-book-counter]');
  let opener = null;
  let current = -1;
  let closing = false;
  let backdropPointerDown = false;

  bookLinks.forEach(link => link.setAttribute('aria-haspopup','dialog'));
  if (paging) paging.hidden = bookLinks.length < 2;
  const bookHash = link => {
    const id = link?.closest('[data-book-id]')?.dataset.bookId;
    return id ? `#book-${id}` : '';
  };
  const setBookHash = link => {
    if (homepage) return;
    const hash = bookHash(link);
    if (!hash || hash === location.hash) return;
    const url = new URL(location.href);
    url.hash = hash;
    history.replaceState(history.state,'',url);
  };

  const openBook = (link, {syncHash = true, reading = false} = {}) => {
    if (!link || !shelf.contains(link)) return false;
    const template = document.getElementById(link.dataset.bookTemplate);
    if (!(template instanceof HTMLTemplateElement) || !template.content.firstElementChild) return false;
    const wasOpen = dialog.open;
    const focusInContent = content.contains(document.activeElement);
    window.previewMotion?.cancel(dialog);
    closing = false;
    content.replaceChildren(template.content.cloneNode(true));
    updateRegion(dialog);
    const title = content.querySelector('h2[id]');
    if (title) {
      dialog.setAttribute('aria-labelledby',title.id);
      title.tabIndex = -1;
    }
    try {
      if (!dialog.open) dialog.showModal();
    } catch {
      return false;
    }
    if (!wasOpen) opener = link;
    current = bookLinks.indexOf(link);
    if (counter) counter.textContent = `${current + 1} / ${bookLinks.length}`;
    if (syncHash) setBookHash(link);
    dialog.scrollTop = 0;
    if (reading || focusInContent) title?.focus({preventScroll:true});
    document.documentElement.classList.add('bookshelf-modal-open');
    if (!wasOpen) window.previewMotion?.open(dialog,link.querySelector('img'),content.querySelector('.book-detail-cover img'));
    return true;
  };
  shelf.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('[data-book-template]');
    if (openBook(link)) event.preventDefault();
  });

  const stepBook = offset => {
    if (!dialog.open || closing || bookLinks.length < 2) return;
    const index = (current + offset + bookLinks.length) % bookLinks.length;
    openBook(bookLinks[index],{reading:true});
  };
  previous?.addEventListener('click',() => stepBook(-1));
  next?.addEventListener('click',() => stepBook(1));
  dialog.addEventListener('keydown',event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.target.closest('input,textarea,select,[contenteditable]')) return;
    if (['ArrowLeft','ArrowRight'].includes(event.key) && bookLinks.length > 1) {
      event.preventDefault();
      stepBook(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  const closeBook = () => {
    if (closing || !dialog.open) return;
    closing = true;
    if (window.previewMotion) window.previewMotion.close(dialog,bookLinks[current]?.querySelector('img'),content.querySelector('.book-detail-cover img'));
    else dialog.close();
  };
  closeButton.addEventListener('click',closeBook);
  dialog.addEventListener('cancel',event => { event.preventDefault(); closeBook(); });
  dialog.addEventListener('close', () => {
    window.previewMotion?.cancel(dialog);
    document.documentElement.classList.remove('bookshelf-modal-open');
    dialog.removeAttribute('aria-labelledby');
    content.replaceChildren();
    if (!homepage && location.hash === bookHash(bookLinks[current])) {
      history.replaceState(history.state,'',location.pathname + location.search);
    }
    if (opener?.isConnected) opener.focus({preventScroll:true});
    opener = null;
    current = -1;
    closing = false;
    backdropPointerDown = false;
  });

  const outsideDialog = event => {
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  };
  dialog.addEventListener('pointerdown', event => {
    backdropPointerDown = event.target === dialog && outsideDialog(event);
  });
  dialog.addEventListener('click', event => {
    if (backdropPointerDown && event.target === dialog && outsideDialog(event)) closeBook();
    backdropPointerDown = false;
  });
  const openLinkedBook = () => {
    const id = location.hash.slice(1);
    const book = id.startsWith('book-') ? document.getElementById(id) : null;
    if (book && shelf.contains(book)) openBook(book.querySelector('[data-book-template]'),{syncHash:false});
    else if (dialog.open) dialog.close();
  };
  if (!homepage) {
    window.addEventListener('hashchange',openLinkedBook);
    openLinkedBook();
  }
})();
