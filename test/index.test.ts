import { describe, expect, it } from 'vitest'
import { extractQuotedTokenAt, normalizeHomepageUrl, normalizePackageName, normalizeRepositoryUrl, parseHomepageFromNpmView, parseUrlsFromNpmView } from '../src/openPkg'

describe('should', () => {
  it('normalizePackageName', () => {
    expect(normalizePackageName(' "react" ')).toBe('react')
    expect(normalizePackageName('\'@scope/pkg@^1.2.3\'')).toBe('@scope/pkg')
    expect(normalizePackageName('@scope/pkg/subpath')).toBe('@scope/pkg')
    expect(normalizePackageName('react-dom/client')).toBe('react-dom')
    expect(normalizePackageName('node:fs')).toBe('fs')
    expect(normalizePackageName('react,')).toBe('react')
  })

  it('extractQuotedTokenAt', () => {
    expect(extractQuotedTokenAt('"react": "^1.0.0"', 2)).toBe('react')
    expect(extractQuotedTokenAt('const x = \'react-dom\'', 12)).toBe('react-dom')
    expect(extractQuotedTokenAt('const x = undefined', 12)).toBe('')
  })

  it('parseHomepageFromNpmView', () => {
    expect(parseHomepageFromNpmView('"https://react.dev/"\n')).toBe('https://react.dev/')
    expect(parseHomepageFromNpmView('undefined\n')).toBe('')
    expect(parseHomepageFromNpmView('https://example.com/\nother')).toBe('https://example.com/')
  })

  it('normalizeHomepageUrl', () => {
    expect(normalizeHomepageUrl('git+https://github.com/a/b.git')).toBe('https://github.com/a/b.git')
    expect(normalizeHomepageUrl('github:a/b')).toBe('')
  })

  it('normalizeRepositoryUrl', () => {
    expect(normalizeRepositoryUrl('git+https://github.com/a/b.git')).toBe('https://github.com/a/b')
    expect(normalizeRepositoryUrl('git://github.com/a/b.git')).toBe('https://github.com/a/b')
    expect(normalizeRepositoryUrl('github:a/b')).toBe('https://github.com/a/b')
    expect(normalizeRepositoryUrl('ssh://git@github.com/a/b.git')).toBe('https://github.com/a/b')
  })

  it('parseUrlsFromNpmView', () => {
    expect(parseUrlsFromNpmView('{"homepage":"https://example.com","repository":{"type":"git","url":"git+https://github.com/a/b.git"}}')).toEqual({
      homepage: 'https://example.com',
      repository: 'git+https://github.com/a/b.git',
    })
    expect(parseUrlsFromNpmView('"https://example.com"')).toEqual({ homepage: 'https://example.com', repository: '' })
  })
})
