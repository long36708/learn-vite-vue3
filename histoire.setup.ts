import { defineSetupVue3 } from '@histoire/plugin-vue'
/**
 * @Author: longmo
 * @Date: 2025-01-12 17:07:14
 * @LastEditTime: 2025-01-12 17:14:08
 * @FilePath: histoire.setup.ts
 * @Description:
 */
import { createPinia } from 'pinia'
import { setupElementPlus } from './src/plugins'
import 'uno.css'
export const setupVue3 = defineSetupVue3(({ app, story, variant }) => {
  // Vue plugin
  app.use(createPinia())
  setupElementPlus(app)

  // Global component
  // app.component('GlobalComponent', MyGlobalComponent)

  // Global property
  // app.config.globalProperties.$t = key => translate(key)

  // Provide
  app.provide('demo', 'meow')
})
