/**
 * Dead-code guard for the API client.
 *
 * Every helper on `api` in src/api.js must be called from production code
 * (pages, components, meta.js, auth.jsx) — a helper added but never wired up
 * fails the suite. And every `api.<name>` reference in production code must
 * resolve to a defined helper, so a stale caller left behind after a removal
 * (or a typo) is caught too. Tests are excluded from the scan on purpose: a
 * helper referenced only by its own test is still dead from the app's view.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

// Vitest runs from the project root (kafeel/), so src/ sits right under cwd.
const SRC = join(process.cwd(), 'src')

/** Recursively lists production .js/.jsx files (no tests, no vitest setup dir). */
function productionSources() {
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      const st = statSync(full)
      if (st.isDirectory()) {
        if (entry !== 'test') walk(full)
      } else if (/\.(js|jsx)$/.test(entry) && !/\.test\.(js|jsx)$/.test(entry) && entry !== 'api.js') {
        out.push(full)
      }
    }
  }
  walk(SRC)
  return out
}

/** Every helper name defined on the exported api object. */
function apiHelpers() {
  const src = readFileSync(join(SRC, 'api.js'), 'utf8')
  const objectBody = src.slice(src.indexOf('export const api = {'))
  return [...objectBody.matchAll(/^  (\w+):/gm)].map((m) => m[1])
}

/** Every `api.<name>` reference in a body (tolerates `api\n.meta()` chains). */
function apiReferences(body) {
  return [...body.matchAll(/api\s*\.\s*(\w+)/g)].map((m) => m[1])
}

const helpers = apiHelpers()
const sources = productionSources()
const bodies = sources.map((file) => ({ file: relative(SRC, file), body: readFileSync(file, 'utf8') }))

describe('api.js stays free of dead helpers', () => {
  it('extracts the api object helpers (sanity — a formatter change must not make this pass vacuously)', () => {
    expect(helpers.length).toBeGreaterThan(20)
    expect(sources.length).toBeGreaterThan(10)
  })

  for (const name of helpers) {
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
    const known = new Set(helpers)
    const broken = []
    for (const { file, body } of bodies) {
      for (const name of apiReferences(body)) {
        if (!known.has(name)) broken.push(`${file} → api.${name}`)
      }
    }
    expect(broken, 'references to undefined api helpers (typos or removed helpers)').toEqual([])
  })
})
