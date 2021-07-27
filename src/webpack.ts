import { DeployInfo, PluginOptions } from './types'
import cheerio from 'cheerio'
import { resolve } from 'path'
import { writeFileSync } from 'fs'
import { checkCodeUpdate, getVersion } from './common'

export class DeployUpdatePlugin {
  private options: Required<PluginOptions>
  constructor(pluginOption: PluginOptions) {
    this.options = Object.assign({
      duration: 30,
      version: 'none',
      type: 'time'
    }, pluginOption)
  }

  apply(compiler) {
    // console.log('compiler', compiler)
    if (compiler.hooks) { // webpack4及以上

    } else { // webpack3; https://webpack-v3.netlify.app/api/compiler/#event-hooks
      compiler.plugin('compilation', (compilation) => {
        // html-webpack-plugin v2
        // https://github.com/jantimon/html-webpack-plugin/tree/v2.30.1
        compilation.plugin('html-webpack-plugin-before-html-processing', (htmlPluginData, cb) => {
          const $ = cheerio.load(htmlPluginData.html)
          $('head').append(`<script type='text/javascript'>\n${checkCodeUpdate.toString()}\ncheckCodeUpdate(${JSON.stringify(this.options)});\n</script>`)
          htmlPluginData.html = $.html()
          cb(null, htmlPluginData)
          // console.log('测试')
        })
      })
      compiler.plugin('after-emit', (compilation, cb) => {
        const outputPath: string = compiler.options?.output?.path
        if (!outputPath) {
          console.log('找不到输出目录')
          cb()
          return
        }
        const info: DeployInfo = {
          version: getVersion(outputPath.split('dist')[0]),
          deployTime: String(Date.now())
        }
        writeFileSync(resolve(outputPath, 'deploy-info.json'), JSON.stringify(info, null, 2), {
          encoding: 'utf-8'
        })
        console.log('aftere-emit: 生成部署信息文件')
        cb()
      })
    }
    // compiler.hooks.compilation.tap(
    //   'DeployUpdatePlugin',
    //   (compilation) => {
    //     let alterAssetTagGroupsHook = compilation.hooks.htmlWebpackPluginAlterAssetTags // 版本低于4.0时的钩子
    //     if (!alterAssetTagGroupsHook) { // 版本高于4.0时
    //       const [HtmlWebpackPlugin] = compiler.options.plugins.filter(
    //         (plugin) => plugin.constructor.name === 'HtmlWebpackPlugin') // 从webpack注册插件中获取HtmlWebpackPlugin实例
    //       alterAssetTagGroupsHook = HtmlWebpackPlugin.constructor.getHooks(compilation).afterTemplateExecution // 4.0及以上钩子，参数结构略有差异
    //     }
    //     console.log('事实上：', alterAssetTagGroupsHook)
    //   }
    // )
  }
}
