// Generates every app icon from the one drawing below.
//
//   node scripts/gen-icons.mjs
//
// The PNGs are rendered by a Chromium browser already on the machine (Edge or
// Chrome, run headless), so there is nothing to install. Set BROWSER to the
// executable if it is somewhere unusual.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const pub = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public')

/**
 * The icon: a tilted dumbbell in the app's accent on its dark surface, lit
 * from the top-right corner like the hero cards.
 *
 * `rounded` clips it to a rounded square (browser tab, Android/desktop
 * launcher). Left square it is for iOS and for "maskable", where the system
 * cuts the shape itself; the dumbbell stays inside the maskable safe zone
 * (a circle of 40% of the side around the centre).
 */
function icon({ rounded, size = 512 }) {
  const clip = rounded ? ' clip-path="url(#shape)"' : ''
  return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="shape"><rect width="512" height="512" rx="116"/></clipPath>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b1e23"/>
      <stop offset="1" stop-color="#08090b"/>
    </linearGradient>
    <radialGradient id="light" cx="1" cy="0" r="1">
      <stop offset="0" stop-color="#c8f53c" stop-opacity="0.34"/>
      <stop offset="0.55" stop-color="#c8f53c" stop-opacity="0.07"/>
      <stop offset="1" stop-color="#c8f53c" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="lime" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e2ff6e"/>
      <stop offset="1" stop-color="#b2e22a"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="22"/>
    </filter>
    <g id="dumbbell">
      <rect x="-192" y="-18" width="384" height="36" rx="18"/>
      <rect x="-126" y="-80" width="50" height="160" rx="20"/>
      <rect x="76" y="-80" width="50" height="160" rx="20"/>
      <rect x="-176" y="-55" width="38" height="110" rx="16"/>
      <rect x="138" y="-55" width="38" height="110" rx="16"/>
    </g>
  </defs>
  <g${clip}>
    <rect width="512" height="512" fill="url(#bg)"/>
    <rect width="512" height="512" fill="url(#light)"/>
    <g transform="translate(256 256) rotate(-45)">
      <use href="#dumbbell" fill="#c8f53c" opacity="0.3" filter="url(#glow)"/>
      <use href="#dumbbell" fill="url(#lime)"/>
    </g>
  </g>
</svg>
`
}

function findBrowser() {
  const candidates = [
    process.env.BROWSER,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
  ]
  const found = candidates.find((p) => p && existsSync(p))
  if (!found) throw new Error('No Edge/Chrome found: set BROWSER to the executable.')
  return found
}

/** Width and height stored in a PNG file's header. */
function pngSize(file) {
  const b = readFileSync(file)
  return [b.readUInt32BE(16), b.readUInt32BE(20)]
}

writeFileSync(resolve(pub, 'favicon.svg'), icon({ rounded: true }))
console.log('wrote favicon.svg')

const targets = [
  { name: 'pwa-192.png', size: 192, rounded: true },
  { name: 'pwa-512.png', size: 512, rounded: true },
  { name: 'pwa-maskable-512.png', size: 512, rounded: false },
  // iOS rounds the corners itself and paints transparency black.
  { name: 'apple-touch-icon.png', size: 180, rounded: false },
]

const browser = findBrowser()
const work = mkdtempSync(join(tmpdir(), 'gym-icons-'))
try {
  for (const t of targets) {
    const page = join(work, `${t.name}.html`)
    const out = resolve(pub, t.name)
    writeFileSync(page, `<!doctype html><html><body style="margin:0;overflow:hidden;background:transparent">${icon(t)}</body></html>`)
    execFileSync(browser, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--default-background-color=00000000',
      `--user-data-dir=${join(work, 'profile')}`,
      `--window-size=${t.size},${t.size}`,
      `--screenshot=${out}`,
      pathToFileURL(page).href,
    ], { stdio: 'ignore' })
    const [w, h] = pngSize(out)
    if (w !== t.size || h !== t.size) throw new Error(`${t.name} came out ${w}x${h}, expected ${t.size}x${t.size}`)
    console.log('wrote', t.name)
  }
} finally {
  rmSync(work, { recursive: true, force: true })
}
