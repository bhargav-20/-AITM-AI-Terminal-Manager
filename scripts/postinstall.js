// node-pty ships prebuilt `spawn-helper` binaries for macOS, but npm's tarball
// extraction drops the executable bit. Without it, pty.spawn() fails with
// "posix_spawnp failed". Restore the bit after every install.
const fs = require('fs')
const path = require('path')

const base = path.join(__dirname, '..', 'node_modules', 'node-pty', 'prebuilds')
for (const arch of ['darwin-arm64', 'darwin-x64']) {
  const file = path.join(base, arch, 'spawn-helper')
  try {
    fs.chmodSync(file, 0o755)
    console.log('[postinstall] chmod +x', path.relative(process.cwd(), file))
  } catch {
    // not present on this platform/arch — ignore
  }
}
