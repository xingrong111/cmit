const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const currentMajor = Number(process.versions.node.split('.')[0])
let node = process.execPath

if (currentMajor < 24) {
  const candidates = [
    process.env.CMIT_BUILD_NODE,
    process.env.USERPROFILE && path.join(process.env.USERPROFILE, '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'bin', 'node.exe'),
  ].filter(Boolean)
  node = candidates.find((candidate) => {
    if (!fs.existsSync(candidate)) return false
    const result = spawnSync(candidate, ['-p', 'process.versions.node.split(".")[0]'], { encoding: 'utf8' })
    return result.status === 0 && Number(result.stdout.trim()) >= 24
  })
  if (!node) {
    console.error('H5 构建需要 Node.js 24 或更新版本。请切换 Node 版本，或将 CMIT_BUILD_NODE 指向 Node 24 的可执行文件。')
    process.exit(1)
  }
}

const cli = path.join(__dirname, '..', 'node_modules', '@dcloudio', 'vite-plugin-uni', 'bin', 'uni.js')
const result = spawnSync(node, [cli, 'build'], { stdio: 'inherit', env: process.env })
if (result.error) {
  console.error(result.error)
  process.exit(1)
}
process.exit(result.status ?? 1)
