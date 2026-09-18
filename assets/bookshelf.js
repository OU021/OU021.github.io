(() => {
  const page = document.querySelector('.bookshelf-page');
  const dialog = document.querySelector('.bookshelf-dialog');
  const shelf = document.querySelector('.bookshelf-grid');
  if (!page) return;
  const regions = [page,dialog].filter(Boolean);
  let language = 'zh';
  const updateRegion = region => {
    region.dataset.lang = language;
    region.lang = language === 'en' ? 'en' : 'zh-Hant';
    const labels = [region,...region.querySelectorAll('[data-aria-zh]')];
    labels.forEach(element => {
      const value = element.getAttribute(`data-aria-${language}`);
      if (value) element.setAttribute('aria-label',value);
    });
    region.querySelectorAll('[data-alt-zh]').forEach(image => {
      image.alt = image.getAttribute(`data-alt-${language}`);
    });
    region.querySelectorAll('[data-set-lang]').forEach(button => {
      button.setAttribute('aria-pressed',String(button.dataset.setLang === language));
    });
  };
  const setLanguage = value => {
    language = value === 'en' ? 'en' : 'zh';
    regions.forEach(updateRegion);
    try { localStorage.setItem('zhilin-bookshelf-language',language); } catch {}
  };
  regions.forEach(region => {
    region.querySelectorAll('.bookshelf-language').forEach(toggle => { toggle.hidden = false; });
    region.querySelectorAll('[data-set-lang]').forEach(button => {
      button.addEventListener('click', () => setLanguage(button.dataset.setLang));
    });
  });
  try { language = localStorage.getItem('zhilin-bookshelf-language') === 'en' ? 'en' : 'zh'; } catch {}
  setLanguage(language);
  if (!dialog || !shelf || typeof dialog.showModal !== 'function') return;
  const content = dialog.querySelector('[data-book-content]');
  const closeButton = dialog.querySelector('.bookshelf-close');
  if (!content || !closeButton) return;
  let opener = null;
  let backdropPointerDown = false;

  shelf.querySelectorAll('[data-book-template]').forEach(link => link.setAttribute('aria-haspopup','dialog'));

  shelf.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('[data-book-template]');
    if (!link || !shelf.contains(link)) return;
    const template = document.getElementById(link.dataset.bookTemplate);
    if (!(template instanceof HTMLTemplateElement) || !template.content.firstElementChild) return;
    content.replaceChildren(template.content.cloneNode(true));
    updateRegion(dialog);
    const title = content.querySelector('h2[id]');
    if (title) dialog.setAttribute('aria-labelledby',title.id);
    try {
      dialog.showModal();
    } catch {
      return;
    }
    event.preventDefault();
    opener = link;
    document.documentElement.classList.add('bookshelf-modal-open');
  });

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('bookshelf-modal-open');
    dialog.removeAttribute('aria-labelledby');
    content.replaceChildren();
    if (opener?.isConnected) opener.focus({preventScroll:true});
    opener = null;
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
    if (backdropPointerDown && event.target === dialog && outsideDialog(event)) dialog.close();
    backdropPointerDown = false;
  });
})();
