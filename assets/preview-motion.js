(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Map();
  const duration = 240;
  const supported = typeof HTMLElement.prototype.showPopover === 'function' && typeof Element.prototype.animate === 'function';
  const snapshot = image => {
    if (!image?.isConnected || !image.complete || !image.naturalWidth) return null;
    const r = image.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) return null;
    return {x:r.x,y:r.y,width:r.width,height:r.height,src:image.currentSrc || image.src};
  };
  const stop = dialog => {
    const state = active.get(dialog);
    if (!state) return;
    active.delete(dialog);
    cancelAnimationFrame(state.frame);
    state.animations.forEach(animation => animation.cancel());
    state.ghost?.remove();
    if (state.image) state.image.style.visibility = state.visibility;
    dialog.classList.remove('preview-departing');
  };
  const run = (dialog, from, to, image, closing) => {
    const state = {animations:[],frame:0,image,visibility:image?.style.visibility || ''};
    active.set(dialog,state);
    const finish = () => {
      if (active.get(dialog) !== state) return;
      stop(dialog);
      if (closing && dialog.open) dialog.close();
    };
    const options = {duration:closing ? 200 : duration,easing:'cubic-bezier(.2,.7,.25,1)',fill:'both'};
    try {
      if (from && to && supported && from.src === to.src) {
        const ghost = document.createElement('div');
        ghost.className = 'preview-flight';
        ghost.setAttribute('popover','manual');
        ghost.setAttribute('aria-hidden','true');
        ghost.inert = true;
        const picture = document.createElement('img');
        picture.src = from.src; picture.alt = '';
        ghost.append(picture);
        Object.assign(ghost.style,{left:`${to.x}px`,top:`${to.y}px`,width:`${to.width}px`,height:`${to.height}px`});
        document.body.append(ghost);
        state.ghost = ghost;
        ghost.showPopover();
        if (image) image.style.visibility = 'hidden';
        const transform = `translate(${from.x-to.x}px,${from.y-to.y}px) scale(${from.width/to.width},${from.height/to.height})`;
        state.animations.push(ghost.animate([{transform},{transform:'none'}],options));
      }
      if (closing) dialog.classList.add('preview-departing');
      state.animations.push(dialog.animate(closing ? [{opacity:1},{opacity:0}] : [{opacity:0},{opacity:1}],{...options,duration:closing ? 200 : 180}));
      Promise.all(state.animations.map(animation => animation.finished)).then(finish,finish);
    } catch { finish(); }
  };
  window.previewMotion = {
    open(dialog, thumbnail, image) {
      stop(dialog);
      if (reduce.matches || !supported) return;
      const from = snapshot(thumbnail);
      const pending = {animations:[],frame:0};
      active.set(dialog,pending);
      pending.frame = requestAnimationFrame(() => {
        if (active.get(dialog) !== pending || !dialog.open) return;
        run(dialog,from,snapshot(image),image,false);
      });
    },
    close(dialog, thumbnail, image) {
      stop(dialog);
      if (!dialog.open) return;
      if (reduce.matches || !supported) { dialog.close(); return; }
      run(dialog,snapshot(image),snapshot(thumbnail),image,true);
    },
    cancel:stop,
  };
  const finishAll = () => {
    for (const dialog of active.keys()) {
      const closing = dialog.classList.contains('preview-departing');
      stop(dialog);
      if (closing && dialog.open) dialog.close();
    }
  };
  window.addEventListener('resize',finishAll);
  reduce.addEventListener('change',finishAll);
})();
