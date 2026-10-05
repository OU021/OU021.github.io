import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/research-scene.js', import.meta.url), 'utf8');
const names = ['camera', 'photo', 'flower', 'baymax', 'hold', 'hold2'];
const blobs = Object.fromEntries(names.map(name => [name, readFileSync(new URL(`../assets/scene/${name}.bin`, import.meta.url))]));
const urls = Object.fromEntries(names.map(name => [name, `/assets/scene/${name}.bin?v=test`]));

// Every morph target must have the same point count. Corrupt or degenerate
// targets can otherwise produce a blank frame or jump when the shape changes.
for (const [name, blob] of Object.entries(blobs)) {
  assert.equal(blob.toString('ascii', 0, 4), 'ZOP1', `${name}: point format`);
  const count = blob.readUInt32LE(4);
  assert.equal(count, 16000, `${name}: corresponding point count`);
  assert.equal(blob.length, 8 + count * 9, `${name}: complete point records`);
  const coordinates = new Set(), axes = [new Set(), new Set(), new Set()];
  const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < count; i++) {
    const point = [];
    for (let axis = 0; axis < 3; axis++) {
      const integer = blob.readInt16LE(8 + i * 9 + axis * 2);
      const value = integer / 16384;
      assert(Math.abs(value) <= [1.05, .8, .95][axis], `${name}: point fits the scene`);
      low[axis] = Math.min(low[axis], value);
      high[axis] = Math.max(high[axis], value);
      axes[axis].add(integer);
      point.push(integer);
    }
    coordinates.add(point.join(','));
  }
  assert(coordinates.size > count * .95, `${name}: particles are not mostly duplicated`);
  for (const axis of [0, 1]) {
    assert(axes[axis].size > 1024, `${name}: sufficiently varied particle positions`);
    const sorted = [...axes[axis]].sort((a, b) => a - b);
    const spacings = new Set(sorted.slice(1).map((value, i) => value - sorted[i]));
    assert(spacings.size > 8, `${name}: positions are not on an evenly spaced lattice`);
  }
  assert(high[0] - low[0] > .5 && high[1] - low[1] > .5, `${name}: nondegenerate silhouette`);
  if (name !== 'photo') assert(high[2] - low[2] > .15, `${name}: three-dimensional geometry`);
}
assert.notDeepEqual(blobs.hold, blobs.hold2, 'Manipulation has two different poses');

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(callback);
    },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
    dispatch(type, event = {}) {
      for (const callback of listeners.get(type) || []) callback({type, preventDefault() {}, ...event});
    },
  };
}

function element() {
  const classes = new Set();
  return {
    ...eventTarget(), classes, dataset: {}, attrs: {}, hidden: false,
    style: {setProperty(key, value) { this[key] = value; }, removeProperty(key) { delete this[key]; }},
    setAttribute(key, value) { this.attrs[key] = String(value); },
    removeAttribute(key) { delete this.attrs[key]; },
    getAttribute(key) { return this.attrs[key] ?? null; },
    classList: {
      add(...values) { values.forEach(value => classes.add(value)); },
      remove(...values) { values.forEach(value => classes.delete(value)); },
      contains(value) { return classes.has(value); },
      toggle(value, force) {
        const enabled = force ?? !classes.has(value);
        if (enabled) classes.add(value); else classes.delete(value);
        return enabled;
      },
    },
  };
}

