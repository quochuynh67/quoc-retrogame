const fs = require('fs');
const path = require('path');

const romDir = '/Users/stacktech/Documents/quoc67k1/quoc-porfolio/web/tuoitho/fb_neo_rom';
const mainJsPath = '/Users/stacktech/Documents/quoc67k1/nostalgist-demo/src/main.js';

let files = fs.readdirSync(romDir).filter(f => f.endsWith('.zip'));
files.sort();

const optionsHtml = files.map(f => {
  const url = `https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/${f}`;
  return `          <option value="${url}">${f}</option>`;
}).join('\n');

const selectHtml = `        <label class="label" for="romUrl">Chọn Game (ROM)</label>
        <select id="romUrl" class="input">
${optionsHtml}
        </select>
        <p class="hint">
          Chọn game từ danh sách. Một số game có thể cần kèm file BIOS.
        </p>`;

let mainJs = fs.readFileSync(mainJsPath, 'utf8');

mainJs = mainJs.replace(
  /<label class="label" for="romUrl">[\s\S]*?<\/p>/,
  selectHtml
);

fs.writeFileSync(mainJsPath, mainJs);
console.log('Updated main.js with ' + files.length + ' ROMs.');
