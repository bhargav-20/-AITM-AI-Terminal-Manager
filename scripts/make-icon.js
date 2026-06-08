// Render build/icon.svg -> build/icon.png (1024) and build/icon.icns (macOS).
// Run after editing the SVG: `npm run icon`.
const { Resvg } = require('@resvg/resvg-js')
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const buildDir = path.join(__dirname, '..', 'build')
const svg = fs.readFileSync(path.join(buildDir, 'icon.svg'))

function renderPng(size) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
}

// Master PNG (electron-builder fallback + general use)
fs.writeFileSync(path.join(buildDir, 'icon.png'), renderPng(1024))
console.log('wrote build/icon.png (1024)')

// macOS .icns via a generated iconset
if (process.platform === 'darwin') {
  const iconset = path.join(buildDir, 'icon.iconset')
  fs.rmSync(iconset, { recursive: true, force: true })
  fs.mkdirSync(iconset)
  for (const base of [16, 32, 128, 256, 512]) {
    fs.writeFileSync(path.join(iconset, `icon_${base}x${base}.png`), renderPng(base))
    fs.writeFileSync(path.join(iconset, `icon_${base}x${base}@2x.png`), renderPng(base * 2))
  }
  execFileSync('iconutil', ['-c', 'icns', iconset, '-o', path.join(buildDir, 'icon.icns')])
  fs.rmSync(iconset, { recursive: true, force: true })
  console.log('wrote build/icon.icns')
}
