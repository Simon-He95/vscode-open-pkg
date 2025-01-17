import { createExtension, getLocale, getSelection, message, openExternalUrl, registerCommand } from '@vscode-use/utils'
import { isWin } from 'lazy-js-utils'
import { jsShell } from 'lazy-js-utils/dist/node'

export = createExtension(() => {
  const importReg = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/
  const requireReg = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/
  const isNpmPackage = /^(?:@[a-z0-9][a-z0-9-_.]*)?\/?[a-z0-9][a-z0-9-_.]*$/

  registerCommand('vscode-open-pkg.openUrl', async () => {
    const isZh = getLocale().includes('zh')
    try {
      const { selectedTextArray, lineText, character } = getSelection()!
      let title = selectedTextArray[0].replace(/['"\s]/g, '')
      if (!title) {
        const importMatch = lineText.match(importReg)
        if (importMatch) {
          title = importMatch[1]
        }
        else {
          const requireMatch = lineText.match(requireReg)
          if (requireMatch) {
            title = requireMatch[1]
          }
          else {
            let temp = ''
            let pre = character
            while (pre >= 0 && !/[!'"\s\n:\u4E00-\u9FA5]/.test(lineText[pre])) {
              temp = `${lineText[pre]}${temp}`
              pre--
            }
            let suffix = character + 1
            while (suffix < lineText.length && !/[!'"\s\n:\u4E00-\u9FA5]/.test(lineText[suffix])) {
              temp = `${temp}${lineText[suffix]}`
              suffix++
            }
            title = temp
          }
        }
      }

      if (!title || /^[\.\~\/]/.test(title) || !isNpmPackage.test(title)) {
        message.error(isZh ? `请选择一个正确的npm包名(${title})` : `Please choose a correct npm package name(${title}).`)
        return
      }
      const { status, result } = await jsShell(`npm view ${title}`, 'pipe')
      if (status !== 0) {
        message.error(result)
      }
      else {
        const url = result.split(isWin() ? '\r' : '\n')[2]
        if (!url || !url.startsWith('http')) {
          message.error(isZh ? `没有找到对应的${title}对应的npm包的主页地址` : `The homepage address of the npm package corresponding to ${title} was not found.`)
          return
        }
        openExternalUrl(url)
      }
    }
    catch (error) {
      console.error(error)
    }
  })
})
