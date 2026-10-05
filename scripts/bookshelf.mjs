import {toSimplified} from './chinese.mjs';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[character]));
const bilingual = (zh,en) => `<span data-book-lang="en" lang="en">${escapeHtml(en)}</span><span data-book-lang="zh-Hans" lang="zh-Hans">${escapeHtml(toSimplified(zh))}</span><span data-book-lang="zh-Hant" lang="zh-Hant">${escapeHtml(zh)}</span>`;
const localizedLabel = (zh,en) => `aria-label="${escapeHtml(en)}" data-aria-zh-Hans="${escapeHtml(toSimplified(zh))}" data-aria-zh-Hant="${escapeHtml(zh)}" data-aria-en="${escapeHtml(en)}"`;
const languageToggle = () => `<div class="bookshelf-language" role="group" ${localizedLabel('書架語言','Bookshelf language')} hidden><button type="button" data-set-lang="en" aria-pressed="true" lang="en">English</button><span aria-hidden="true">/</span><button type="button" data-set-lang="zh-Hans" aria-pressed="false" lang="zh-Hans" aria-label="简体中文">简中</button><span aria-hidden="true">/</span><button type="button" data-set-lang="zh-Hant" aria-pressed="false" lang="zh-Hant" aria-label="繁體中文">繁中</button></div>`;
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>';

function sourceUrl(value) {
  const url = new URL(value);
  if (!['https:','http:'].includes(url.protocol)) throw new TypeError('Book sources must use HTTP or HTTPS.');
  return escapeHtml(url.href);
}

function coverData(cover, base = '../') {
  if (!cover || !/^assets\/[a-zA-Z0-9/_ .-]+\.(?:webp|png|jpe?g)$/i.test(cover.src) || cover.src.includes('..')) {
    throw new TypeError('Book covers must use a local asset path.');
  }
  if (!Number.isFinite(cover.width) || !Number.isFinite(cover.height) || cover.width <= 0 || cover.height <= 0) {
    throw new TypeError('Book covers need positive image dimensions.');
  }
  return {src:escapeHtml(base + cover.src + (cover.version ? '?v=' + cover.version : '')),width:cover.width,height:cover.height,ratio:(cover.width / cover.height).toFixed(5)};
}

const synopsis = value => String(value ?? '').split(/\n\s*\n/).filter(Boolean).map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('');