async function scene({reduced = false, badData = false, failedFetch = false, noWebGL = false, failedTexture = false} = {}) {
  const toggle = {...element(), hidden: true};
  const controls = {...element(), hidden: true};
  const chapters = ['camera','photo','flower','baymax','hold'].map(name => ({...element(), dataset:{sceneChapter:name}}));
  const notes = ['camera','photo','flower','baymax','hold'].map(name => ({...element(), dataset:{sceneNote:name}}));
  const photograph = {...element(), complete: true, naturalWidth: 1500, naturalHeight: 1000};
  const art = {...element(), querySelector: selector => selector === '.scene-photograph' ? photograph : selector === '.scene-controls' ? controls : toggle, querySelectorAll: selector => selector === '[data-scene-note]' ? notes : chapters};
  let drawings = 0, visibility, now = 0, nextId = 0;
  const drawCounts = [];
  const frames = new Map(), fetched = new Set();
  const gl = new Proxy({
    getShaderParameter: () => true, getProgramParameter: () => true,
    getAttribLocation: () => 0,
    texImage2D() { if (failedTexture) throw new Error("Photo texture unavailable"); },
    drawArrays(_mode, first, count) {
      assert.equal(first, 0);
      assert([16000,14550,6].includes(count), 'A full object or photograph plane is drawn');
      drawings++;drawCounts.push(count);
    },
  }, {get(object, key) {
    if (key in object) return object[key];
    if (/^[A-Z_]+$/.test(key)) return 1;
    if (/^uniform[1234][fi]$/.test(key)) return (_location, ...values) => values.forEach(value => assert(Number.isFinite(value), 'Finite shader value'));
    return () => ({});
  }});
  const canvas = {
    ...element(), dataset: {src: urls.camera, story: JSON.stringify(urls)},
    closest: () => art, getContext: () => noWebGL ? null : gl,
    getBoundingClientRect: () => ({width: 480, height: 340, left: 0, top: 0}),
  };
  const document = {...eventTarget(), hidden: false, querySelector: selector => selector === '.scene-photograph' ? photograph : canvas};
  const media = {...eventTarget(), matches: reduced};
  vm.runInNewContext(source, {
    document, window: {devicePixelRatio: 1, matchMedia: () => media},
    performance: {now: () => now}, DataView, Float32Array, Uint8Array, ArrayBuffer,
    fetch: async url => {
      assert(Object.values(urls).includes(url), 'Point data is self-hosted and configured');
      fetched.add(url);
      const name = names.find(value => urls[value] === url);
      const blob = blobs[name];
      return {ok: !failedFetch, arrayBuffer: async () => badData ? new ArrayBuffer(4) : blob.buffer.slice(blob.byteOffset, blob.byteOffset + blob.byteLength)};
    },
    requestAnimationFrame(callback) { frames.set(++nextId, callback); return nextId; },
    cancelAnimationFrame(id) { frames.delete(id); },
    ResizeObserver: class { observe() {} },
    IntersectionObserver: class { constructor(callback) { visibility = callback; } observe() {} },
  });
  await new Promise(resolve => setImmediate(resolve));
  return {
    toggle, controls, chapters, notes, photograph, media, document, canvas, frames, fetched, art,
    get drawings() { return drawings; },
    drawCounts,
    visible(value) { visibility([{isIntersecting: value}]); },
    advance(milliseconds, render = true) {
      // Normal browser frames, rather than one enormous time jump, exercise
      // active animation time while still allowing realistic suspension gaps.
      if (!render) { now += milliseconds; return; }
      for (let elapsed = 0; elapsed < milliseconds; elapsed += 40) {
        now += Math.min(40, milliseconds - elapsed);
        const pending = [...frames.values()];
        frames.clear();
        for (const callback of pending) callback(now);
        assert(frames.size <= 1, 'Only one animation frame is scheduled');
      }
    },
  };
}

const normal = await scene();
assert(normal.art.classes.has('scene-ready'), 'Animation replaces the still after loading');
assert.equal(normal.fetched.size, names.length, 'All original geometry targets load');
assert(normal.drawings > 0);
assert.equal(normal.frames.size, 1);
assert.equal(normal.canvas.dataset.phase, 'camera');
assert(!normal.controls.hidden, 'Chapter controls appear only with a working renderer');

