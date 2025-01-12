import { HstVue } from '@histoire/plugin-vue' /**
 * @Author: longmo
 * @Date: 2025-01-12 17:05:29
 * @LastEditTime: 2025-01-12 18:32:20
 * @FilePath: histoire.config.ts
 * @Description:
 */
import { defineConfig } from 'histoire'

export default defineConfig({
  plugins: [HstVue()],
  storyMatch: [
    // "../src/components/**/*.story.vue",
    // "../src/components/AButton/Button.story.vue",
    // '@ui/packages/ui/src/components/**/*.story.vue', // does not work
    './src/**/*.story.vue',
  ],
  setupFile: './histoire.setup.ts', // does not work
  markdown: md => {
    md.use(require('markdown-it-anchor').default)
    md.use(require('markdown-it-table-of-contents'), {
      includeLevel: [1, 2, 3, 4, 5],
    })
  },
})
