const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[character]));
const bilingual = (zh,en) => `<span data-book-lang="zh" lang="zh-Hant">${escapeHtml(zh)}</span><span data-book-lang="en" lang="en">${escapeHtml(en)}</span>`;
const localizedLabel = (zh,en) => `aria-label="${escapeHtml(zh)}" data-aria-zh="${escapeHtml(zh)}" data-aria-en="${escapeHtml(en)}"`;
const languageToggle = () => `<div class="bookshelf-language" role="group" ${localizedLabel('書架語言','Bookshelf language')} hidden><button type="button" data-set-lang="zh" aria-pressed="true" lang="zh-Hant">中文</button><span aria-hidden="true">/</span><button type="button" data-set-lang="en" aria-pressed="false" lang="en">English</button></div>`;
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>';

function sourceUrl(value) {
  const url = new URL(value);
  if (!['https:','http:'].includes(url.protocol)) throw new TypeError('Book sources must use HTTP or HTTPS.');
  return escapeHtml(url.href);
}

function coverData(cover) {
  if (!cover || !/^assets\/[a-zA-Z0-9/_ .-]+\.(?:webp|png|jpe?g)$/i.test(cover.src) || cover.src.includes('..')) {
    throw new TypeError('Book covers must use a local asset path.');
  }
  if (!Number.isFinite(cover.width) || !Number.isFinite(cover.height) || cover.width <= 0 || cover.height <= 0) {
    throw new TypeError('Book covers need positive image dimensions.');
  }
  return {src:escapeHtml('../' + cover.src + (cover.version ? '?v=' + cover.version : '')),width:cover.width,height:cover.height,ratio:(cover.width / cover.height).toFixed(5)};
}

const synopsis = value => String(value ?? '').split(/\n\s*\n/).filter(Boolean).map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('');

function renderBook(book, index) {
  const cover = coverData(book.cover);
  const en = book.en || {};
  const enTitle = en.title || book.title;
  const enAuthor = en.author || book.author;
  const source = sourceUrl(book.sourceUrl);
  const taiwanEdition = book.editionRegion !== 'unspecified';
  const templateId = `bookshelf-template-${index}`;
  const titleId = `bookshelf-detail-title-${index}`;
  const metadata = [
    ...(book.publisher ? [['出版社','Publisher',book.publisher]] : []),
    ...(book.year ? [['出版年份','Published',book.year]] : []),
    ...(book.translator ? [['譯者','Translator',book.translator]] : []),
    ...(book.edition ? [['版本','Edition',book.edition]] : [])
  ];
  const imageAlt = `alt="${escapeHtml(book.title)}，封面" data-alt-zh="${escapeHtml(book.title)}，封面" data-alt-en="${escapeHtml(enTitle)} — book cover"`;
  const description = book.description || en.description ? `<div class="book-description"><div data-book-lang="zh" lang="zh-Hant">${synopsis(book.description)}</div><div data-book-lang="en" lang="en">${synopsis(en.description || book.description)}</div></div>` : '';
  return `<article class="bookshelf-book" id="book-${escapeHtml(book.id)}" role="listitem" data-book-id="${escapeHtml(book.id)}">
  <a class="book-link" href="${source}" data-book-template="${templateId}" ${localizedLabel(`${book.title} — ${book.author}`,`${enTitle} — ${enAuthor}`)}>
    <span class="book-cover-stage"><span class="book-jacket" style="--cover-ratio:${cover.ratio}"><img src="${cover.src}" width="${cover.width}" height="${cover.height}" ${imageAlt} ${index < 4 ? 'decoding="async"' : 'loading="lazy" decoding="async"'}></span></span>
    <span class="book-label"><strong class="book-title">${bilingual(book.title,enTitle)}</strong><span class="book-author">${bilingual(book.author,enAuthor)}</span></span>
  </a>
  <template id="${templateId}">
    <div class="book-detail">
      <div class="book-detail-cover"><img src="${cover.src}" width="${cover.width}" height="${cover.height}" ${imageAlt} decoding="async"></div>
      <div class="book-detail-copy"><p class="book-edition-label">${bilingual(taiwanEdition ? '臺灣版' : '所選封面',taiwanEdition ? 'Taiwan edition' : 'Selected cover')}</p><h2 id="${titleId}">${bilingual(book.title,enTitle)}</h2>${book.alternateTitle && book.alternateTitle !== book.title ? `<p class="book-alternate-title">${bilingual(`另譯《${book.alternateTitle}》`,`Also published in Chinese as 《${book.alternateTitle}》`)}</p>` : ''}<p class="book-detail-author">${bilingual(book.author,enAuthor)}</p>${description}<dl class="book-metadata">${metadata.map(([zh,en,value]) => `<div><dt>${bilingual(zh,en)}</dt><dd lang="zh-Hant">${escapeHtml(value)}</dd></div>`).join('')}</dl><a class="book-source" href="${source}">${bilingual('在誠品查看','View on Eslite')} ${arrow}</a></div>
    </div>
  </template>
</article>`;
}

export function renderBookshelf(books) {
  if (!Array.isArray(books)) throw new TypeError('Bookshelf content must be an array.');
  const spacers = Array.from({length:(4 - books.length % 4) % 4}, (_, index) => `<div class="bookshelf-spacer${books.length % 2 && index === 0 ? ' bookshelf-spacer-mobile' : ''}" aria-hidden="true"><span class="book-cover-stage"></span></div>`).join('');
  return `<section class="bookshelf-page" aria-labelledby="bookshelf-title" data-lang="zh" lang="zh-Hant">
  <header class="bookshelf-heading"><a class="bookshelf-back" href="../">${arrow}${bilingual('學術主頁','Academic homepage')}</a><div class="bookshelf-heading-main"><h1 id="bookshelf-title"><span class="bookshelf-heading-title">${bilingual('書架','Bookshelf')}</span><span class="bookshelf-heading-note"><span data-book-lang="zh" lang="en">Bookshelf</span><span data-book-lang="en" lang="zh-Hant">書架</span></span></h1>${languageToggle()}</div><p>${bilingual('研究之外，一些我喜愛的書。','A few books I love, beyond research.')}</p></header>
  <div class="bookshelf-grid" role="list" ${localizedLabel('喜愛的書','Selected books')}>${books.map(renderBook).join('')}${spacers}</div>
</section>
<dialog class="bookshelf-dialog" ${localizedLabel('書籍資料','Book details')} data-lang="zh" lang="zh-Hant">${languageToggle()}<button class="bookshelf-close" type="button" ${localizedLabel('關閉書籍資料','Close book details')} autofocus><span>${bilingual('關閉','Close')}</span><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg></button><div data-book-content></div></dialog>`;
}