const phases = [normal.canvas.dataset.phase];
for (let elapsed = 0; elapsed < 60000 && phases.length < 6; elapsed += 40) {
  normal.advance(40);
  assert.equal(normal.notes.find(note=>note.classes.has('is-active')).dataset.sceneNote,normal.canvas.dataset.phase,'Automatic playback keeps the explanation synchronized');
  if (normal.canvas.dataset.phase !== phases.at(-1)) phases.push(normal.canvas.dataset.phase);
}
assert.deepEqual(phases, ['camera', 'photo', 'flower', 'baymax', 'hold', 'camera'], 'Story completes its ordered loop');
normal.toggle.dispatch('click');
for (const chapter of normal.chapters) {
  chapter.dispatch('click');
  assert.equal(normal.canvas.dataset.phase,chapter.dataset.sceneChapter,'Selecting a chapter displays its recognizable form');
  assert.equal(chapter.attrs['aria-current'],'step');
  assert.equal(normal.notes.filter(note=>note.classes.has('is-active')).length,1,'Exactly one explanatory note is visible');
  assert.equal(normal.notes.find(note=>note.attrs['aria-hidden']==='false').dataset.sceneNote,chapter.dataset.sceneChapter,'The visible note matches the selected chapter');
  assert.equal(normal.chapters.filter(button => button.attrs['aria-current']).length,1,'Only one chapter is current');
  assert.equal(normal.frames.size,0,'Chapter selection preserves an explicit pause');
}
normal.toggle.dispatch('click');
normal.chapters[1].dispatch('click');
assert.equal(normal.frames.size,1,'Chapter selection during playback keeps a single running loop');
normal.advance(4500);
assert.equal(normal.canvas.dataset.phase,'flower','Replay continues naturally into the next chapter');

function assertSuspended(message, suspend, resume) {
  const phase = normal.canvas.dataset.phase, before = normal.drawings;
  suspend();
  assert.equal(normal.frames.size, 0, `${message}: no pending animation`);
  normal.advance(30000, false);
  assert.equal(normal.drawings, before, `${message}: no drawing while suspended`);
  resume();
  assert.equal(normal.frames.size, 1, `${message}: motion resumes`);
  normal.advance(40);
  assert.equal(normal.canvas.dataset.phase, phase, `${message}: resume does not skip through the story`);
}
assertSuspended('Pause button', () => {
  normal.toggle.dispatch('click');
  assert.equal(normal.toggle.attrs['aria-pressed'], 'true');
}, () => normal.toggle.dispatch('click'));
assertSuspended('Offscreen', () => normal.visible(false), () => normal.visible(true));
assertSuspended('Background tab', () => {
  normal.document.hidden = true; normal.document.dispatch('visibilitychange');
}, () => {
  normal.document.hidden = false; normal.document.dispatch('visibilitychange');
});

normal.canvas.dispatch('webglcontextlost');
assert.equal(normal.frames.size, 0);
assert(!normal.art.classes.has('scene-ready'), 'Lost graphics context restores the still');
assert(normal.toggle.hidden);
assert(normal.controls.hidden);
assert(normal.notes[0].classes.has('is-active'),'Graphics loss restores the camera explanation with the camera still');

const still = await scene({reduced: true});
assert(still.drawings > 0);
assert.equal(still.canvas.dataset.phase, 'camera');
assert.equal(still.frames.size, 0, 'Reduced motion starts with a static camera');
still.chapters[3].dispatch('click');
assert.equal(still.canvas.dataset.phase,'baymax','Reduced motion permits a static chapter selection');
assert(still.notes[3].classes.has('is-active'),'Reduced-motion readers can select each explanation');
assert.equal(still.frames.size,0,'Chapter navigation does not override reduced motion');
still.chapters[0].dispatch('click');
still.toggle.dispatch('click');
assert.equal(still.frames.size, 1, 'A deliberate play action can enable motion');
still.advance(10000);
assert.equal(still.canvas.dataset.phase, 'photo');
assert.equal(Number(still.photograph.style.opacity), 0, 'The photograph uses shared WebGL depth rather than a duplicate DOM overlay');
assert(still.drawCounts.includes(6),'A textured photograph is drawn during the photo chapter');
still.media.dispatch('change');
assert.equal(still.frames.size, 0);
assert.equal(still.canvas.dataset.phase, 'camera', 'Reduced-motion preference returns to the camera');
assert.equal(Number(still.photograph.style.opacity), 0, 'Reduced motion clears the photograph overlay');

