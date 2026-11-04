(() => {
  const dialog = document.querySelector('.citation-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const heading = dialog.querySelector('[data-citation-heading]');
  const field = dialog.querySelector('[data-citation-text]');
  const copy = dialog.querySelector('[data-copy-citation]');
  const status = dialog.querySelector('[data-citation-status]');
  const download = dialog.querySelector('[data-citation-download]');
  let trigger = null;
  let revision = 0;

  document.querySelectorAll('[data-citation]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const template = document.getElementById(link.dataset.citation);
      if (!template) return;
      event.preventDefault();
      revision++;
      trigger = link;
      heading.textContent = link.dataset.citationTitle;
      field.value = template.content.textContent.trim();
      download.href = link.href;
      status.textContent = '';
      copy.textContent = 'Copy BibTeX';
      copy.disabled = false;
      dialog.showModal();
      document.body.classList.add('modal-open');
    });
  });

  copy.addEventListener('click', async () => {
    const current = revision;
    copy.disabled = true;
    try {
      await navigator.clipboard.writeText(field.value);
      if (current !== revision || !dialog.open) return;
      copy.textContent = 'Copied';
      status.textContent = 'Citation copied.';
    } catch {
      if (current !== revision || !dialog.open) return;
      field.focus();
      field.select();
      status.textContent = 'Select and copy the citation, or download the BibTeX file.';
    } finally {
      if (current === revision) copy.disabled = false;
    }
  });
  dialog.querySelector('[data-citation-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    revision++;
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal-open');
    trigger?.focus({preventScroll: true});
  });
})();
