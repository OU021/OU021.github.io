import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const data=JSON.parse(readFileSync(resolve(root,'data/site.json')));
const home=readFileSync(resolve(root,'index.html'),'utf8');
const books=JSON.parse(readFileSync(resolve(root,'data/books.json')));
const shelf=readFileSync(resolve(root,'bookshelf/index.html'),'utf8');
assert(books.length>0,'Bookshelf has no books');
assert.equal(new Set(books.map(b=>b.id)).size,books.length,'Book identifiers must be unique');
for(const book of books){
 assert(book.title && book.author && book.description,'Incomplete book entry');
 if(book.editionRegion!=='unspecified')assert(book.publisher && book.year,'Missing edition metadata');
 assert(book.en?.title && book.en?.author && book.en?.description,'Incomplete English book entry');
 assert(/^https:\/\/www\.eslite\.com\/product\//.test(book.sourceUrl),'Book links must point to Eslite product pages');
 assert(book.cover.src.startsWith('assets/books/'),'Book cover must be a local asset');
 assert(shelf.includes(book.title),'A book is missing from the generated shelf');
}
const newsVisible=data.news.enabled && data.news.items.length>0;
assert.equal(home.includes('id="news"'),newsVisible);
assert.equal(home.includes('>News<'),newsVisible);
assert(!home.includes('>CV<'));
assert(home.includes('<strong>Zhilin Ou</strong>'));
assert(home.includes('Prof. Wenjing Ma')&&home.includes('Prof. Zhihui Wang'));
for(const id of ['about','papers','experience','education','awards']) assert(home.includes(`id="${id}"`));
for(const p of data.papers){assert(p.public);assert(p.url.startsWith('https://'));assert(p.authors.includes(data.name));}
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name==='.git'?[]:e.isDirectory()?walk(resolve(dir,e.name)):[resolve(dir,e.name)]);}
const files=walk(root);
for(const file of files.filter(f=>f.endsWith('.html'))){
 const html=readFileSync(file,'utf8');
 for(const [,attr,url] of html.matchAll(/(href|src)="([^"]+)"/g)){
  if(/^(https?:|mailto:)/.test(url))continue;
  const [rawPath,hash]=url.split('#'); const path=rawPath.split('?')[0];
  let target=path.startsWith('/')?resolve(root,'.'+path):resolve(dirname(file),path||'.');
  if(!path)target=file;else if(path.endsWith('/'))target=resolve(target,'index.html');
  assert(existsSync(target),`${file}: missing ${url}`);
  if(hash)assert(readFileSync(target,'utf8').includes(`id="${hash}"`),`Missing anchor ${url}`);
 }
 for(const tag of html.matchAll(/<img\b[^>]+>/g)){assert(/alt="[^"]+"/.test(tag[0]));assert(/width="\d+"/.test(tag[0]));assert(/height="\d+"/.test(tag[0]));}
}
console.log(`Passed: ${files.length} files; public papers, hidden News, required sections, links, image dimensions and alt text.`);