const photoFallback=await scene({failedTexture:true,reduced:true});
photoFallback.chapters[1].dispatch('click');
assert(photoFallback.art.classes.has('scene-ready'),'Texture failure keeps the point-cloud story available');
assert.equal(photoFallback.canvas.dataset.phase,'photo');
assert.equal(photoFallback.drawCounts.at(-1),16000,'An unavailable texture falls back to the existing particle photograph');

for (const options of [{badData: true}, {failedFetch: true}, {noWebGL: true}]) {
  const fallback = await scene(options);
  assert(!fallback.art.classes.has('scene-ready'), 'Unavailable graphics/data preserves the still');
  assert(fallback.toggle.hidden);
  assert(fallback.controls.hidden);
  assert.equal(fallback.frames.size, 0);
}
// Choreography-level invariants catch discontinuities that valid rendering alone
// cannot: a flower must stay one object, and the catch must meet the same hands.
const choreo = source.slice(source.indexOf('  const catchPosition='),source.indexOf('  function bind('));
const poseAt = vm.runInNewContext(`const duration=42000; const clamp=x=>Math.max(0,Math.min(1,x)); const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6.-15.)+10.);}; const lerp=(a,b,t)=>a+(b-a)*t; const mix3=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t)); ${choreo}; poseAt`);
assert(poseAt(3650).press>.9,'The shutter visibly depresses before the turn');
assert.equal(poseAt(8000).cameraYaw,-Math.PI,'The camera turns all the way to its rear display');
assert(poseAt(8000).photo>0 && poseAt(8000).camera>0,'The photograph first appears on the rear of the camera');
assert(poseAt(11500).photoSize[0]>poseAt(8000).photoSize[0]*1.9,'The rear-screen photograph expands into the main scene');
assert(poseAt(17200).photo>0 && poseAt(17200).flower>0,'Flower emerges while its source photograph remains visible');
for(let t=17500;t<38800;t+=100)assert(poseAt(t).flower>.8,'Flower remains the same visible object through orbit and catch');
assert(poseAt(27800).robot===1 && poseAt(27800).flower===1,'The flower orbits an independently visible Baymax');
const orbitSamples=Array.from({length:60},(_,i)=>poseAt(25000+i*95).flowerOffset);
assert(orbitSamples.some(p=>p[2]<-.4)&&orbitSamples.some(p=>p[2]>.4),'The flower passes both behind and in front of Baymax');
for(const t of [11200,15500,19500,22500,25000,30800,33800,38800]){
 const a=poseAt(t-.1),b=poseAt(t+.1);
 for(const key of ['camera','photo','flower','robot'])assert(Math.abs(a[key]-b[key])<.002,`${key} remains continuous at ${t}`);
 if(Math.max(a.flower,b.flower)>.01){
   assert(Math.abs(a.flowerScale-b.flowerScale)<.002,`Flower scale remains continuous at ${t}`);
   for(let i=0;i<3;i++)assert(Math.abs(a.flowerOffset[i]-b.flowerOffset[i])<.002,`Flower position remains continuous at ${t}`);
 }
 if(Math.max(a.robot,b.robot)>.01)assert(Math.abs(a.robotPose-b.robotPose)<.002,`Arms remain continuous at ${t}`);
}
const aligned=[];
for(let i=0;i<16000;i++)if(blobs.baymax.subarray(14+i*9,17+i*9).equals(blobs.hold.subarray(14+i*9,17+i*9)))aligned.push(i);
assert.equal(aligned.length,14550,'All embedded flower particles are excluded from the articulated robot');
console.log('Passed: six point targets, independent object choreography, shutter/rear screen, flower emergence/orbit/catch continuity, chapter replay, pause/resume, suspension, reduced motion, and fallback.');
