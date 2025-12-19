import { createExtension, getLocale, getSelection, message, openExternalUrl, registerCommand } from '@vscode-use/utils'
import { jsShell } from 'lazy-js-utils/node'
import { extractQuotedTokenAt, normalizeHomepageUrl, normalizePackageName, normalizeRepositoryUrl, parseUrlsFromNpmView } from './openPkg'

// eslint-disable-next-line no-restricted-syntax
export = createExtension(() => {
  const importFromReg = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/
  const importSideEffectReg = /import\s+['"`]([^'"`]+)['"`]/
  const requireReg = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/
  const dynamicImportReg = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/
  const isNpmPackage = /^(?:@[a-z0-9][a-z0-9-_.]*)?\/?[a-z0-9][a-z0-9-_.]*$/

  registerCommand('vscode-open-pkg.openUrl', async () => {
    const isZh = getLocale().includes('zh')
    try {
      const selection = getSelection()
      if (!selection) {
        message.error(isZh ? '当前没有可用的编辑器选区' : 'No active editor selection found.')
        return
      }

      const { selectedTextArray, lineText, character } = selection
      const selectedText = selectedTextArray?.[0] ?? ''
      let title = normalizePackageName(selectedText)

      if (!title) {
        const importFromMatch = lineText.match(importFromReg)
        const importSideEffectMatch = lineText.match(importSideEffectReg)
        const requireMatch = lineText.match(requireReg)
        const dynamicImportMatch = lineText.match(dynamicImportReg)

        title = normalizePackageName(
          importFromMatch?.[1]
          || importSideEffectMatch?.[1]
          || requireMatch?.[1]
          || dynamicImportMatch?.[1]
          || extractQuotedTokenAt(lineText, character),
        )
      }

      if (!title || /^[.~/]/.test(title) || !isNpmPackage.test(title)) {
        message.error(isZh ? `请选择一个正确的npm包名(${title})` : `Please choose a correct npm package name(${title}).`)
        return
      }

      const { status, result } = await jsShell(`npm view ${title} homepage repository --json`, 'pipe')
      if (status !== 0) {
        message.error(result)
      }
      else {
        const { homepage, repository } = parseUrlsFromNpmView(result)
        const homepageUrl = normalizeHomepageUrl(homepage)
        const repositoryUrl = normalizeRepositoryUrl(repository)
        const fallback = `https://www.npmjs.com/package/${title}`
        openExternalUrl(homepageUrl || repositoryUrl || fallback)
      }
    }
    catch (error) {
      console.error(error)
      message.error(isZh ? '打开包主页失败，请重试' : 'Failed to open the package homepage, please try again.')
    }
  })
})