function renderBook(book, index, preview = false) {
  const cover = coverData(book.cover,preview ? './' : '../');
  const en = book.en || {};
  const enTitle = en.title || book.title;
  const enAuthor = en.author || book.author;
  const source = sourceUrl(book.sourceUrl);
  const taiwanEdition = book.editionRegion !== 'unspecified';
  const templateId = `${preview ? 'preview' : 'bookshelf'}-template-${index}`;
  const titleId = `bookshelf-detail-title-${index}`;
  const metadata = [
    ...(book.publisher ? [['出版社','Publisher',book.publisher]] : []),
    ...(book.year ? [['出版年份','Published',book.year]] : []),
    ...(book.translator ? [['譯者','Translator',book.translator]] : []),
    ...(book.edition ? [['版本','Edition',book.edition]] : [])
  ];
  const imageAlt = `alt="${escapeHtml(enTitle)} — book cover" data-alt-zh-Hans="${escapeHtml(toSimplified(book.title))}，封面" data-alt-zh-Hant="${escapeHtml(book.title)}，封面" data-alt-en="${escapeHtml(enTitle)} — book cover"`;
  const description = book.description || en.description ? `<div class="book-description"><div data-book-lang="zh-Hans" lang="zh-Hans">${synopsis(toSimplified(book.description))}</div><div data-book-lang="zh-Hant" lang="zh-Hant">${synopsis(book.description)}</div><div data-book-lang="en" lang="en">${synopsis(en.description || book.description)}</div></div>` : '';
  const template = `<template id="${templateId}">
    <div class="book-detail">
      <div class="book-detail-cover"><img src="${cover.src}" width="${cover.width}" height="${cover.height}" ${imageAlt} decoding="async"></div>
      <div class="book-detail-copy"><p class="book-edition-label">${bilingual(taiwanEdition ? '臺灣版' : '所選封面',taiwanEdition ? 'Taiwan edition' : 'Selected cover')}</p><h2 id="${titleId}">${bilingual(book.title,enTitle)}</h2>${book.alternateTitle && book.alternateTitle !== book.title ? `<p class="book-alternate-title">${bilingual(`另譯《${book.alternateTitle}》`,`Also published in Chinese as 《${book.alternateTitle}》`)}</p>` : ''}<p class="book-detail-author">${bilingual(book.author,enAuthor)}</p>${description}${book.personalNote?.zh && book.personalNote?.en ? `<aside class="book-personal-note"><p class="book-note-label">${bilingual('我的一點感想','A note from me')}</p><div data-book-lang="zh-Hans" lang="zh-Hans">${synopsis(toSimplified(book.personalNote.zh))}</div><div data-book-lang="zh-Hant" lang="zh-Hant">${synopsis(book.personalNote.zh)}</div><div data-book-lang="en" lang="en">${synopsis(book.personalNote.en)}</div></aside>` : ''}<dl class="book-metadata">${metadata.map(([zh,en,value]) => `<div><dt>${bilingual(zh,en)}</dt><dd><span data-book-lang="en" lang="zh-Hant">${escapeHtml(value)}</span><span data-book-lang="zh-Hans" lang="zh-Hans">${escapeHtml(toSimplified(String(value)))}</span><span data-book-lang="zh-Hant" lang="zh-Hant">${escapeHtml(value)}</span></dd></div>`).join('')}</dl><a class="book-source" href="${source}">${bilingual('在誠品查看','View on Eslite')} ${arrow}</a></div>
    </div>
  </template>`;
  if (!preview) return `<article class="bookshelf-book" id="book-${escapeHtml(book.id)}" role="listitem" data-book-id="${escapeHtml(book.id)}">
  <a class="book-link" href="${source}" data-book-template="${templateId}" ${localizedLabel(`${book.title} — ${book.author}`,`${enTitle} — ${enAuthor}`)}>
    <span class="book-cover-stage"><span class="book-jacket" style="--cover-ratio:${cover.ratio}"><img src="${cover.src}" width="${cover.width}" height="${cover.height}" ${imageAlt} ${index < 4 ? 'decoding="async"' : 'loading="lazy" decoding="async"'}></span></span>
    <span class="book-label"><strong class="book-title">${bilingual(book.title,enTitle)}</strong><span class="book-author">${bilingual(book.author,enAuthor)}</span></span>
  </a>
  ${template}
</article>`;
  return `<a class="book-pick" href="./bookshelf/#book-${escapeHtml(book.id)}" data-book-template="${templateId}" data-book-id="${escapeHtml(book.id)}" aria-label="Read about ${escapeHtml(enTitle)} — ${escapeHtml(book.title)}"><img src="${cover.src}" width="${cover.width}" height="${cover.height}" ${imageAlt} loading="lazy"><span class="preview-caption" lang="en" aria-hidden="true">${escapeHtml(enTitle)}</span></a>${template}`;
}

export function renderBookshelf(books) {
  if (!Array.isArray(books)) throw new TypeError('Bookshelf content must be an array.');
  const spacers = Array.from({length:(4 - books.length % 4) % 4}, (_, index) => `<div class="bookshelf-spacer${books.length % 2 && index === 0 ? ' bookshelf-spacer-mobile' : ''}" aria-hidden="true"><span class="book-cover-stage"></span></div>`).join('');
  return `<section class="bookshelf-page" aria-labelledby="bookshelf-title" data-lang="en" lang="en">
  <header class="bookshelf-heading"><a class="bookshelf-back" href="../">${arrow}${bilingual('學術主頁','Academic homepage')}</a><div class="bookshelf-heading-main"><h1 id="bookshelf-title"><span class="bookshelf-heading-title">${bilingual('書架','Bookshelf')}</span><span class="bookshelf-heading-note"><span data-book-lang="zh-Hans" lang="en">Bookshelf</span><span data-book-lang="zh-Hant" lang="en">Bookshelf</span><span data-book-lang="en" lang="zh-Hant">書架</span></span></h1>${languageToggle()}</div><p>${bilingual('研究之外，一些我喜愛的書。','A few books I love, beyond research.')}</p><p class="preview-hint">${bilingual('點開書封，看看書的介紹。','Click a cover to explore the book.')}</p></header>
  <div class="bookshelf-grid" role="list" ${localizedLabel('喜愛的書','Selected books')}>${books.map((book,index)=>renderBook(book,index)).join('')}${spacers}</div>
</section>
${renderBookDialog()}`;
}

const renderBookDialog = () => `<dialog class="bookshelf-dialog" ${localizedLabel('書籍資料','Book details')} data-lang="en" lang="en">${languageToggle()}<button class="bookshelf-close" type="button" ${localizedLabel('放回書架','Back to the shelf')} autofocus><span>${bilingual('放回書架','Back to the shelf')}</span><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg></button><div data-book-content></div></dialog>`;

export function renderBookPreviews(books) {
 return `<div class="book-strip" data-book-preview role="group" aria-label="Selected books">${books.map((book,index)=>renderBook(book,index,true)).join('')}</div>${renderBookDialog()}`;
}
