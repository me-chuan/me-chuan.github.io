/**
 * 为每篇博客文章生成 1200×630 的封面海报 PNG。
 *
 * 设计要点：
 * - 深色印刷封面（书封不会随阅读灯的明暗切换，所以只出一版，不做明暗双图）
 * - 左侧：accent 方块 + 编号 kicker + tag + 日期 + 大标题（衬线，逐行折行）
 * - 右上：极低透明度的巨型编号，呼应站点的「N° 编号目录」
 * - 配色按 tag 数量在三组里轮换，同一篇文章永远同一套颜色
 *
 * 编号规则与前端保持一致：按 pubDate 倒序，最新 = N° 01。
 * 日期相同时依赖排序稳定性，基准顺序取文件名字典序 —— 这和
 * src/pages/blog/[id].astro 里 getStaticPaths 的排序行为一致。
 *
 * 输出到 src/assets/covers/ 而不是 public/covers/：
 * 放进 src 才能被 import.meta.glob 静态枚举到，Vite 会顺带给文件名打指纹，
 * 页面用 import.meta.glob(...{query:'?url'}) 拿到最终 URL，
 * 缺图时 glob 里就没有这个 key，模板自然退回纯文字版本，不需要 existsSync 探测。
 *
 * 用法：
 *   node scripts/generate-blog-covers.mjs
 */

import sharp from 'sharp';
import { readdir, readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 1200;
const H = 630;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG_DIR = resolve(ROOT, 'src/content/blog');
const OUT_DIR = resolve(ROOT, 'src/assets/covers');

/** 极简 frontmatter 解析器（不引 gray-matter，少一个依赖） */
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    fm[k] = v;
  }
  return fm;
}

/** 把 tags: [A, B, C] 解析成数组 */
function parseTags(fm) {
  const raw = (fm.tags || '').replace(/^\[|\]$/g, '');
  return raw
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

const PALETTE = [
  { fg: '#e6edf3', bg: '#0d1117', accent: '#58a6ff', accent2: '#8b5cf6' },
  { fg: '#e6edf3', bg: '#0d1117', accent: '#f97583', accent2: '#ffae57' },
  { fg: '#e6edf3', bg: '#0d1117', accent: '#7ee787', accent2: '#58a6ff' },
];

// XML 实体表。用查表 + 回调，避免在源码里直接写实体字符串。
const XML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => XML_ENTITIES[ch]);
}

/**
 * 估算字符宽度：中日韩字符按全角算，其余按半角算。
 * 不追求像素级精确，只用来决定标题在哪断行。
 */
function charWidth(ch, fontSize) {
  const c = ch.codePointAt(0);
  const wide =
    (c >= 0x1100 && c <= 0x115f) ||
    (c >= 0x2e80 && c <= 0xa4cf) ||
    (c >= 0xac00 && c <= 0xd7a3) ||
    (c >= 0xf900 && c <= 0xfaff) ||
    (c >= 0xfe30 && c <= 0xfe6f) ||
    (c >= 0xff00 && c <= 0xff60) ||
    (c >= 0xffe0 && c <= 0xffe6);
  return wide ? fontSize : fontSize * 0.5;
}

/** 按可用宽度把标题折成最多 maxLines 行；放不下就砍掉并加省略号 */
function wrapTitle(title, fontSize, maxWidth, maxLines = 3) {
  const lines = [];
  let cur = '';
  let curW = 0;
  for (const ch of title) {
    const w = charWidth(ch, fontSize);
    if (curW + w > maxWidth && cur) {
      lines.push(cur);
      cur = '';
      curW = 0;
      if (lines.length === maxLines) break;
    }
    cur += ch;
    curW += w;
  }
  if (lines.length < maxLines && cur) lines.push(cur);

  // 走到这里说明是被 maxLines 截断的，补个省略号
  if (lines.length === maxLines && cur === '') {
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + '…';
  }
  return lines;
}

// 等宽栈里带上 NSimSun / SimSun：tag 可能是中文，不给 CJK 回退的话
// 字重和基线会跟同一行的日期明显对不齐。
const SERIF = "'Instrument Serif', 'Source Han Serif SC', 'Songti SC', SimSun, 'Times New Roman', Georgia, serif";
const MONO = "Consolas, NSimSun, SimSun, 'Courier New', monospace";

