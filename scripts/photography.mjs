const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bilingual = (zh,en) => `<span data-photo-lang="zh" lang="zh-Hant">${esc(zh)}</span><span data-photo-lang="en" lang="en">${esc(en)}</span>`;
export const photoLanguageToggle = () => `<div class="photo-language" role="group" aria-label="Photography language" hidden><button type="button" data-set-photo-lang="zh" aria-pressed="true" lang="zh-Hant">中文</button><span aria-hidden="true">/</span><button type="button" data-set-photo-lang="en" aria-pressed="false" lang="en">English</button></div>`;
function metadata(p, language) {
 const date = p.date ? language === 'zh' ? `${p.date.slice(0,4)} 年 ${Number(p.date.slice(5))} 月` : new Intl.DateTimeFormat('en',{year:'numeric',month:'short',timeZone:'UTC'}).format(new Date(`${p.date}-01T00:00:00Z`)) : '';
 return [language === 'zh' ? p.locationZh : p.location, date, p.medium === 'Film' ? language === 'zh' ? '膠片' : 'Film' : ''].filter(Boolean).join(' · ');
}
export function photoAttributes(p) {
 const attributes = {
  'data-photo-title-en':p.title || p.alt,'data-photo-title-zh':p.titleZh || p.altZh,
  'data-photo-caption-en':p.caption,'data-photo-caption-zh':p.note,
  'data-photo-meta-en':metadata(p,'en'),'data-photo-meta-zh':metadata(p,'zh'),
  'data-photo-alt-en':p.alt,'data-photo-alt-zh':p.altZh,
 };
 return Object.entries(attributes).map(([key,value])=>`${key}="${esc(value)}"`).join(' ');
}
export function photoStamp(p) {
 if (!p.date) return '';
 const date = new Intl.DateTimeFormat('en',{year:'numeric',month:'short',timeZone:'UTC'}).format(new Date(`${p.date}-01T00:00:00Z`));
 return `<span class="photo-stamp" lang="en"><time datetime="${esc(p.date)}">${esc(date)}</time>${p.printLocation ? `<span aria-hidden="true"> · </span><span>${esc(p.printLocation)}</span>` : ''}</span>`;
}
export function renderPhotography(photos,icon) {
 return `<section class="photography-page" data-photo-region data-lang="zh" lang="zh-Hant"><header class="photo-heading"><a class="back" href="../">${icon('arrow')}${bilingual('學術主頁','Academic homepage')}</a><div class="photo-heading-row"><h1>${bilingual('攝影','Photography')}</h1>${photoLanguageToggle()}</div><p>${bilingual('一些風景，和留在照片裡的日子。','Places, people, and days I want to remember.')}</p><p class="preview-hint">${bilingual('點開照片，讀讀它的故事。','Click a photo for its story.')}</p></header><div class="gallery">${photos.map((p,i)=>`<figure class="photo" id="photo-${esc(p.id)}"><a href="../${p.src}" data-figure data-album="gallery" ${photoAttributes(p)} aria-label="查看照片：${esc(p.titleZh)}"><img src="../${p.src}" width="${p.width}" height="${p.height}" alt="${esc(p.altZh)}" ${i<2?'fetchpriority="high"':'loading="lazy"'} decoding="async">${photoStamp(p)}</a></figure>`).join('')}</div></section>`;
}
