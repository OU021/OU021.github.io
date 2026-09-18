import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderBookshelf, renderBookPreviews} from './bookshelf.mjs';
import {renderPhotography, photoAttributes, photoLanguageToggle, photoStamp} from './photography.mjs';
const root = new URL('../', import.meta.url);
const d = JSON.parse(readFileSync(new URL('data/site.json', root)));
const books = JSON.parse(readFileSync(new URL('data/books.json', root)));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link = (url, label) => `<a href="${esc(url)}">${esc(label)}</a>`;
const revision = name => createHash('sha256').update(readFileSync(new URL(`assets/${name}`,root))).digest('hex').slice(0,8);
books.sort((a,b)=>a.en.author.localeCompare(b.en.author,'en',{sensitivity:'base'}));
for (const book of books) book.cover.version = revision(book.cover.src.replace(/^assets\//,''));
const shapes = {
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',
  papers: '<path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h5"/>',
  book: '<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1ZM12 5v15"/>',
  camera: '<path d="M3 7h5l2-3h4l2 3h5v14H3z"/><circle cx="12" cy="14" r="4"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  play: '<path d="m8 4 12 8-12 8z"/>',
  cap: '<path d="m2 8 10-5 10 5-10 5zM6 10v7q6 6 12 0v-7M22 8v8"/>',
  work: '<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V3h8v4M3 12a20 20 0 0 0 18 0"/>',
  award: '<circle cx="12" cy="8" r="5"/><path d="m8 12-2 9 6-3 6 3-2-9"/>'
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name]||shapes.arrow}</svg>`;
const githubMark = readFileSync(new URL('assets/github.svg',root),'utf8').replace('role="img"','class="icon" aria-hidden="true"').replace('<title>GitHub</title>','').replace('<path ','<path fill="currentColor" ');
const linkedInMark = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="4.7" r="2.1" fill="currentColor"/><path fill="currentColor" d="M3.2 8.5h3.6V21H3.2zM10 8.5h3.5v1.8c.9-1.4 2.2-2.1 3.8-2.1 3.1 0 4.5 2 4.5 5.4V21h-3.6v-6.5c0-1.9-.6-3-2-3-1.6 0-2.6 1.2-2.6 3.1V21H10z"/></svg>';
const baymaxMark = readFileSync(new URL('assets/baymax-camera.svg',root),'utf8').replace('<svg ', '<svg class="brand-mark" width="48" height="48" aria-hidden="true" focusable="false" ');
const withLabLink = text => esc(text).replace('PLAN Lab',link(d.researchLinks.planLab,'PLAN Lab'));
const aboutText = text => withLabLink(text)
 .replace(esc(d.affiliation),`<strong>${esc(d.affiliation)}</strong>`)
 .replace('Dalian University of Technology','<strong>Dalian University of Technology</strong>')
 .replace('at UIUC','at <strong>UIUC</strong>')
 .replace('Prof. Wenjing Ma',link('https://marvinquiet.github.io/','Prof. Wenjing Ma'))
 .replace('Prof. Zhihui Wang',link('https://scholar.google.com/citations?user=r-ZsDRQAAAAJ&hl=en','Prof. Zhihui Wang'));
const navItems = ['About','Papers','Experience','Education','Awards'];
if(d.news.enabled && d.news.items.length) navItems.splice(1,0,'News');
function section(id,title,body,extra='') {
 return `<section id="${id}" class="section ${extra}" aria-labelledby="${id}-title"><div class="section-heading"><h2 id="${id}-title">${title}</h2><span class="heading-rule" aria-hidden="true"></span></div>${body}</section>`;
}
function layout(title,path,body) {
 const isError = path==='404.html';
 const base = isError?'/':path.includes('/')?'../':'./';
 const home = isError?'/':path?'../':'./';
 const desc = isError?'This page wandered off. Return to Zhilin Ou’s academic homepage.':path==='bookshelf/'?'A few books Zhilin Ou loves, beyond research.':path==='photography/'?'Photography by Zhilin Ou.':'Zhilin Ou, MPhil student in Artificial Intelligence at CUHK-Shenzhen. Research in 3D vision, embodied AI, and robot learning.';
 const socialImage = `${d.url}/assets/social-card.png?v=${revision('social-card.png')}`;
 const socialAlt = 'Zhilin Ou, MPhil student in Artificial Intelligence at CUHK-Shenzhen. Embodied AI, Robot Learning, and 3D Vision. White-background portrait and a small Baymax camera logo.';
 return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="author" content="Zhilin Ou">
<link rel="canonical" href="${d.url}/${path}"><meta property="og:type" content="website"><meta property="og:site_name" content="Zhilin Ou"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${d.url}/${path}"><meta property="og:image" content="${socialImage}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(socialAlt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${socialImage}"><meta name="twitter:image:alt" content="${esc(socialAlt)}">
<link rel="icon" href="${base}assets/favicon.svg?v=${revision('favicon.svg')}" type="image/svg+xml"><link rel="stylesheet" href="${base}assets/site.css?v=${revision('site.css')}"><script src="${base}assets/preview-motion.js?v=${revision('preview-motion.js')}" defer></script><script src="${base}assets/site.js?v=${revision('site.js')}" defer></script>${body.includes('id="point-field"')?`<script src="${base}assets/research-scene.js?v=${revision('research-scene.js')}" defer></script>`:''}
${(path==='bookshelf/' || body.includes('data-book-preview'))?`<link rel="stylesheet" href="${base}assets/bookshelf.css?v=${revision('bookshelf.css')}"><script src="${base}assets/bookshelf.js?v=${revision('bookshelf.js')}" defer></script>`:''}
${!path?`<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Person',name:d.name,url:d.url,jobTitle:d.role,affiliation:{'@type':'CollegeOrUniversity',name:d.affiliation},sameAs:Object.values(d.links).filter(url=>/^https:\/\//.test(url)),knowsAbout:d.interests})}</script>`:''}
</head><body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><nav class="navigation shell" aria-label="Main navigation"><a class="wordmark" href="${home}" aria-label="Zhilin Ou">${baymaxMark}<span class="wordmark-name">Zhilin Ou<span class="wordmark-dot" aria-hidden="true">.</span></span></a><div class="nav-links">${navItems.map(n=>`<a href="${home}#${n.toLowerCase()}">${n}</a>`).join('')}<details><summary>More</summary><div class="dropdown"><a href="${home}photography/"${path==='photography/'?' aria-current="page"':''}>${icon('camera')}Photography</a><a href="${home}bookshelf/"${path==='bookshelf/'?' aria-current="page"':''}>${icon('book')}Bookshelf</a></div></details></div></nav></header>
<main class="shell" id="main">${body}</main>
<dialog class="figure-dialog" aria-label="Image preview">${photoLanguageToggle()}<button class="figure-close" autofocus type="button" aria-label="Close framework preview">Close <span aria-hidden="true">×</span></button><img alt="Enlarged paper framework" width="2027" height="1225"><div class="figure-bottom" hidden><div class="figure-caption"><h2 data-photo-title></h2><p data-photo-meta hidden></p><p data-photo-caption></p></div><div class="figure-paging" role="group" aria-label="Photograph navigation" hidden><button type="button" data-photo-previous aria-label="Previous photograph">${icon('arrow')}</button><span data-photo-counter aria-live="polite"></span><button type="button" data-photo-next aria-label="Next photograph">${icon('arrow')}</button></div></div></dialog>
<footer class="footer shell${!path?' footer-home':''}">${!path?`<div class="footer-invitation"><p>Always happy to talk about robots, 3D vision, books, photography, or anything you’d like to ask.</p><a href="${esc(d.links.Email)}">Say hello ${icon('arrow')}</a></div><div class="footer-meta">`:''}<span>© 2026 Zhilin Ou</span><a href="${path?home:home+'photography/'}">${path?'Academic homepage':'Photography'} ${icon('arrow')}</a>${!path?'</div>':''}</footer>
</body></html>\n`;
}
const storyAssets = Object.fromEntries(['camera','photo','flower','baymax','hold','hold2'].map(name=>[name,`./assets/scene/${name}.bin?v=${revision(`scene/${name}.bin`)}`]));
const researchVision = d.researchVision ? `<p class="research-vision">${esc(d.researchVision)}</p>` : '';
const sceneReference = d.sceneReference ? `<p class="scene-story">${esc(d.sceneReference).replace(/\bphotography\b/, '<a class="scene-photography-link" href="./photography/">photography</a>')}</p>` : '';
const sceneCaption = d.sceneCaption ? `<p class="scene-caption">${esc(d.sceneCaption)}</p>` : '';
const sceneChapters = [['camera','Show the camera'],['photo','Show the photograph'],['flower','Show the flower'],['baymax','Show Baymax'],['hold','Show Baymax holding the flower']];
const sceneControls = `<div class="scene-controls" hidden><div class="scene-chapters" role="group" aria-label="Animation navigation">${sceneChapters.map(([id,label])=>`<button type="button" data-scene-chapter="${id}" aria-label="${label}"><span class="chapter-track" aria-hidden="true"></span></button>`).join('')}</div><button class="motion-toggle" type="button" aria-label="Pause point cloud motion" aria-pressed="false" hidden>${icon('pause')}</button></div>`;
const hero = `<section class="hero" aria-label="Profile"><div class="hero-copy"><div class="identity"><div class="portrait-frame"><img class="portrait" src="./${esc(d.portrait.src)}" width="${d.portrait.width}" height="${d.portrait.height}" alt="${esc(d.portrait.alt)}" fetchpriority="high"></div><div><p class="greeting">${esc(d.greeting)}</p><h1>Zhilin Ou<span lang="zh">欧芝麟</span></h1></div></div><p class="role">${esc(d.role)}</p><p class="affiliation">${esc(d.affiliation)}</p><p class="interests">${d.interests.map(esc).join('<span aria-hidden="true"> · </span>')}</p>${researchVision}<div class="hero-actions" style="--action-count:${Math.min(4,1+Object.values(d.links).filter(Boolean).length)}"><a class="button primary" href="#papers"><span class="action-icon">${icon('papers')}</span><span class="action-label">Papers</span></a>${Object.entries(d.links).filter(([,v])=>v).map(([k,v])=>`<a class="button" href="${esc(v)}"><span class="action-icon">${k==='GitHub'?githubMark:k==='LinkedIn'?linkedInMark:icon(k==='Email'?'mail':'cap')}</span><span class="action-label">${esc(k)}</span></a>`).join('')}</div></div><div class="hero-art" aria-describedby="scene-description"><div class="scene-view"><img class="scene-fallback" src="./assets/scene/camera.webp?v=${revision('scene/camera.webp')}" width="960" height="680" alt="An original camera-shaped point cloud with a detailed lens, viewfinder and camera body"><canvas id="point-field" data-src="${storyAssets.camera}" data-story="${esc(JSON.stringify(storyAssets))}" aria-hidden="true"></canvas><img class="scene-photograph" src="./assets/photos/digital7.webp" width="1500" height="1000" alt="${esc(d.photoStoryAlt)}" decoding="async" aria-hidden="true"></div><p class="sr-only" id="scene-description">A slow point-cloud loop connects a camera, Zhilin Ou’s photograph of a red kapok flower, a flower illustration, and Baymax gently examining the flower. The flower geometry is an illustration rather than a reconstruction of the photograph.</p><div class="art-footer">${sceneControls}${sceneReference}${sceneCaption}</div></div></section>`;
const about = section('about','About',`<div class="about-copy glass">${d.about.map(p=>`<p>${aboutText(p)}</p>`).join('')}</div>`);
const papers = section('papers','Papers',d.papers.filter(p=>p.public && /^https:\/\//.test(p.url)).map(p=>`<article class="paper glass">${p.figure?`<a class="paper-figure" href="./${p.figure.src}" data-figure aria-label="Enlarge ${esc(p.title)} framework"><img src="./${p.figure.src}" width="${p.figure.width}" height="${p.figure.height}" alt="${esc(p.figure.alt)}" loading="lazy"><span class="figure-expand">${icon('expand')}<span>View framework</span></span></a>`:''}<div class="paper-copy"><p class="paper-source">${esc(p.source)} <span>·</span> ${p.year}</p><h3>${link(p.url,p.title)}</h3><p class="authors">${p.authors.map(a=>a===d.name?`<strong>${esc(a)}</strong>`:esc(a)).join(', ')}</p><a class="paper-link" href="${esc(p.url)}">${icon('papers')}Read paper ${icon('arrow')}</a></div></article>`).join(''));
const logo = name => name.includes('Illinois')?'uiuc':name.includes('Dalian')?'dut':'cuhk';
const mark = name => `<img class="institution-logo" src="./assets/institutions/${logo(name)}.webp" width="48" height="48" alt="${esc(name)} logo" loading="lazy">`;
function timelineEntry(e, education=false) {
 return `<article class="entry"><p class="date">${esc(e.dates)}</p><span class="timeline-node" aria-hidden="true"></span>${mark(e.institution)}<div class="entry-copy"><h3>${esc(e.institution)}</h3><p>${education?esc(e.degree):withLabLink(e.role)}</p>${e.detail?`<p class="detail">${esc(e.detail)}</p>`:''}</div></article>`;
}
const experience = section('experience','Experience',`<div class="entries">${d.experience.map(e=>timelineEntry(e)).join('')}</div>`);
const education = section('education','Education',`<div class="entries">${d.education.map(e=>timelineEntry(e,true)).join('')}</div>`);
const awards = section('awards','Awards',`<ul class="award-list glass">${d.awards.map(a=>`<li><time datetime="${a.year}">${a.year}</time><span>${esc(a.title)}</span></li>`).join('')}</ul>`);
function news(){return d.news.enabled && d.news.items.length?section('news','News',`<ul class="award-list glass">${d.news.items.map(n=>`<li><time>${esc(n.date)}</time><span>${n.url?link(n.url,n.text):esc(n.text)}</span></li>`).join('')}</ul>`):'';}
const photoPreviews = d.photographyPreview.map(src=>d.photographs.find(p=>p.src===src)).filter(Boolean);
const photography = `<aside class="photo-note"><div><p class="eyebrow">Beyond research</p><a href="./photography/">${icon('camera')}Photography ${icon('arrow')}</a><p class="preview-hint">Click a photo for its story.</p></div><div class="photo-strip" role="group" aria-label="Selected photographs">${photoPreviews.map(p=>`<a class="photo-print" href="./${p.src}" data-figure data-album="home" ${photoAttributes(p)} aria-label="View photograph: ${esc(p.title||p.alt)}"><span class="photo-print-paper"><img src="./${p.src}" width="${p.width}" height="${p.height}" alt="${esc(p.alt)}" loading="lazy">${photoStamp(p)}</span><span class="preview-caption" aria-hidden="true">${esc(p.title||p.alt)}</span></a>`).join('')}</div></aside>`;
const previewBooks = d.bookshelfPreview.map(id=>books.find(book=>book.id===id)).filter(Boolean);
const bookPreview = `<aside class="photo-note book-note"><div><p class="eyebrow">On my shelf</p><a href="./bookshelf/">${icon('book')}Bookshelf ${icon('arrow')}</a><p class="preview-hint">Click a cover to explore the book.</p></div>${renderBookPreviews(previewBooks)}</aside>`;
writeFileSync(new URL('index.html',root),layout('Zhilin Ou — 3D Vision & Embodied AI','',hero+about+news()+papers+experience+education+awards+`<div class="personal-previews">${photography}${bookPreview}</div>`));
mkdirSync(new URL('photography/',root),{recursive:true});
writeFileSync(new URL('photography/index.html',root),layout('Photography — Zhilin Ou','photography/',renderPhotography(d.photographs,icon)));
mkdirSync(new URL('bookshelf/',root),{recursive:true});
writeFileSync(new URL('bookshelf/index.html',root),layout('Bookshelf — Zhilin Ou','bookshelf/',renderBookshelf(books)));
writeFileSync(new URL('photography.html',root),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=./photography/"><link rel="canonical" href="'+d.url+'/photography/"><title>Photography — Zhilin Ou</title></head><body><a href="./photography/">View photography</a></body></html>\n');
writeFileSync(new URL('404.html',root),layout('Page not found — Zhilin Ou','404.html',`<section class="error-page" aria-labelledby="error-title"><img class="error-mascot" src="/assets/baymax-camera.svg" width="112" height="112" alt="Baymax holding a camera"><div><p class="error-code">404</p><h1 id="error-title">This page wandered off.</h1><p class="error-note" lang="zh-Hant">這一頁走丟了。</p><a class="error-home" href="/">${icon('arrow')}Back to the homepage</a></div></section>`).replace('<meta name="author"','<meta name="robots" content="noindex"><meta name="author"'));
writeFileSync(new URL('sitemap.xml',root),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${d.url}/</loc></url><url><loc>${d.url}/photography/</loc></url><url><loc>${d.url}/bookshelf/</loc></url></urlset>\n`);
console.log('Built homepage, photography, bookshelf, compatibility redirect, 404, and sitemap.');
