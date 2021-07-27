import { DeployInfo, PluginOptions } from './types'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * 检测部署的代码是否有更新
 * @param options 插件选项
 * @param key 存储部署信息的storage key
 */
export function checkCodeUpdate(options: Required<PluginOptions>, key = '__deploy-info__') {
  /** 触发部署更新事件 */
  const emitEvent = () => {
    const updateEvent = new Event('deploy-updated', {
      bubbles: true,
      cancelable: false
    })
    document.body.dispatchEvent(updateEvent)
  }
  const flag = setInterval(() => {
    // 更新参数，避免缓存
    fetch(`/deploy-info.json?t=${Date.now()}`, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res) => res.json())
      .then((info: DeployInfo) => { // 获取最新的部署信息
        const prevInfo = localStorage.getItem(key)
        if (!prevInfo) {
          localStorage.setItem(key, options.type === 'time' ? info.deployTime : info.version)
          return
        }
        if (prevInfo === info.deployTime) {
          return
        }
        emitEvent()
        localStorage.setItem(key, options.type === 'time' ? info.deployTime : info.version)
      })
  }, options.duration * 1000) // 轮询检测
  // window.addEventListener('deploy-updated', () => {
  //   console.log('代码更新了~~~~~~')
  // })
  window.addEventListener('unload', () => {
    window.clearInterval(flag) // 清除定时
  })
}

/**
 * 获取项目的版本号
 * @param root 项目根路径
 * @returns 
 */
export function getVersion(root: string): string {
  const packageInfo = JSON.parse(readFileSync(resolve(root, 'package.json')).toString('utf-8'))
  return packageInfo.version || 'none'
}
