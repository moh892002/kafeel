/**
 * Dead-code guard for the API client.
 *
 * The api object is assembled in src/app/api/index.js from per-feature service
 * slices (the files under src/features/.../services) plus the app-level slice
 * (src/app/api/appApi.js). Every helper defined on those slices must be called
 * from production code (pages, components, app/meta.js, features/auth/auth.jsx)
 * — a helper added but never wired up fails the suite. And every `api.<name>`
 * reference in production code must resolve to a defined helper, so a stale
 * caller left behind after a removal (or a typo) is caught too. Slices must
 * also never define the same helper twice — the aggregate spreads them, so a
 * duplicate would be silently clobbered. Tests are excluded from the scan on
 * purpose: a helper referenced only by its own test is still dead from the
 * app's view.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

// Vitest runs from the project root (kafeel/), so src/ sits right under cwd.
const SRC = join(process.cwd(), 'src')

/** Every slice file that contributes helpers to the api object. */
function sliceFiles() {
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      const st = statSync(full)
      if (st.isDirectory()) {
        walk(full)
      } else if (/Api\.js$/.test(entry) && !/\.test\./.test(entry)) {
        out.push(full)
      }
    }
  }
  walk(join(SRC, 'app', 'api')) // appApi.js (client.js / index.js don't match *Api.js)
  walk(join(SRC, 'features')) // every feature's services slice, present or future
  return out
}

/** Every helper name defined on a slice object (`key: (...) => ...`). */
function sliceHelpers(file) {
  const src = readFileSync(file, 'utf8')
  const start = src.search(/export const \w+Api = \{/)
  if (start === -1) throw new Error(`slice object not found in ${file}`)
  const body = src.slice(src.indexOf('{', start), src.lastIndexOf('}'))
  return [...body.matchAll(/^  (\w+):/gm)].map((m) => m[1])
}

/** Production .js/.jsx files (no tests, no api/service internals). */
function productionSources() {
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      const st = statSync(full)
      if (st.isDirectory()) {
        if (entry !== 'test' && entry !== 'api' && entry !== 'services') walk(full)
      } else if (/\.(js|jsx)$/.test(entry) && !/\.test\.(js|jsx)$/.test(entry)) {
        out.push(full)
      }
    }
  }
  walk(SRC)
  return out
}

/** Every `api.<name>` reference in a body (tolerates `api\n.meta()` chains). */
function apiReferences(body) {
  return [...body.matchAll(/api\s*\.\s*(\w+)/g)].map((m) => m[1])
}

const sliceNames = sliceFiles().map((file) => file.match(/(\w+Api)\.js$/)[1])
const helpers = sliceFiles().flatMap(sliceHelpers)
const uniqueHelpers = [...new Set(helpers)]
const sources = productionSources()
const bodies = sources.map((file) => ({ file: relative(SRC, file), body: readFileSync(file, 'utf8') }))

describe('api slices stay free of dead helpers', () => {
  it('extracts the slice helpers (sanity — a refactor must not make this pass vacuously)', () => {
    expect(uniqueHelpers.length).toBeGreaterThan(20)
    expect(sources.length).toBeGreaterThan(10)
  })

  it('assembles every slice into app/api/index.js', () => {
    const idx = readFileSync(join(SRC, 'app', 'api', 'index.js'), 'utf8')
    const spread = new Set([...idx.matchAll(/\.\.\.(\w+Api)/g)].map((m) => m[1]))
    for (const name of sliceNames) {
      expect(spread.has(name), `${name} is not spread into app/api/index.js`).toBe(true)
    }
  })

  it('never defines the same helper in two slices (a later spread would clobber it)', () => {
    const dupes = [...new Set(helpers.filter((name, i) => helpers.indexOf(name) !== i))]
    expect(dupes, 'duplicate helper names across slices').toEqual([])
  })

  for (const name of uniqueHelpers) {
    it(`api.${name} is wired to production code`, () => {
      const callers = bodies
        .filter(({ body }) => new RegExp(`api\\s*\\.\\s*${name}(?![\\w])`).test(body))
        .map(({ file }) => file)
      expect(
        callers,
        `api.${name} has no callers outside tests — wire it up or remove it`,
      ).not.toEqual([])
    })
  }

  it('every api.<name> reference resolves to a defined helper', () => {
    const known = new Set(uniqueHelpers)
    const broken = []
    for (const { file, body } of bodies) {
      for (const name of apiReferences(body)) {
        if (!known.has(name)) broken.push(`${file} → api.${name}`)
      }
    }
    expect(broken, 'references to undefined api helpers (typos or removed helpers)').toEqual([])
  })
})
