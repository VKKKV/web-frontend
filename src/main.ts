// import type { UserModule } from './types'
// import { ViteSSG } from 'vite-ssg'

// import "~/styles/element/index.scss";

import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// or use cdn, uncomment cdn link in `index.html`

import ElementPlus from 'element-plus'
// if you do not need ssg:
import { createApp } from 'vue'
import App from './App.vue'

import router from './router'
// import all element css, uncommented next line
import 'element-plus/dist/index.css'
import '~/styles/index.scss'

import 'uno.css'
// If you want to use ElMessage, import it.
import 'element-plus/theme-chalk/src/message.scss'
import 'element-plus/theme-chalk/src/message-box.scss'

const app = createApp(App)
app.use(router)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.mount('#app')

// https://github.com/antfu/vite-ssg
// export const createApp = ViteSSG(
//   App,
//   {
//     routes,
//     base: import.meta.env.BASE_URL,
//   },
//   (ctx) => {
//     // install all modules under `modules/`
//     Object.values(import.meta.glob<{ install: UserModule }>('./modules/*.ts', { eager: true }))
//       .forEach(i => i.install?.(ctx))
//     // ctx.app.use(Previewer)
//   },
// )
