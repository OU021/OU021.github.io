// Original particle choreography; asset provenance is documented in assets/scene/README.md.
(() => {
  const canvas=document.querySelector('#point-field');
  if(!canvas)return;
  const art=canvas.closest('.hero-art');
  const toggle=art.querySelector('.motion-toggle');
  const photograph=art.querySelector('.scene-photograph');
  const photoOpacity=.82;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  let gl;
  try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});}catch{return;}
  if(!gl)return;
  const vertex=`
    attribute vec3 position, destination, color, nextColor;
    attribute float seed;
    uniform vec2 angle, scale;
    uniform float progress, scatter, dotSize, opacity;
    varying vec3 ink;
    varying float alpha;
    void main(){
      float m=smoothstep(seed*.10,.90+seed*.10,progress);
      vec3 p=mix(position,destination,m);
      vec3 drift=vec3(sin(seed*143.7),cos(seed*87.3),sin(seed*231.1));
      p+=drift*sin(m*3.14159265)*scatter*.065;
      float c=cos(angle.x),s=sin(angle.x);
      p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
      c=cos(angle.y);s=sin(angle.y);
      p=vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);
      gl_Position=vec4(p.xy*scale,-p.z*.55,1.);
      gl_PointSize=dotSize*mix(.66,1.36,seed);
      ink=mix(color,nextColor,m);
      ink=mix(ink,vec3(.969,.957,.933),clamp((.25-p.z)*.10,0.,.17));
      alpha=opacity*mix(.70,1.,seed);
    }`;
  const fragment=`
    precision mediump float;
    varying vec3 ink;
    varying float alpha;
    uniform highp float opacity;
    void main(){
      float d=length(gl_PointCoord-.5);
      if(d>.5)discard;
      float coverage=1.-smoothstep(.25,.5,d);
      if(coverage<.35)discard;
      // Dense dark details need solid coverage: transparent edges otherwise
      // write depth and hide nearby eye particles before their centers draw.
      float detail=1.-smoothstep(.18,.32,max(max(ink.r,ink.g),ink.b));
      gl_FragColor=vec4(ink,mix(alpha*coverage,opacity,detail));
    }`;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6.-15.)+10.);};
  let program,locations,states,count=0,frame=0,time=0,previous=null,visible=true,paused=media.matches;
  let width=0,height=0,dpr=1,mouseX=0,mouseY=0,targetX=0,targetY=0,pair='';
  // Local previews can freeze a chapter for visual QA; public pages always loop.
  if(typeof location!=='undefined'&&/^(localhost|127\.0\.0\.1)$/.test(location.hostname)){
    const chapter=new URLSearchParams(location.search).get('scene');
    const samples={camera:2000,photo:10000,flower:18300,baymax:25800,hold:32750,hold2:34300};
    if(Object.hasOwn(samples,chapter)){time=samples[chapter];paused=true;}
  }
  function shader(type,source){
    const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Shader unavailable');
    return s;
  }
  // Each form is held long enough to read. Transitions share point identities;
  // the two final poses articulate the arms and flower instead of replacing them.
  function poseAt(elapsed){
    const t=elapsed%42000;
    let from='camera',to='camera',m=0,phase='camera',yaw=0,pitch=0,photo=0,scatter=0;
    if(t<5200){yaw=-.09+.18*ease(t/5200);pitch=Math.sin(t/5200*Math.PI)*.022;}
    else if(t<8600){from='camera';to='photo';m=ease((t-5200)/3400);phase='photo';yaw=.09*(1-m)+.30*Math.sin(m*Math.PI);scatter=1;photo=ease((t-8100)/1100);}
    else if(t<12600){from=to='photo';phase='photo';photo=ease((t-8100)/1100)*(1-ease((t-11700)/900));}
    else if(t<16200){from='photo';to='flower';m=ease((t-12600)/3600);phase='flower';yaw=-.14*m;scatter=.7;}
    else if(t<20400){from=to='flower';phase='flower';yaw=-.14+.34*ease((t-16200)/4200);pitch=.025*Math.sin((t-16200)/4200*Math.PI);}
    else if(t<23800){from='flower';to='baymax';m=ease((t-20400)/3400);phase='baymax';yaw=.20*(1-m)-.13*m;scatter=.75;}
    else if(t<28600){from=to='baymax';phase='baymax';yaw=-.13+.29*ease((t-23800)/4800);}
    else if(t<31200){from='baymax';to='hold';m=ease((t-28600)/2600);phase='hold';yaw=.16*(1-m);}
    else if(t<37400){from='hold';to='hold2';m=(1-Math.cos((t-31200)/6200*Math.PI*4))/2;phase='hold';yaw=Math.sin((t-31200)/6200*Math.PI*2)*.07;}
    else{from='hold';to='camera';m=ease((t-37400)/4600);phase='camera';yaw=-.09*m+.20*Math.sin(m*Math.PI);scatter=.8;}
    return {from,to,m,phase,yaw,pitch,photo,scatter};
  }
  function bind(name,buffer){
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(locations[name]);gl.vertexAttribPointer(locations[name],3,gl.FLOAT,false,0,0);
  }
  function draw(){
    if(!count||!width||!height)return;
    const pose=poseAt(time),key=pose.from+'/'+pose.to;
    if(key!==pair){
      bind('position',states[pose.from].position);bind('destination',states[pose.to].position);
      bind('color',states[pose.from].color);bind('nextColor',states[pose.to].color);pair=key;
    }
    if(canvas.dataset.phase!==pose.phase)canvas.dataset.phase=pose.phase;
    const photoVisible=photograph&&photograph.complete&&photograph.naturalWidth>0?pose.photo:0;
    const fit=Math.min(width/2.14,height/1.65);
    gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform2f(locations.angle,pose.yaw+mouseX*(1-pose.photo),pose.pitch+mouseY*(1-pose.photo));
    gl.uniform2f(locations.scale,fit*2/width,fit*2/height);
    gl.uniform1f(locations.progress,pose.m);gl.uniform1f(locations.scatter,pose.scatter);
    gl.uniform1f(locations.dotSize,Math.max(1.35,Math.min(2.05,width/245))*dpr);
    gl.uniform1f(locations.opacity,1-photoVisible);
    gl.drawArrays(gl.POINTS,0,count);
    if(photograph){
      photograph.style.opacity=String(photoVisible*photoOpacity);
      photograph.style.width=`${fit*1.86}px`;
      photograph.style.height=`${fit*1.24}px`;
      photograph.style.transform=`translate(-50%,-50%) scale(${1+photoVisible*.008})`;
    }
  }
  function resize(){
    const r=canvas.getBoundingClientRect();width=r.width;height=r.height;dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);draw();
  }
  function tick(now){
    frame=0;
    if(previous!==null&&now-previous<32){frame=requestAnimationFrame(tick);return;}
    time+=previous===null?0:Math.min(now-previous,80);previous=now;
    mouseX+=(targetX-mouseX)*.04;mouseY+=(targetY-mouseY)*.04;draw();frame=requestAnimationFrame(tick);
  }
  function sync(){
    cancelAnimationFrame(frame);frame=0;previous=null;
    toggle.setAttribute('aria-pressed',String(paused));
    toggle.setAttribute('aria-label',paused?'Play point cloud motion':'Pause point cloud motion');
    toggle.innerHTML=paused?'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m8 4 12 8-12 8z"/></svg>':'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 5v14M15 5v14"/></svg>';
    if(!paused&&visible&&!document.hidden&&count)frame=requestAnimationFrame(tick);
  }
  function buffer(values){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,values,gl.STATIC_DRAW);return b;}
  async function load(url){
    const response=await fetch(url);if(!response.ok)throw new Error('Point data unavailable');
    const raw=await response.arrayBuffer(),view=new DataView(raw);
    if(raw.byteLength<8||view.getUint32(0,false)!==0x5a4f5031)throw new Error('Invalid point data');
    const n=view.getUint32(4,true);
    if(!n||n>50000||raw.byteLength!==8+n*9)throw new Error('Invalid point count');
    const position=new Float32Array(n*3),color=new Float32Array(n*3);
    for(let i=0;i<n;i++)for(let k=0;k<3;k++){
      position[i*3+k]=view.getInt16(8+i*9+k*2,true)/16384;
      color[i*3+k]=view.getUint8(14+i*9+k)/255;
    }
    return {n,position,color};
  }
  async function init(){
    try{
      const sources=JSON.parse(canvas.dataset.story||'{}');
      const names=['camera','photo','flower','baymax','hold','hold2'];
      const data=await Promise.all(names.map(name=>load(sources[name]||(name==='camera'?canvas.dataset.src:''))));
      if(!data.every(d=>d.n===data[0].n))throw new Error('Mismatched point counts');
      program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Renderer unavailable');gl.useProgram(program);
      locations={};
      for(const name of ['position','destination','color','nextColor','seed'])locations[name]=gl.getAttribLocation(program,name);
      for(const name of ['angle','scale','progress','scatter','dotSize','opacity'])locations[name]=gl.getUniformLocation(program,name);
      states=Object.fromEntries(names.map((name,i)=>[name,{position:buffer(data[i].position),color:buffer(data[i].color)}]));
      const seeds=new Float32Array(data[0].n);for(let i=0;i<seeds.length;i++){const x=Math.sin(i*127.1+311.7)*43758.5453;seeds[i]=x-Math.floor(x);}
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer(seeds));gl.enableVertexAttribArray(locations.seed);gl.vertexAttribPointer(locations.seed,1,gl.FLOAT,false,0,0);
      gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
      count=data[0].n;resize();art.classList.add('scene-ready');toggle.hidden=false;sync();
      new ResizeObserver(resize).observe(canvas);
      new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05}).observe(canvas);
      toggle.addEventListener('click',()=>{paused=!paused;sync();});
      document.addEventListener('visibilitychange',sync);
      if(photograph)photograph.addEventListener('load',draw);
      media.addEventListener('change',()=>{paused=media.matches;if(paused){time=0;mouseX=mouseY=targetX=targetY=0;draw();}sync();});
      canvas.addEventListener('pointermove',e=>{if(paused||e.pointerType==='touch')return;const r=canvas.getBoundingClientRect();targetX=((e.clientX-r.left)/r.width-.5)*.05;targetY=((e.clientY-r.top)/r.height-.5)*.025;});
      canvas.addEventListener('pointerleave',()=>{targetX=targetY=0;});
      canvas.addEventListener('webglcontextlost',()=>{count=0;sync();art.classList.remove('scene-ready');toggle.hidden=true;if(photograph)photograph.style.opacity='0';});
    }catch{art.classList.remove('scene-ready');toggle.hidden=true;}
  }
  init();
})();
