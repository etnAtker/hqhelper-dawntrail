import type { ItemPriceInfo } from "@/tools/item"

export interface UserConfigModel {
  // general
  language_ui: 'zh' | 'en' | 'ja'
  language_item: 'auto' | 'zh' | 'en' | 'ja'
  item_server: 'auto' | 'chs' | 'global'
  // appearance
  theme: 'light' | 'dark' | 'system'
  custom_font: string
  custom_font_size: string
  hide_collector_icons: boolean
  // enhancements
  use_overlay_gatherclock: boolean
  disable_patchcard_autofold: boolean
  disable_jobbtn_doubleclick: boolean
  use_traditional_statement: boolean
  click_to_show_pop_in_span: boolean
  macro_direct_copy: boolean
  macro_copy_prefix: string
  item_button_click_event: 'none' | 'copy_name' | 'copy_isearch'
  item_info_icon_click_event: 'none' | 'copy_name' | 'copy_isearch'
  // performance
  disable_workstate_cache: boolean
  // special
  universalis_server: string
  universalis_priceType: 'averagePrice' | 'currentAveragePrice' | 'minPrice' | 'maxPrice' | 'marketLowestPrice' | 'marketPrice' | 'purchasePrice'
  universalis_expireTime: number
  // update
  disable_auto_update: boolean
  
  // check-update
  github_mirror_site: string

  // tome-script-button
  /** 在点数按钮的统计中显示双色宝石兑换物 */
  tomescript_show_bicolor_items: boolean

  // craft-statements
  statement_show_item_details: boolean

  // hidden options
  cache_lasttime_version: string
  cache_ui_fold: any
  cache_work_state: any
  cache_item_prices: Record<number, ItemPriceInfo>
  fthelper_cache_work_state: any
  gatherclock_cache_work_state: any
}

// eslint-disable-next-line no-var
const defaultUserConfig: UserConfigModel = {
  // general
  language_ui: 'zh',
  language_item: 'auto',
  item_server: 'auto',
  // appearance
  theme: 'light',
  custom_font: '',
  custom_font_size: '14px',
  hide_collector_icons: false,
  // enhancements
  use_overlay_gatherclock: false,
  disable_patchcard_autofold: false,
  disable_jobbtn_doubleclick: false,
  use_traditional_statement: false,
  click_to_show_pop_in_span: false,
  macro_direct_copy: false,
  macro_copy_prefix: '',
  item_button_click_event: 'none',
  item_info_icon_click_event: 'none',
  // performance
  disable_workstate_cache: false,
  // special
  universalis_server: '红玉海',
  universalis_priceType: 'averagePrice',
  universalis_expireTime: 6 * 60 * 60 * 1000, // 默认6小时
  // update
  disable_auto_update: false,
  
  // check-update
  github_mirror_site: 'https://mirror.ghproxy.com',
  
  // tome-script-button
  tomescript_show_bicolor_items: false,

  // craft-statements
  statement_show_item_details: true,

  // hidden options
  cache_lasttime_version: 'none',
  cache_ui_fold: {}, // active cache, { key:string -> value:boolean }
  cache_work_state: {}, // active cache, view struct in `MainPage.vue` 's `workState`
  cache_item_prices: {},
  fthelper_cache_work_state: {},
  gatherclock_cache_work_state: {}
}

/**
 * 修正用户配置，将其合并到默认配置中
 * 如果用户配置中有未定义的字段，则会使用默认配置中的值覆盖
 * 这样可以在添加配置项后保持对旧版本缓存的兼容性
 * @param config 传入缓存中的用户配置：`store.state.userConfig`
 * @returns 修正后的用户配置
 */
export const fixUserConfig = (config?: UserConfigModel) => {
  // 处理特定环境下的设置项
  if (!config) {
    config = {} as UserConfigModel

    // 用户初次访问时，尝试根据系统语言自动设置UI语言
    const systemLanguage = navigator?.language ?? ''
    if (systemLanguage?.startsWith('en')) {
      config.language_ui = 'en'
    } else if (systemLanguage.startsWith('ja')) {
      config.language_ui = 'ja'
    }
  }
  
  // 处理其他的设置项
  return assignDefaults(defaultUserConfig, config || {}) as UserConfigModel

  function assignDefaults(defaultConfig: any, currentConfig: any): any {
    for (const key in defaultConfig) {
      if (Object.prototype.hasOwnProperty.call(defaultConfig, key)) {
        if (typeof defaultConfig[key] === 'object' && !Array.isArray(defaultConfig[key]) && defaultConfig[key] !== null) {
          currentConfig[key] = assignDefaults(defaultConfig[key], currentConfig[key] || {});
        } else {
          currentConfig[key] = currentConfig[key] !== undefined ? currentConfig[key] : defaultConfig[key];
        }
      }
    }
    return currentConfig;
  }
}