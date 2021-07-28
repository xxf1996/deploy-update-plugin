import { DeployInfo, PluginOptions } from './types'
import cheerio from 'cheerio'
import { resolve } from 'path'
import { writeFileSync } from 'fs'
import { checkCodeUpdate, getVersion } from './common'

/**
 * 生成部署信息文件并写入到输出目录
 * @param compiler webpack编译器实例
 * @param cb hook回调
 * @returns 
 */
function deployInfo(compiler, cb) {
  const outputPath: string = compiler.options?.output?.path // 打包输出目录
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
  }) // 写入json文件
  console.log('aftere-emit: 生成部署信息文件')
  cb()
}

/**
 * webpack v3
 * @param compiler webpack编译器实例
 * @param options 插件选项
 */
function v3(compiler, options: Required<PluginOptions>) {
  compiler.plugin('compilation', (compilation) => {
    // html-webpack-plugin v2
    // https://github.com/jantimon/html-webpack-plugin/tree/v2.30.1
    compilation.plugin('html-webpack-plugin-before-html-processing', (htmlPluginData, cb) => {
      const $ = cheerio.load(htmlPluginData.html)
      $('head').append(`<script type='text/javascript'>\n${checkCodeUpdate.toString()}\ncheckCodeUpdate(${JSON.stringify(options)});\n</script>`)
      htmlPluginData.html = $.html()
      cb(null, htmlPluginData)
      // console.log('测试')
    })
  })
  // 确保在所有chunk输出后生成文件
  compiler.plugin('after-emit', (compilation, cb) => {
    deployInfo(compiler, cb)
  })
}

/**
 * webpack v4+
 * @param compiler webpack编译器实例
 * @param options 插件选项
 */
function v4(compiler, options: Required<PluginOptions>) {
  compiler.hooks.compilation.tap(
    'DeployUpdatePlugin',
    (compilation) => {
      let alterAssetTagGroupsHook = compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing // 版本低于4.0时的钩子
      // console.log('hooks', compilation.hooks)
      if (!alterAssetTagGroupsHook) { // 版本高于4.0时
        const [HtmlWebpackPlugin] = compiler.options.plugins.filter(
          (plugin) => plugin.constructor.name === 'HtmlWebpackPlugin') // 从webpack注册插件中获取HtmlWebpackPlugin实例
          // console.log('DeployUpdatePlugin', HtmlWebpackPlugin)
        alterAssetTagGroupsHook = HtmlWebpackPlugin.constructor.getHooks(compilation).beforeEmit // 4.0及以上钩子，参数结构略有差异
      }
      // console.log('事实上：', alterAssetTagGroupsHook)
      alterAssetTagGroupsHook.tapAsync(
        'DeployUpdatePlugin',
        (data, cb) => {
          const $ = cheerio.load(data.html)
          $('head').append(`<script type='text/javascript'>\n${checkCodeUpdate.toString()}\ncheckCodeUpdate(${JSON.stringify(options)});\n</script>`)
          data.html = $.html()
          cb(null, data)
        }
      )
    }
  )
  // 确保在所有chunk输出后生成文件
  compiler.hooks.afterEmit.tap(
    'DeployUpdatePlugin',
    (compilation, cb = () => {}) => {
      deployInfo(compiler, cb)
    }
  )
}

/**
 * 创建部署更新插件（webpack版）
 * @param pluginOption 插件选项
 */
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
      v4(compiler, this.options)
    } else { // webpack3; https://webpack-v3.netlify.app/api/compiler/#event-hooks
      v3(compiler, this.options)
    }
  }
}
