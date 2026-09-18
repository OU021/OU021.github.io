// Optional asset renderer: requires @napi-rs/canvas. The regular site build has no dependencies.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const require = createRequire(import.meta.url);
const {createCanvas,loadImage,GlobalFonts} = require('@napi-rs/canvas');
const root = new URL('../',import.meta.url);
const path = file => fileURLToPath(new URL(file,root));
const data = JSON.parse(readFileSync(path('data/site.json')));
GlobalFonts.registerFromPath(path('assets/fonts/dm-serif-display.ttf'),'Card Serif');
GlobalFonts.registerFromPath(path('assets/fonts/dm-sans-regular.ttf'),'Card Sans');
GlobalFonts.registerFromPath(path('assets/fonts/dm-sans-semibold.ttf'),'Card Semibold');
const canvas = createCanvas(1200,630);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#f5f0e7'; ctx.fillRect(0,0,1200,630);
ctx.fillStyle = '#fcfaf5'; ctx.beginPath(); ctx.roundRect(28,28,1144,574,20); ctx.fill();
ctx.strokeStyle = '#e4dbcf'; ctx.lineWidth = 1; ctx.stroke();
function text(value,x,y,size,font='Card Sans',colour='#39352f') {
  ctx.fillStyle=colour; ctx.font=`${size}px "${font}"`; ctx.fillText(value,x,y);
}
text('ACADEMIC HOMEPAGE',76,107,15,'Card Semibold','#897460');
text(data.name,72,223,84,'Card Serif');
text(data.role,77,282,26);
const affiliation = data.affiliation.split(/, (?=[^,]*$)/);
affiliation.forEach((line,i)=>text(line+(i<affiliation.length-1?',':''),77,329+i*36,25,'Card Sans','#696157'));
text(data.interests.join('  ·  '),77,432,23,'Card Semibold','#8b6246');
const portrait = await loadImage(path(data.portrait.src));
ctx.save(); ctx.beginPath(); ctx.roundRect(864,159,258,258,10); ctx.clip();
ctx.drawImage(portrait,864,159,258,258); ctx.restore();
ctx.strokeStyle='#e4dbcf'; ctx.beginPath(); ctx.moveTo(77,491); ctx.lineTo(1122,491); ctx.stroke();
text(new URL(data.url).host,77,551,21,'Card Sans','#77695b');
const logo = await loadImage(readFileSync(path('assets/baymax-camera.svg')));
ctx.drawImage(logo,1042,506,76,76);
writeFileSync(path('assets/social-card.png'),canvas.toBuffer('image/png'));
console.log('Rendered assets/social-card.png (1200 × 630).');
