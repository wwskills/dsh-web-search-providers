/**
 * Assemble dist-short/ — the short-name npm variant of this plugin.
 *
 * `dsh-web-search-providers` is the same plugin as
 * `@wwskills/dsh-web-search-providers`, published under a second npm name so
 * installs can type the name without the scope. Only the npm identity differs,
 * and every identity-bearing spot must carry the INSTALLED package's name:
 *
 *   - package.json `name`
 *   - the loader row `name` in cordis.patch.yml (what the Loader imports)
 *   - the client bundle's module-table id (its `__ModuleLoader__` banner)
 *   - the settings panel's `plugins.bundle.config` slot key
 *
 * Everything else — host bundle, API paths, data directory, locale, icon — is
 * name-independent and byte-identical to the scoped build. Host artifacts are
 * copied from lib/ (run `npm run build` first); the client bundle is rebuilt
 * from a patched copy of src/client.tsx so its sourcemap stays accurate.
 *
 * Publish with:  cd dist-short && npm publish
 */
import { build } from 'esbuild'
import {
  cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SCOPED = '@wwskills/dsh-web-search-providers'
const SHORT = 'dsh-web-search-providers'
const out = join(root, 'dist-short')

// The externals match build.mjs: modules the DSH shell provides at runtime.
const clientExternal = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-ui-plugin-manager',
]

rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, 'lib'), { recursive: true })

// --- manifest -------------------------------------------------------------
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
if (manifest.name !== SCOPED) {
  throw new Error(`root package.json name drifted: expected ${SCOPED}, found ${manifest.name}`)
}
// Publishing happens from dist-short/, which has no sources or devDependencies;
// the root lifecycle scripts must not run there.
delete manifest.scripts
delete manifest.devDependencies
manifest.name = SHORT
manifest.description += ` (short npm name of ${SCOPED}; identical plugin)`
writeFileSync(join(out, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)

// --- cordis patch ---------------------------------------------------------
const patch = readFileSync(join(root, 'cordis.patch.yml'), 'utf8')
  .replace(`# ${SCOPED} cordis patch`, `# ${SHORT} cordis patch\n#\n# Short-name variant of ${SCOPED}: same plugin, same config surface.`)
  .replaceAll(`'${SCOPED}'`, `'${SHORT}'`)
if (!patch.includes(`name: '${SHORT}'`)) {
  throw new Error('cordis.patch.yml: row name replacement produced no row name')
}
writeFileSync(join(out, 'cordis.patch.yml'), patch)

// --- host artifacts (name-independent, copy from the scoped build) ---------
for (const file of ['lib/index.js', 'lib/index.js.map']) {
  const source = join(root, file)
  if (!existsSync(source)) throw new Error(`missing ${file} — run "npm run build" first`)
  cpSync(source, join(out, file))
}

// --- type declarations (copy; jsdoc @module tags renamed for coherence) ---
cpSync(join(root, 'lib/types'), join(out, 'lib/types'), { recursive: true })
for (const entry of readdirSync(join(out, 'lib/types'))) {
  if (!entry.endsWith('.d.ts')) continue
  const path = join(out, 'lib/types', entry)
  const text = readFileSync(path, 'utf8')
  const renamed = text.replaceAll(`@module ${SCOPED}`, `@module ${SHORT}`)
  if (renamed !== text) writeFileSync(path, renamed)
}

// --- client bundle (rebuilt: banner id + slot key must be the short name) --
const clientSrc = readFileSync(join(root, 'src/client.tsx'), 'utf8')
const scopedLiteral = `'${SCOPED}'`
if (!clientSrc.includes(scopedLiteral)) {
  throw new Error('src/client.tsx no longer contains the PACKAGE_ID literal — update this script')
}
const tmpEntry = join(root, 'src/.client-short.tmp.tsx')
writeFileSync(tmpEntry, clientSrc.replaceAll(scopedLiteral, `'${SHORT}'`))
try {
  await build({
    entryPoints: [tmpEntry],
    outfile: join(out, 'lib/client.js'),
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: ['es2020'],
    sourcemap: true,
    jsx: 'automatic',
    external: clientExternal,
    define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production') },
    banner: {
      js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(SHORT)}, factory: (require) => {\nvar module = { exports: {} };\n`,
    },
    footer: { js: 'return module.exports; } });' },
    logLevel: 'info',
  })
} finally {
  rmSync(tmpEntry, { force: true })
}

// --- docs, locale, icon ----------------------------------------------------
const readme = readFileSync(join(root, 'README.md'), 'utf8')
  .replace(`# ${SCOPED}`, `# ${SHORT}`)
  .replaceAll(SCOPED, SHORT)
  .replace(
    'Built against **DSH 0.2.1-rc.2** and verified compatible with **0.2.1-rc.3**.',
    `> Same plugin as \`${SCOPED}\`, published under both npm names. Install either one —\n> but only one: two installs register duplicate search providers.\n\nBuilt against **DSH 0.2.1-rc.2** and verified compatible with **0.2.1-rc.3**.`,
  )
writeFileSync(join(out, 'README.md'), readme)

for (const file of ['CHANGELOG.md', 'LICENSE', 'icon.svg']) {
  cpSync(join(root, file), join(out, file))
}
cpSync(join(root, 'locale'), join(out, 'locale'), { recursive: true })

// --- verify the identity swap took effect ----------------------------------
const clientBundle = readFileSync(join(out, 'lib/client.js'), 'utf8')
if (!clientBundle.includes(`id: ${JSON.stringify(SHORT)}`)) {
  throw new Error('client bundle banner does not carry the short name')
}
if (clientBundle.includes(SCOPED)) {
  throw new Error('client bundle still references the scoped name')
}
const outManifest = JSON.parse(readFileSync(join(out, 'package.json'), 'utf8'))
for (const pattern of outManifest.files) {
  // Only plain directory/file entries are declared by this package.
  if (pattern.includes('*')) continue
  if (!existsSync(join(out, pattern))) throw new Error(`declared file missing from dist-short: ${pattern}`)
}

console.log(`dist-short/ assembled: ${SHORT}@${outManifest.version} (${SCOPED}@${outManifest.version} content)`)
console.log('publish with:  cd dist-short && npm publish')
