/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module './router' {
  import { Router } from 'vue-router'
  const router: Router
  export default router
}

declare module '~/router' {
  import { Router } from 'vue-router'
  const router: Router
  export default router
}
