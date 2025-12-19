export function normalizePackageName(input?: string) {
  let text = (input ?? '').trim()
  text = text.replace(/^['"`]+|['"`]+$/g, '')
  text = text.replace(/^[({[<]+/g, '')
  text = text.replace(/[)\]}>.,;:]+$/g, '')
  text = text.replace(/[?#].*$/g, '')

  if (text.startsWith('node:'))
    text = text.slice('node:'.length)

  const lastAtIndex = text.lastIndexOf('@')
  if (lastAtIndex > 0 && (!text.startsWith('@') || text.includes('/', 1))) {
    const hasScope = text.startsWith('@') && text.includes('/', 1)
    if (!hasScope || lastAtIndex > text.indexOf('/', 1))
      text = text.slice(0, lastAtIndex)
  }

  text = text.trim().toLowerCase()

  if (text.startsWith('@')) {
    const parts = text.split('/')
    if (parts.length >= 2)
      text = `${parts[0]}/${parts[1]}`
  }
  else {
    text = text.split('/')[0] ?? ''
  }

  return text
}

export function extractQuotedTokenAt(lineText: string, character: number) {
  const isTokenChar = (ch: string | undefined) => !!ch && /[\w@./-]/.test(ch)
  let idx = Math.min(Math.max(character, 0), lineText.length)
  if (!isTokenChar(lineText[idx]) && idx > 0 && isTokenChar(lineText[idx - 1]))
    idx -= 1

  if (!isTokenChar(lineText[idx]))
    return ''

  let start = idx
  while (start > 0 && isTokenChar(lineText[start - 1]))
    start -= 1

  let end = idx + 1
  while (end < lineText.length && isTokenChar(lineText[end]))
    end += 1

  const quoteLeft = lineText[start - 1]
  const quoteRight = lineText[end]
  if (!quoteLeft || quoteLeft !== quoteRight || !/['"`]/.test(quoteLeft))
    return ''

  return lineText.slice(start, end)
}

export function parseHomepageFromNpmView(result: string) {
  const raw = result.trim()
  if (!raw)
    return ''

  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed === 'string')
      return parsed.trim()
    return ''
  }
  catch {
    const firstLine = raw.split(/\r?\n/)[0]?.trim()
    if (!firstLine || firstLine === 'undefined' || firstLine === 'null')
      return ''
    return firstLine
  }
}

export function normalizeHomepageUrl(input: string) {
  let url = input.trim()
  if (!url)
    return ''

  if (url.startsWith('git+'))
    url = url.slice('git+'.length)

  if (url.startsWith('http://') || url.startsWith('https://'))
    return url

  return ''
}

export function normalizeRepositoryUrl(input: string) {
  let url = input.trim()
  if (!url)
    return ''

  if (url.startsWith('git+'))
    url = url.slice('git+'.length)

  url = url.replace(/\.git$/i, '')

  if (url.startsWith('git://'))
    url = `https://${url.slice('git://'.length)}`

  const githubShortcut = url.match(/^github:([^/]+)\/(.+)$/)
  if (githubShortcut)
    url = `https://github.com/${githubShortcut[1]}/${githubShortcut[2]}`

  const sshGithub = url.match(/^ssh:\/\/git@github\.com[:/](.+)$/)
  if (sshGithub)
    url = `https://github.com/${sshGithub[1]}`

  if (url.startsWith('http://') || url.startsWith('https://'))
    return url

  return ''
}

export function parseUrlsFromNpmView(result: string) {
  const raw = result.trim()
  if (!raw)
    return { homepage: '', repository: '' }

  try {
    const parsed = JSON.parse(raw) as any
    const homepage = typeof parsed?.homepage === 'string' ? parsed.homepage : (typeof parsed === 'string' ? parsed : '')

    let repository = ''
    if (typeof parsed?.repository === 'string')
      repository = parsed.repository
    else if (typeof parsed?.repository?.url === 'string')
      repository = parsed.repository.url

    return { homepage: homepage?.trim?.() ?? '', repository: repository?.trim?.() ?? '' }
  }
  catch {
    return { homepage: parseHomepageFromNpmView(raw), repository: '' }
  }
}
