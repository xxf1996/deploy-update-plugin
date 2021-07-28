## @ym/deploy-update-plugin

一款用于前端项目部署更新检测和提示的插件；

## 适用于

- `webpack3/4`（`HTML Webpack Plugin` `2.0+`）
- `vite2.0+`

## API文档

### PluginOptions

```ts
/**
 * 插件选项
 */
interface PluginOptions {
  /** 轮询时间，单位：秒；默认为`10` */
  duration?: number;
  /**
   * 对比类型；
   * 
   * `version`：根据版本信息对比是否有更新
   * 
   * `time`：根据部署时间对比是否有更新
   */
  type: 'version' | 'time';
}
```

### DeployUpdatePlugin

```ts
function createDeployUpdatePlugin(pluginOption: PluginOptions): Plugin
```

适用于`webpack`打包部署，即`webpack`版的插件；

### createDeployUpdatePlugin

```ts
class DeployUpdatePlugin {
  constructor(pluginOption: PluginOptions);
}
```

适用于`vite`打包部署，即`vite/rollup`版的插件；

## 使用

### 创建webpack版本插件

```js
// vue.config.js 或 类似于webpack的配置文件
const { DeployUpdatePlugin } = require('@ym/deploy-update-plugin');
// ...

module.exports = {
  // ...
  configureWebpack: {
    plugins: [
      new DeployUpdatePlugin({
        type: 'time',
        duration: 10,
      }),
      // ...
    ],
  },
};
```

### 创建vite版本插件

```ts
// vite.config.js
import { createDeployUpdatePlugin } from '@ym/deploy-update-plugin';

export default defineConfig({
  // ...
  plugins: [
    createDeployUpdatePlugin({
      type: 'time',
      duration: 20,
    })
  ],
  // ...
})
```

### 应用内监听更新事件

该插件在根据配置检测到当前代码有更新时，会触发一个自定义事件：`deploy-updated`；因此只需要在全局（`window`对象）监听这个事件即可，如在`App.vue`文件件中监听该事件：

```js
// ...
export default defineComponent({
  name: 'App',
  created() {
    // ...
    window.addEventListener('deploy-updated', () => {
      ElMessage.info('内容有更新，请刷新页面！');
    });
  },
});
```

至于说监听到该事件要做出什么样的逻辑或者交互，很自由，不做耦合；


## 插件技术栈

- `TS`
- `tsup`：一款轻量级`TS bundler`，适合纯`TS`项目打包（参考自：[vite-plugin-style-import](https://github.com/anncwb/vite-plugin-style-import)）；
- `cheerio`：`node`端`DOM`处理库，类`jQuery`语法；

