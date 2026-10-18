// node render.mjs page.html out_silent.mp4 seconds [fps]
import { chromium } from 'playwright-core';
import { spawn } from 'child_process';
const [,, html, out, secs, fpsArg='30'] = process.argv;
const fps = +fpsArg, n = Math.round(+secs * fps);
const H = process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1181/chrome-linux/headless_shell';
let b, p;
async function open() {
  if (b) await b.close();
  b = await chromium.launch({ executablePath: H, args: ['--disable-gpu','--js-flags=--max-old-space-size=512'] });
  p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.error('PAGEERR', e.message));
  await p.goto('file://' + html);
  await p.evaluate(() => window.READY);
}
const ff = spawn('./node_modules/ffmpeg-static/ffmpeg', ['-y','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','17','-preset','medium','-r',String(fps),out], { stdio: ['pipe','inherit','inherit'] });
for (let i = 0; i < n; i++) {
  if (i % 80 === 0) await open();
  await p.evaluate(t => window.seek(t), i / fps);
  const buf = await p.screenshot({ type: 'jpeg', quality: 93 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 60 === 0) process.stdout.write(`${i}/${n} `);
}
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('\ndone', out);