function buildSvg({ title, tags, number, date, palette }) {
  const tagLabel = (tags[0] || 'Journal').toUpperCase();
  const numberLabel = `N° ${number}`;

  const TITLE_SIZE = 68;
  const LINE_H = Math.round(TITLE_SIZE * 1.22);
  const MARGIN = 80;
  const TITLE_W = W - MARGIN * 2;
  const CENTER_Y = 348;

  const lines = wrapTitle(title, TITLE_SIZE, TITLE_W, 3);
  const blockH = (lines.length - 1) * LINE_H;
  const firstBaseline = Math.round(CENTER_Y - blockH / 2 + TITLE_SIZE * 0.35);

  const titleSvg = lines
    .map(
      (ln, i) =>
        `<text x="${MARGIN}" y="${firstBaseline + i * LINE_H}" font-family="${escapeXml(
          SERIF
        )}" font-size="${TITLE_SIZE}" font-weight="400" fill="${palette.fg}" letter-spacing="-1">${escapeXml(
          ln
        )}</text>`
    )
    .join('\n    ');

  // 标题下方的 tag 条：每条一个短线，颜色取当前配色的主色
  const tagBars = tags
    .slice(0, 4)
    .map(
      (_, i) =>
        `<rect x="${MARGIN + i * 26}" y="${500}" width="16" height="4" rx="2" fill="${
          palette.accent
        }" opacity="${0.9 - i * 0.18}"/>`
    )
    .join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="0.82" cy="0.05" r="0.75">
      <stop offset="0" stop-color="${palette.accent2}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${palette.accent2}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="${palette.bg}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- 右上巨型编号：呼应站点的编号目录 -->
  <text x="${W - MARGIN}" y="300" font-family="${escapeXml(MONO)}" font-size="280" font-weight="700" fill="${palette.accent}" opacity="0.07" text-anchor="end" letter-spacing="-8">${escapeXml(number)}</text>

  <!-- 站标 + kicker -->
  <rect x="${MARGIN}" y="76" width="56" height="56" rx="10" fill="${palette.accent}"/>
  <text x="${MARGIN + 76}" y="102" font-family="${escapeXml(MONO)}" font-size="22" font-weight="700" fill="${palette.accent}" letter-spacing="2">${escapeXml(numberLabel)}</text>
  <text x="${MARGIN + 76}" y="130" font-family="${escapeXml(MONO)}" font-size="17" fill="#9aa4b1" letter-spacing="1.5">${escapeXml(tagLabel)}${
    tags.length > 1 ? '  ·  ' + escapeXml(String(tags.length)) + ' TAGS' : ''
  }  ·  ${escapeXml(date)}</text>

  <!-- 标题（核心） -->
  ${titleSvg}

  <!-- 底部信息条 -->
  ${tagBars}
  <text x="${MARGIN}" y="560" font-family="${escapeXml(MONO)}" font-size="17" fill="#9aa4b1" letter-spacing="1">me-chuan.github.io  ·  read on</text>
</svg>`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files = (await readdir(BLOG_DIR)).filter((f) => f.endsWith('.md')).sort();
  const posts = [];
  for (const file of files) {
    const raw = await readFile(resolve(BLOG_DIR, file), 'utf8');
    const fm = parseFrontmatter(raw);
    posts.push({
      file,
      slug: file.replace(/\.md$/, ''),
      title: fm.title || file.replace(/\.md$/, ''),
      tags: parseTags(fm),
      date: (fm.pubDate || '').slice(0, 10).replace(/-/g, '/'),
      time: new Date(fm.pubDate || 0).valueOf(),
    });
  }

  // 按发表时间倒序；时间相同时靠排序稳定性保持文件名字典序，
  // 与前端 getStaticPaths 的结果一一对应
  const sorted = posts.slice().sort((a, b) => b.time - a.time);

  for (let i = 0; i < sorted.length; i++) {
    const post = sorted[i];
    const number = String(i + 1).padStart(2, '0');
    const svg = buildSvg({
      title: post.title,
      tags: post.tags,
      number,
      date: post.date,
      palette: PALETTE[post.tags.length % PALETTE.length],
    });

    const out = resolve(OUT_DIR, `${post.slug}.png`);
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
    console.log(`✓ ${number}  ${post.slug}.png  (${post.tags.length} tags)`);
  }

  console.log(`\n${sorted.length} 张封面已生成到 src/assets/covers/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});