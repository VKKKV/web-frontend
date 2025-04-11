import path from 'node:path'
import Vue from '@vitejs/plugin-vue'

import Unocss from 'unocss/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import VueRouter from 'unplugin-vue-router/vite'

import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "~/styles/element/index.scss" as *;`,
        api: 'modern-compiler',
      },
    },
  },

  plugins: [
    Vue(),

    // https://github.com/posva/unplugin-vue-router
    VueRouter({
      extensions: ['.vue', '.md'],
      dts: 'src/typed-router.d.ts',
    }),

    Components({
      // allow auto load markdown components under `./src/components/`
      extensions: ['vue', 'md'],
      // allow auto import and register components used in markdown
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass',
        }),
      ],
      dts: 'src/components.d.ts',
    }),

    // https://github.com/antfu/unocss
    // see uno.config.ts for config
    Unocss(),
  ],

  // 添加WebSocket代理配置
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: path => path,
      },
      '/stock-api': {
        target: 'https://你的股票接口域名',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/stock-api/, ''),
        headers: {
          // 部分接口需要伪造浏览器头
          'User-Agent': 'Mozilla/5.0',
        },
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            // 强制添加CORS头（紧急方案）
            proxyRes.headers['access-control-allow-origin'] = '*'
            proxyRes.headers['access-control-allow-methods'] = 'GET'
          })
        },
      },
    },
  },

  ssr: {
    // TODO: workaround until they support native ESM
    noExternal: ['element-plus'],
  },
})
