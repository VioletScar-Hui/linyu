import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="#16242c"/>
  <g transform="translate(30 30) scale(2.83)" fill="none" stroke="#c9a86a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
    <line x1="16" y1="8" x2="2" y2="22"/>
    <line x1="17.5" y1="15" x2="9" y2="15"/>
  </g>
</svg>`;

mkdirSync('public/icon', { recursive: true });
for (const size of [16, 32, 48, 128]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icon/${size}.png`);
}
console.log('icons generated');
