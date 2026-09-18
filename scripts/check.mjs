import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const data=JSON.parse(readFileSync(resolve(root,'data/site.json')));
const home=readFileSync(resolve(root,'index.html'),'utf8');
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
 for(const tag of html.matchAll(/<img\b[^>]+>/g)){assert(/alt="[^"]+"/.test(tag[0]) || (/alt=""/.test(tag[0]) && /aria-hidden="true"/.test(tag[0])));assert(/width="\d+"/.test(tag[0]));assert(/height="\d+"/.test(tag[0]));}
}
console.log(`Passed: ${files.length} files; public papers, hidden News, required sections, links, image dimensions and alt text.`);
