import { getSelection, message, openExternalUrl, registerCommand } from '@vscode-use/utils'
import { jsShell } from 'lazy-js-utils'
import type { ExtensionContext } from 'vscode'

export function activate(context: ExtensionContext) {
  const urlReg = /^https?:\/\/[^\s\/$.?#].[^\s]*$/gm
  const importReg = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/
  const requireReg = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/
  context.subscriptions.push(registerCommand('vscode-open-pkg.openUrl', () => {
    const { selectedTextArray, lineText } = getSelection()!
    let title = selectedTextArray[0].replace(/['"\s]/g, '')
    if (!title) {
      const importMatch = lineText.match(importReg)
      if (importMatch) {
        title = importMatch[1]
      }
      else {
        const requireMatch = lineText.match(requireReg)
        if (requireMatch)
          title = requireMatch[1]
      }
    }
    if (!title || /^[\.\~\/]/.test(title)) {
      message.error('请选择一个正确的npm包名')
      return
    }
    const { status, result } = jsShell(`npm view ${title}`, 'pipe')
    if (status !== 0) {
      message.error(result)
    }
    else {
      const url = result.split('\n')[2]
      if (!url || !urlReg.test(url)) {
        message.error('没有找到对应的npm包的主页地址')
        return
      }
      openExternalUrl(url)
    }
  }))
}

export function deactivate() {

}
