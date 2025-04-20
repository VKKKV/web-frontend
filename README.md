# 股票交易平台前端项目

> 基于 Vue 3 + Element Plus + Vite 构建的证券交易系统前端

![项目截图]()

## 技术栈

- 前端框架: Vue 3 + TypeScript
- UI 组件库: Element Plus
- 构建工具: Vite
- 状态管理: Pinia
- 路由管理: Vue Router
- HTTP 客户端: Axios
- 图表库: Klinecharts

## 功能特性

- 📈 实时股票行情展示（K线图）
- 💹 模拟股票买卖交易功能
- 🔐 用户认证系统（登录/注册）
- 📱 响应式布局

## 项目结构

```bash
src/
├── api/            # API 接口配置
├── assets/         # 静态资源
├── components/     # 通用组件
│   └── layouts/    # 页面布局组件
├── composables/    # Vue 组合式API
├── pages/          # 页面组件
│   ├── Login.vue   # 登录页面
│   ├── MarketData.vue # 行情页面
│   └── Trade.vue   # 交易页面
├── router/         # 路由配置
├── styles/         # 全局样式
└── utils/          # 工具函数
```

## 快速开始

### 环境要求

- Node.js ≥ 16.x
- pnpm ≥ 7.x

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 生产构建

```bash
pnpm build
```

### 代码规范检查

```bash
pnpm lint
```

## 配置说明

1. 复制环境变量模板文件：
```bash
cp .env.example .env
```
2. 修改 `.env` 文件中的 API 端点配置

## 许可证

[MIT License](LICENSE)
