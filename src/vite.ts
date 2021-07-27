import type { Plugin, HtmlTagDescriptor } from 'vite'
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { PluginOptions, DeployInfo } from './types'
import { checkCodeUpdate, getVersion } from './common'

/**
 * 创建部署更新插件（vite版）
 * @param pluginOption 插件选项
 * @returns 
 */
export function createDeployUpdatePlugin (pluginOption: PluginOptions): Plugin {
  let config: Parameters<Required<Plugin>['configResolved']>[0] | undefined
  let options: PluginOptions = Object.assign({
    duration: 30,
    version: 'none',
    type: 'time'
  }, pluginOption)
  return {
    name: 'vite:deploy-update',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    transformIndexHtml(html, ctx) {
      const test: HtmlTagDescriptor = {
        tag: 'script',
        attrs: {
          type: 'text/javascript',
        },
        children: `\n${checkCodeUpdate.toString()}\ncheckCodeUpdate(${JSON.stringify(options)});\n`,
        injectTo: 'head'
      } // 在生成的入口文件中加入轮询检测逻辑
      return [test]
    },
    closeBundle() {
      const outputPath = resolve(config?.root || process.cwd(), 'dist', 'deploy-info.json')
      const info: DeployInfo = {
        version: getVersion(outputPath.split('dist')[0]),
        deployTime: String(Date.now())
      }
      console.log('closeBundle: 生成部署信息文件')
      writeFileSync(outputPath, JSON.stringify(info, null, 2), {
        encoding: 'utf-8'
      })
    },
    enforce: 'post',
    apply: 'build'
  }
}