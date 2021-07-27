/**
 * 插件选项
 */
export interface PluginOptions {
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

/** 部署信息 */
export interface DeployInfo {
  /** 当前版本号 */
  version: string;
  /** 部署时间戳 */
  deployTime: string;
}
