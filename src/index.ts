import { getSelection, message, openExternalUrl, registerCommand } from '@vscode-use/utils'
import { jsShell } from 'lazy-js-utils'
import type { ExtensionContext } from 'vscode'

export function activate(context: ExtensionContext) {
  const urlReg = /^https?:\/\/[^\s\/$.?#].[^\s]*$/gm
  context.subscriptions.push(registerCommand('vscode-open-pkg.openUrl', () => {
    const { selectedTextArray } = getSelection()!
    const title = selectedTextArray[0].replace(/['"\s]/g, '')
    if (/[\.\~\/]/.test(title)) {
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
