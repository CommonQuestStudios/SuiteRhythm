// Headless desktop screenshots of each app section via system Chrome.
// Usage: node scripts/shoot.mjs [baseUrl] [width] [theme]
import { spawnSync } from 'child_process';
import fs from 'fs';

const base = process.argv[2] || 'http://localhost:3123';
const width = Number(process.argv[3]) || 1440;
const theme = process.argv[4] || 'dark';
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
if (!chrome) { console.error('no chrome'); process.exit(1); }
const dir = '.next/shots';
fs.mkdirSync(dir, { recursive: true });
const sections = ['dashboardPanel', 'dndAutoDetect', 'soundLibrarySection', 'dndControlBoard', 'tableTopSection', 'settingsSection', 'creatorSection', 'storyTellerSection'];
for (const s of sections) {
  const out = `${dir}/${theme}-${width}-${s}.png`;
  const url = `${base}/?section=${s}&theme=${theme}`;
  const r = spawnSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=9000',
    `--window-size=${width},900`, `--screenshot=${out}`, '--user-data-dir=.next/chrome-profile', url,
  ], { stdio: 'ignore', timeout: 40000 });
  console.log(s, r.status === 0 ? 'ok' : 'fail');
}
