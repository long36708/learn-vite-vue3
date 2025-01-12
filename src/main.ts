import { createApp } from 'vue'
import App from './App.vue'
import { setupModules } from './modules'

import { setupElementPlus } from './plugins'

import { setupRouter } from './router'
import { setupStore } from './store'
import '@unocss/reset/tailwind.css'
import './style/index.less'
import 'uno.css'

const app = createApp(App)

setupStore(app)
setupRouter(app)
setupModules(app)

setupElementPlus(app)
app.mount('#app')
