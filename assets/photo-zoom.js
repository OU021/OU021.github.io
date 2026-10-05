(() => {
  window.createPhotoZoom = ({dialog,image,stage,button,status}) => {
    const label = button.querySelector('[data-zoom-label]');
    const pointers = new Map();
    let enabled = false, isZoomed = false, drag = null, refreshFrame = 0;
    let suppressClickUntil = 0;
    let labels = {};
    const browserZoomed = () => (window.visualViewport?.scale || 1) > 1.01;
    const suppressClick = () => { suppressClickUntil = performance.now() + 650; };
    const frame = () => {
      const rect = image.getBoundingClientRect();
      const scale = rect.width > 0 && rect.height > 0 && image.complete
        ? Math.min(2.5,image.naturalWidth / rect.width,image.naturalHeight / rect.height) : 1;
      return {rect,scale};
    };
    const updateButton = () => {
      const text = isZoomed ? labels.zoomOut : labels.zoomIn;
      label.textContent = text || '';
      button.setAttribute('aria-label',text || '');
      button.setAttribute('aria-pressed',String(isZoomed));
      button.hidden = !enabled || (!isZoomed && frame().scale <= 1.05);
      dialog.classList.toggle('can-photo-zoom',!button.hidden);
    };
    const refresh = () => {
      cancelAnimationFrame(refreshFrame);
      updateButton();
      // Opening a dialog gives its image dimensions on the next frame.
      refreshFrame = requestAnimationFrame(updateButton);
    };
    const releaseDrag = () => {
      if (!drag) return;
      const id = drag.id;
      drag = null;
      if (stage.hasPointerCapture?.(id)) stage.releasePointerCapture(id);
    };
    const reset = () => {
      releaseDrag();
      isZoomed = false;
      dialog.classList.remove('is-photo-zoomed');
      for (const name of ['--zoom-frame-width','--zoom-frame-height','--zoom-image-width','--zoom-image-height']) stage.style.removeProperty(name);
      stage.scrollLeft = stage.scrollTop = 0;
      stage.tabIndex = -1;
      status.textContent = '';
      updateButton();
    };
    const toggle = (point,focusStage = false) => {
      if (!enabled || !dialog.open || browserZoomed()) return;
      if (isZoomed) { reset(); return; }
      const {rect,scale} = frame();
      if (scale <= 1.05) return;
      window.previewMotion?.cancel(dialog);
      const x = point ? Math.max(0,Math.min(rect.width,point.x - rect.left)) : rect.width / 2;
      const y = point ? Math.max(0,Math.min(rect.height,point.y - rect.top)) : rect.height / 2;
      stage.style.setProperty('--zoom-frame-width',`${rect.width}px`);
      stage.style.setProperty('--zoom-frame-height',`${rect.height}px`);
      stage.style.setProperty('--zoom-image-width',`${rect.width * scale}px`);
      stage.style.setProperty('--zoom-image-height',`${rect.height * scale}px`);
      isZoomed = true;
      dialog.classList.add('is-photo-zoomed');
      stage.tabIndex = 0;
      stage.scrollLeft = x * (scale - 1);
      stage.scrollTop = y * (scale - 1);
      status.textContent = labels.zoomed || '';
      updateButton();
      if (focusStage) stage.focus({preventScroll:true});
    };
    button.addEventListener('click',() => toggle(null,true));
    image.draggable = false;
    image.addEventListener('dragstart',event => event.preventDefault());
    stage.addEventListener('click',event => {
      if (event.target !== image && event.target !== stage) return;
      if (performance.now() < suppressClickUntil) { event.preventDefault(); return; }
      toggle(event.detail ? {x:event.clientX,y:event.clientY} : null,event.detail === 0);
    });
    stage.addEventListener('pointerdown',event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if (pointers.size > 1 || !event.isPrimary) { suppressClick(); releaseDrag(); return; }
      if (!isZoomed || event.pointerType !== 'mouse' || browserZoomed()) return;
      drag = {id:event.pointerId,x:event.clientX,y:event.clientY,left:stage.scrollLeft,top:stage.scrollTop};
      stage.setPointerCapture(event.pointerId);
      stage.focus({preventScroll:true});
      event.preventDefault();
    });
    stage.addEventListener('pointermove',event => {
      const start = pointers.get(event.pointerId);
      if (start && Math.hypot(event.clientX-start.x,event.clientY-start.y) > 6) suppressClick();
      if (!drag || drag.id !== event.pointerId) return;
      stage.scrollLeft = drag.left - (event.clientX-drag.x);
      stage.scrollTop = drag.top - (event.clientY-drag.y);
      event.preventDefault();
    });
    stage.addEventListener('pointerup',event => {
      const start = pointers.get(event.pointerId);
      if (start && Math.hypot(event.clientX-start.x,event.clientY-start.y) > 6) suppressClick();
      pointers.delete(event.pointerId);
      if (drag?.id === event.pointerId) releaseDrag();
    });
    stage.addEventListener('pointercancel',event => {
      suppressClick();
      pointers.delete(event.pointerId);
      if (drag?.id === event.pointerId) releaseDrag();
    });
    stage.addEventListener('lostpointercapture',event => {
      // Unexpected capture loss must not turn a drag into a zoom click.
      if (drag?.id === event.pointerId) { suppressClick(); drag = null; pointers.delete(event.pointerId); }
    });
    dialog.addEventListener('pointerdown',event => {
      if (event.pointerType === 'touch' && !event.isPrimary) { suppressClick(); releaseDrag(); }
    },{passive:true});
    image.addEventListener('load',refresh);
    window.addEventListener('resize',() => { if (isZoomed) { suppressClick(); reset(); } refresh(); });
    return {
      get isZoomed() { return isZoomed; },
      update(options) {
        enabled = !!options.enabled;
        labels = options.labels;
        reset();
        if (enabled) stage.setAttribute('aria-label',labels.imageRegion);
        else stage.removeAttribute('aria-label');
        // Keep gesture suppression across photo navigation and language changes.
        refresh();
      },
      reset,
      refresh,
      handleKey(event) {
        if (!isZoomed || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return false;
        event.preventDefault();
        const distance = Math.max(40,Math.min(100,Math.min(stage.clientWidth,stage.clientHeight) * .18));
        if (event.key === 'ArrowLeft') stage.scrollLeft -= distance;
        if (event.key === 'ArrowRight') stage.scrollLeft += distance;
        if (event.key === 'ArrowUp') stage.scrollTop -= distance;
        if (event.key === 'ArrowDown') stage.scrollTop += distance;
        return true;
      },
    };
  };
})();
