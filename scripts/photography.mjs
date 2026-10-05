import {toSimplified} from './chinese.mjs';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bilingual = (zh,en) => `<span data-photo-lang="en" lang="en">${esc(en)}</span><span data-photo-lang="zh-Hans" lang="zh-Hans">${esc(toSimplified(zh))}</span><span data-photo-lang="zh-Hant" lang="zh-Hant">${esc(zh)}</span>`;
export const photoLanguageToggle = () => `<div class="photo-language" role="group" aria-label="Language" data-aria-en="Language" data-aria-zh-Hans="语言" data-aria-zh-Hant="語言" hidden><button type="button" data-set-photo-lang="en" aria-pressed="true" lang="en">English</button><span aria-hidden="true">/</span><button type="button" data-set-photo-lang="zh-Hans" aria-pressed="false" lang="zh-Hans" aria-label="简体中文">简中</button><span aria-hidden="true">/</span><button type="button" data-set-photo-lang="zh-Hant" aria-pressed="false" lang="zh-Hant" aria-label="繁體中文">繁中</button></div>`;
function metadata(p, language) {
 const chinese = language !== 'en';
 const date = p.date ? chinese ? `${p.date.slice(0,4)} 年 ${Number(p.date.slice(5))} 月` : new Intl.DateTimeFormat('en',{year:'numeric',month:'short',timeZone:'UTC'}).format(new Date(`${p.date}-01T00:00:00Z`)) : '';
 const text = [chinese ? p.locationZh : p.location, date, p.medium === 'Film' ? chinese ? '膠片' : 'Film' : ''].filter(Boolean).join(' · ');
 return language === 'zh-Hans' ? toSimplified(text) : text;
}
export function photoAttributes(p) {
 const attributes = {};
 for(const language of ['en','zh-Hans','zh-Hant']) {
  const chinese = language !== 'en';
  const localized = value => language === 'zh-Hans' ? toSimplified(value ?? '') : value;
  attributes[`data-photo-title-${language}`] = localized(chinese ? p.titleZh || p.altZh : p.title || p.alt);
  attributes[`data-photo-caption-${language}`] = localized(chinese ? p.note : p.caption);
  attributes[`data-photo-meta-${language}`] = metadata(p,language);
  attributes[`data-photo-alt-${language}`] = localized(chinese ? p.altZh : p.alt);
 }
 return Object.entries(attributes).map(([key,value])=>`${key}="${esc(value)}"`).join(' ');
}
export function photoStamp(p, localized = false) {
 if (!p.date) return '';
 const date = new Intl.DateTimeFormat('en',{year:'numeric',month:'short',timeZone:'UTC'}).format(new Date(`${p.date}-01T00:00:00Z`));
 const locationZh = {Japan:'日本',Dalian:'大連',Guangzhou:'廣州',Miyi:'米易',Shunde:'順德',Hangzhou:'杭州',Wafangdian:'瓦房店',Panzhihua:'攀枝花',Seoul:'首爾',Busan:'釜山',Dandong:'丹東'}[p.printLocation] || p.locationZh || p.printLocation;
 const dateLabel = localized ? bilingual(`${p.date.slice(0,4)} 年 ${Number(p.date.slice(5))} 月`,date) : esc(date);
 const locationLabel = localized ? bilingual(locationZh,p.printLocation) : esc(p.printLocation);
 return `<span class="photo-stamp"${localized ? '' : ' lang="en"'}><time datetime="${esc(p.date)}">${dateLabel}</time>${p.printLocation ? `<span aria-hidden="true"> · </span><span>${locationLabel}</span>` : ''}</span>`;
}
export function renderPhotography(photos,icon) {
 return `<section class="photography-page" data-photo-region data-lang="en" lang="en"><header class="photo-heading"><a class="back" href="../">${icon('arrow')}${bilingual('學術主頁','Academic homepage')}</a><div class="photo-heading-row"><h1>${bilingual('攝影','Photography')}</h1>${photoLanguageToggle()}</div><p>${bilingual('一些風景，和留在照片裡的日子。','Places, people, and days I want to remember.')}</p><p class="preview-hint">${bilingual('點開照片，讀讀它的故事。','Click a photo for its story.')}</p></header><div class="gallery">${photos.map((p,i)=>`<figure class="photo" id="photo-${esc(p.id)}"><a href="../${p.src}" data-figure data-album="gallery" ${photoAttributes(p)} aria-label="View photograph: ${esc(p.title)}" data-aria-en="View photograph: ${esc(p.title)}" data-aria-zh-Hans="查看照片：${esc(toSimplified(p.titleZh || p.altZh))}" data-aria-zh-Hant="查看照片：${esc(p.titleZh || p.altZh)}"><img src="../${p.src}" width="${p.width}" height="${p.height}" alt="${esc(p.alt)}" data-alt-en="${esc(p.alt)}" data-alt-zh-Hans="${esc(toSimplified(p.altZh))}" data-alt-zh-Hant="${esc(p.altZh)}" ${i<2?'fetchpriority="high"':'loading="lazy"'} decoding="async">${photoStamp(p,true)}</a></figure>`).join('')}</div></section>`;
}
