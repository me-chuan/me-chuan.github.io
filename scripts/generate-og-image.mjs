/**
 * 生成社交分享卡片 public/og-image.png (1200×630)
 * 用法: node scripts/generate-og-image.mjs
 * 需要先安装 sharp（本项目已作为依赖）
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = resolve(__dirname, '../public/og-image.png');

const W = 1200;
const H = 630;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0d1117"/>
      <stop offset="0.55" stop-color="#131a26"/>
      <stop offset="1" stop-color="#1b2334"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2f6feb"/>
      <stop offset="1" stop-color="#8b5cf6"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.88" cy="0.12" r="0.62">
      <stop offset="0" stop-color="#8b5cf6" stop-opacity="0.36"/>
      <stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <rect x="88" y="86" width="76" height="76" rx="20" fill="url(#accent)"/>
  <path d="M139.44 110.56 A19 19 0 1 0 139.44 137.44" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" />

  <text x="88" y="300" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="86" font-weight="700" fill="#e6edf3" letter-spacing="-2">Chichuan</text>

  <text x="88" y="360" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="34" font-weight="400" fill="#9aa4b1">Engineering Notes &amp; Projects</text>

  <rect x="88" y="412" width="92" height="5" rx="2.5" fill="url(#accent)"/>

  <text x="88" y="490" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="26" fill="#6e7781">个人主页 · 博客 · 开源项目</text>

  <text x="88" y="540" font-family="Consolas, Menlo, monospace" font-size="24" fill="#4d5762">me-chuan.github.io</text>
</svg>`;

await mkdir(dirname(out), { recursive: true });
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);

const meta = await sharp(out).metadata();
console.log(`生成完成: ${out}`);
console.log(`尺寸: ${meta.width}x${meta.height}  格式: ${meta.format}`);
