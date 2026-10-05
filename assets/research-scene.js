// Original particle choreography; asset provenance is documented in assets/scene/README.md.
(() => {
  const canvas=document.querySelector('#point-field');
  if(!canvas)return;
  const art=canvas.closest('.hero-art'),toggle=art.querySelector('.motion-toggle');
  const controls=art.querySelector('.scene-controls');
  const chapters=[...art.querySelectorAll('[data-scene-chapter]')];
  const notes=[...art.querySelectorAll('[data-scene-note]')];
  const photograph=art.querySelector('.scene-photograph');
  function showNote(phase){notes.forEach(note=>{const active=note.dataset.sceneNote===phase;note.classList.toggle('is-active',active);note.setAttribute('aria-hidden',String(!active));});}
  const duration=42000,chapterTimes={camera:0,photo:11500,flower:20500,baymax:26800,hold:35000};
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6.-15.)+10.);};
  const lerp=(a,b,t)=>a+(b-a)*t;
  const mix3=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
  let gl;try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});}catch{return;}
  if(!gl)return;
  // All objects share one projection and depth buffer. The photograph is a
  // texture in that same scene, so the emerging flower can sit in front of it.
  const transform=`
    uniform vec2 angle, scale;
    uniform vec3 offset;
    uniform float objectScale, roll;
    vec3 place(vec3 p){
      p*=objectScale;
      float c=cos(roll),s=sin(roll);p=vec3(c*p.x-s*p.y,s*p.x+c*p.y,p.z);
      c=cos(angle.x);s=sin(angle.x);p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
      c=cos(angle.y);s=sin(angle.y);p=vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);
      return p+offset;
    }`;
  const vertex=`
    attribute vec3 position, destination, color, nextColor;
    attribute float seed;
    uniform float progress, dotSize, opacity, shutterPress, aperture, rearView;
    varying vec3 ink;varying float alpha, visibility;
    ${transform}
    void main(){
      vec3 p=mix(position,destination,progress);
      // Only the top shutter cap depresses. The body, lens and rear screen
      // retain their identity through the turn rather than morphing to a photo.
      if(shutterPress>0. && p.x>.54 && p.x<.73 && p.y>.50 && p.z<.15) p.y-=shutterPress*.035;
      vec3 world=place(p);gl_Position=vec4(world.xy*scale,-world.z*.55,1.);
      gl_PointSize=dotSize*mix(.66,1.36,seed);
      ink=mix(color,nextColor,progress);
      if(aperture>0. && p.z>.62 && length(p.xy-vec2(.0104,-.0676))<.28) ink*=1.-aperture*.65;
      ink=mix(ink,vec3(.969,.957,.933),clamp((.25-world.z)*.10,0.,.17));
      visibility=opacity*(1.-rearView*step(-.16,p.z));alpha=visibility*mix(.70,1.,seed);
    }`;
  const fragment=`
    precision mediump float;
    varying vec3 ink;varying float alpha, visibility;
    uniform highp float opacity;
    void main(){
      if(alpha<.008)discard;
      float d=length(gl_PointCoord-.5);if(d>.5)discard;
      float coverage=1.-smoothstep(.25,.5,d);if(coverage<.35)discard;
      float detail=1.-smoothstep(.18,.32,max(max(ink.r,ink.g),ink.b));
      gl_FragColor=vec4(ink,mix(alpha*coverage,visibility,detail));
    }`;
  const photoVertex=`
    attribute vec3 position;attribute vec2 uv;
    uniform vec2 size;varying vec2 textureUV;
    ${transform}
    void main(){vec3 p=place(vec3(position.xy*size,0.));gl_Position=vec4(p.xy*scale,-p.z*.55,1.);textureUV=uv;}`;
  const photoFragment=`
    precision mediump float;varying vec2 textureUV;
    uniform sampler2D image;uniform float opacity;
    void main(){if(opacity<.008)discard;vec4 pixel=texture2D(image,textureUV);gl_FragColor=vec4(mix(pixel.rgb,vec3(.969,.957,.933),.18),opacity);}`;
  let pointProgram,photoProgram,locations,photoLocations,states,count=0,frame=0,time=0,previous=null,visible=true,paused=media.matches;
  let width=0,height=0,dpr=1,mouseX=0,mouseY=0,targetX=0,targetY=0,texture,textureReady=false,quad,uvBuffer;
  // Local review links freeze meaningful actions. Public pages always loop.
  if(typeof location!=='undefined'&&/^(localhost|127\.0\.0\.1)$/.test(location.hostname)){
    const sample=new URLSearchParams(location.search).get('scene');
    const samples={camera:1800,shutter:3650,rear:8000,photo:11500,emerge:17600,flower:20500,orbit:27800,baymax:26800,catch:32800,hold:35000,hold2:36900};
    if(Object.hasOwn(samples,sample)){time=samples[sample];paused=true;}
  }
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Shader unavailable');return s;}
  function program(v,f){const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,v));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('Renderer unavailable');return p;}
  const catchPosition=[.0446,-.0543,.4539],catchPosition2=[.0446,-.0183,.4548];
  // The flower is one persistent object from its source in the photograph to
  // the final embrace. Only the character's arms/head interpolate pose targets.
  function poseAt(elapsed){
    const t=elapsed%duration;
    const p={phase:'camera',camera:0,cameraYaw:-.38,cameraPitch:.17,press:0,photo:0,photoSize:[1.86,1.24],photoOffset:[0,0,.28],flower:0,flowerScale:.83,flowerOffset:[0,0,.24],flowerYaw:0,flowerPitch:0,flowerRoll:0,robot:0,robotPose:0,holdPose:0};
    if(t<11200){
      p.camera=1-ease((t-9000)/1700);
      p.press=Math.sin(Math.PI*clamp((t-3200)/1000));
      const turn=ease((t-4200)/3100);p.cameraYaw=lerp(-.38,-Math.PI,turn);p.cameraPitch=.17*(1-turn);
      const expand=ease((t-8700)/2500);
      p.photo=ease((t-7400)/1000);
      p.photoSize=[lerp(.8944,1.86,expand),lerp(.5967,1.24,expand)];
      p.photoOffset=mix3([.1248,-.0572,.28],[0,0,.28],expand);
      if(t>=7300)p.phase='photo';
    }else if(t<15500){p.phase='photo';p.photo=1;}
    else if(t<22500){
      p.phase='flower';const emerge=ease((t-15500)/4000);
      p.photo=1-ease((t-16400)/3100);p.flower=ease((t-15500)/2000);
      p.flowerScale=lerp(.47,.83,emerge);p.flowerOffset=mix3([-.13,-.05,.30],[0,0,.34],emerge);
      p.flowerYaw=lerp(-.05,.12,emerge);p.flowerPitch=lerp(-.12,.03,emerge);
    }else if(t<25000){
      p.phase='baymax';const arrive=ease((t-22500)/2500);p.robot=arrive;p.flower=1;
      p.flowerScale=lerp(.83,.36,arrive);p.flowerOffset=mix3([0,0,.34],[-.66,.13,0],arrive);p.flowerYaw=.12*(1-arrive);
    }else if(t<30800){
      p.phase='baymax';p.robot=p.flower=1;p.flowerScale=.36;
      const a=Math.PI+2*Math.PI*ease((t-25000)/5800);
      p.flowerOffset=[.66*Math.cos(a),.13+.24*Math.sin(a),.48*Math.sin(a)];
      p.flowerRoll=.15*Math.sin(a);p.flowerYaw=-.20*Math.sin(a);
    }else if(t<33800){
      p.phase='hold';p.robot=p.flower=1;const receive=ease((t-30800)/3000);p.robotPose=receive;
      p.flowerScale=lerp(.36,.29,receive);p.flowerOffset=mix3([-.66,.13,0],catchPosition,receive);
      p.flowerOffset[1]+=.10*Math.sin(Math.PI*receive);p.flowerYaw=.05*receive;
    }else if(t<38800){
      p.phase='hold';p.robot=p.flower=p.robotPose=1;
      const breathe=(1-Math.cos((t-33800)/5000*Math.PI*2))/2;p.holdPose=breathe;
      p.flowerScale=.29;p.flowerOffset=mix3(catchPosition,catchPosition2,breathe);p.flowerYaw=lerp(.05,-.05,breathe);p.flowerPitch=.07*breathe;
    }else{
      p.phase='camera';p.robot=p.flower=1-ease((t-38800)/2000);p.robotPose=1;
      p.flowerScale=.29;p.flowerOffset=catchPosition;p.flowerYaw=.05;
      p.camera=ease((t-39800)/2200);
    }
    return p;
  }
  function bind(name,buffer,loc=locations,size=3){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(loc[name]);gl.vertexAttribPointer(loc[name],size,gl.FLOAT,false,0,0);}
  function place(loc,fit,{yaw=0,pitch=0,roll=0,size=1,offset=[0,0,0]}={}){
    gl.uniform2f(loc.angle,yaw,pitch);gl.uniform2f(loc.scale,fit*2/width,fit*2/height);gl.uniform3f(loc.offset,...offset);gl.uniform1f(loc.objectScale,size);gl.uniform1f(loc.roll,roll);
  }
  function drawPoints(from,to,progress,opacity,fit,placement={},press=0){
    if(opacity<.008)return;
    gl.useProgram(pointProgram);const a=states[from],b=states[to];
    bind('position',a.position);bind('destination',b.position);bind('color',a.color);bind('nextColor',b.color);bind('seed',a.seeds,locations,1);
    place(locations,fit,placement);gl.uniform1f(locations.progress,progress);gl.uniform1f(locations.dotSize,Math.max(1.35,Math.min(2.05,width/245))*dpr*(from==='flower'?Math.max(.67,Math.sqrt(placement.size||1)):1));
    gl.uniform1f(locations.opacity,opacity);gl.uniform1f(locations.shutterPress,press);gl.uniform1f(locations.aperture,press);gl.uniform1f(locations.rearView,from==='camera'?ease((-Math.cos(placement.yaw)-.30)/.45):0);
    gl.drawArrays(gl.POINTS,0,a.n);
  }
  function drawPhoto(p,fit){
    if(p.photo<.008)return;
    if(!textureReady){drawPoints('photo','photo',0,p.photo*.82,fit,{size:p.photoSize[0]/1.86,offset:p.photoOffset});return;}
    gl.useProgram(photoProgram);bind('position',quad,photoLocations);bind('uv',uvBuffer,photoLocations,2);place(photoLocations,fit,{offset:p.photoOffset});
    gl.uniform2f(photoLocations.size,...p.photoSize);gl.uniform1f(photoLocations.opacity,p.photo);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(photoLocations.image,0);gl.drawArrays(gl.TRIANGLES,0,6);
  }
  function draw(){
    if(!count||!width||!height)return;
    const p=poseAt(time),t=time%duration;
    if(canvas.dataset.phase!==p.phase){canvas.dataset.phase=p.phase;showNote(p.phase);}
    const ranges={camera:t<7300?[0,7300]:[38800,42000],photo:[7300,15500],flower:[15500,22500],baymax:[22500,30800],hold:[30800,38800]};
    const [start,end]=ranges[p.phase];
    chapters.forEach(button=>{const active=button.dataset.sceneChapter===p.phase;if(active)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');button.style.setProperty('--chapter-progress',active?String(clamp((t-start)/(end-start))):'0');});
    const fit=Math.min(width/2.14,height/1.65);
    gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    // Camera first, then photograph, then independently moving characters.
    drawPoints('camera','camera',0,p.camera,fit,{yaw:p.cameraYaw+mouseX*(1-p.photo),pitch:p.cameraPitch+mouseY*(1-p.photo)},p.press);
    drawPhoto(p,fit);
    if(p.robotPose<1)drawPoints('robot','receive',p.robotPose,p.robot,fit);
    else drawPoints('receive','hold',p.holdPose,p.robot,fit);
    drawPoints('flower','flower',0,p.flower,fit,{yaw:p.flowerYaw,pitch:p.flowerPitch,roll:p.flowerRoll,size:p.flowerScale,offset:p.flowerOffset});
    if(photograph)photograph.style.opacity='0';
  }
  function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);draw();}
  function tick(now){frame=0;if(previous!==null&&now-previous<32){frame=requestAnimationFrame(tick);return;}time+=previous===null?0:Math.min(now-previous,80);previous=now;mouseX+=(targetX-mouseX)*.04;mouseY+=(targetY-mouseY)*.04;draw();frame=requestAnimationFrame(tick);}
  function sync(){
    cancelAnimationFrame(frame);frame=0;previous=null;toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?'Play point cloud motion':'Pause point cloud motion');
    toggle.innerHTML=paused?'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m8 4 12 8-12 8z"/></svg>':'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 5v14M15 5v14"/></svg>';
    if(!paused&&visible&&!document.hidden&&count)frame=requestAnimationFrame(tick);
  }
  function buffer(values){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,values,gl.STATIC_DRAW);return b;}
  async function load(url){
    const response=await fetch(url);if(!response.ok)throw new Error('Point data unavailable');const raw=await response.arrayBuffer(),view=new DataView(raw);
    if(raw.byteLength<8||view.getUint32(0,false)!==0x5a4f5031)throw new Error('Invalid point data');
    const n=view.getUint32(4,true);if(!n||n>50000||raw.byteLength!==8+n*9)throw new Error('Invalid point count');
    const position=new Float32Array(n*3),color=new Float32Array(n*3);
    for(let i=0;i<n;i++)for(let k=0;k<3;k++){position[i*3+k]=view.getInt16(8+i*9+k*2,true)/16384;color[i*3+k]=view.getUint8(14+i*9+k)/255;}
    return {n,position,color};
  }
  function upload(d){const seeds=new Float32Array(d.n);for(let i=0;i<seeds.length;i++){const x=Math.sin(i*127.1+311.7)*43758.5453;seeds[i]=x-Math.floor(x);}return {n:d.n,position:buffer(d.position),color:buffer(d.color),seeds:buffer(seeds)};}
  function robotOnly(data,indices){return {n:indices.length,position:new Float32Array(indices.flatMap(i=>Array.from(data.position.subarray(i*3,i*3+3)))),color:new Float32Array(indices.flatMap(i=>Array.from(data.color.subarray(i*3,i*3+3))))};}
  function loadPhotograph(){
    if(!photograph||!photograph.complete||!photograph.naturalWidth)return;
    try{gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,photograph);textureReady=true;draw();}catch{textureReady=false;}
  }
  async function init(){
    try{
      const sources=JSON.parse(canvas.dataset.story||'{}'),names=['camera','photo','flower','baymax','hold','hold2'];
      const data=await Promise.all(names.map(name=>load(sources[name]||(name==='camera'?canvas.dataset.src:''))));
      if(!data.every(d=>d.n===data[0].n))throw new Error('Mismatched point counts');
      // The 1,450 flower particles in old holding targets must not reappear:
      // retain the exact remaining point identities across all three poses.
      const robotIndices=[];for(let i=0;i<data[3].n;i++){const k=i*3;if(data[3].color[k]===data[4].color[k]&&data[3].color[k+1]===data[4].color[k+1]&&data[3].color[k+2]===data[4].color[k+2])robotIndices.push(i);}
      if(robotIndices.length!==14550)throw new Error('Invalid character parts');
      pointProgram=program(vertex,fragment);photoProgram=program(photoVertex,photoFragment);
      function locate(p,attributes,uniforms){const result={};attributes.forEach(n=>result[n]=gl.getAttribLocation(p,n));uniforms.forEach(n=>result[n]=gl.getUniformLocation(p,n));return result;}
      const common=['angle','scale','offset','objectScale','roll'];
      locations=locate(pointProgram,['position','destination','color','nextColor','seed'],[...common,'progress','dotSize','opacity','shutterPress','aperture','rearView']);
      photoLocations=locate(photoProgram,['position','uv'],[...common,'size','opacity','image']);
      states={camera:upload(data[0]),photo:upload(data[1]),flower:upload(data[2]),robot:upload(robotOnly(data[3],robotIndices)),receive:upload(robotOnly(data[4],robotIndices)),hold:upload(robotOnly(data[5],robotIndices))};
      quad=buffer(new Float32Array([-.5,-.5,0,.5,-.5,0,-.5,.5,0,-.5,.5,0,.5,-.5,0,.5,.5,0]));uvBuffer=buffer(new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]));
      texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
      count=data[0].n;loadPhotograph();resize();art.classList.add('scene-ready');toggle.hidden=false;if(controls)controls.hidden=false;sync();
      new ResizeObserver(resize).observe(canvas);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05}).observe(canvas);
      toggle.addEventListener('click',()=>{paused=!paused;sync();});
      chapters.forEach(button=>button.addEventListener('click',()=>{const target=chapterTimes[button.dataset.sceneChapter];if(!Number.isFinite(target))return;time=target;mouseX=mouseY=targetX=targetY=0;draw();sync();}));
      document.addEventListener('visibilitychange',sync);if(photograph)photograph.addEventListener('load',loadPhotograph);
      media.addEventListener('change',()=>{paused=media.matches;if(paused){time=0;mouseX=mouseY=targetX=targetY=0;draw();}sync();});
      canvas.addEventListener('pointermove',e=>{if(paused||e.pointerType==='touch')return;const r=canvas.getBoundingClientRect();targetX=((e.clientX-r.left)/r.width-.5)*.05;targetY=((e.clientY-r.top)/r.height-.5)*.025;});
      canvas.addEventListener('pointerleave',()=>{targetX=targetY=0;});
      canvas.addEventListener('webglcontextlost',()=>{count=0;sync();art.classList.remove('scene-ready');showNote('camera');toggle.hidden=true;if(controls)controls.hidden=true;if(photograph)photograph.style.opacity='0';});
    }catch{art.classList.remove('scene-ready');showNote('camera');toggle.hidden=true;if(controls)controls.hidden=true;}
  }
  init();
})();
