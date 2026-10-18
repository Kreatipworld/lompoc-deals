// node still.mjs page.html out.png t1,t2,...  -> out-<t>.jpg
import { chromium } from 'playwright-core';
const [,, html, out, ts] = process.argv;
const H = process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1181/chrome-linux/headless_shell';
const b = await chromium.launch({ executablePath: H });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('pageerror', e => console.error('PAGEERR', e.message));
await p.goto('file://' + html); await p.evaluate(() => window.READY);
for (const t of ts.split(',')) { await p.evaluate(t => window.seek(t), +t); await p.screenshot({ path: `${out}-${t}.jpg`, type: 'jpeg', quality: 85 }); }
await b.close();
