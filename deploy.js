/**
 * Сборка папки для хостинга.
 *
 * Копирует в deploy/ только то, что нужно сайту на хостинге:
 * index.html, css/, js/, images/, fonts/.
 * Служебные файлы (_source, Promts, google-sheets, build.js, server.js,
 * code.txt, черновики) в деплой не попадают.
 *
 * Запуск: node deploy.js
 * Затем папку deploy/ можно целиком перетащить в Netlify.
 */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const out = path.join(root, 'deploy');

const files = ['index.html'];
const dirs = ['css', 'js', 'images', 'fonts'];

if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);

for (const f of files) {
  fs.copyFileSync(path.join(root, f), path.join(out, f));
}

for (const d of dirs) {
  fs.cpSync(path.join(root, d), path.join(out, d), { recursive: true });
}

let total = 0;
const walk = (dir) => {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, item.name);
    if (item.isDirectory()) walk(p);
    else total += fs.statSync(p).size;
  }
};
walk(out);

console.log('deploy/ собран: ' + (total / 1024 / 1024).toFixed(2) + ' МБ');
console.log('Содержимое: index.html, ' + dirs.map(d => d + '/').join(', '));
