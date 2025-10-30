# 餐饮记账系统 - 前端

基于 Vue 3 + Vant 的移动端记账应用，支持每日消费记录与统计。

## 项目简介

面向手机端的轻量级记账应用，提供餐饮项目录入、总额计算、历史查询与个人统计展示。

## 功能特点

- 移动端优先与响应式布局
- 日期选择与记录管理
- 金额输入优化（小数点兼容、自动格式化）
- 与后端 API 对接，支持持久化与统计
- UI 简洁、交互直观

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI组件库**: Vant 4.6
- **构建工具**: Vite 4.3
- **HTTP客户端**: Axios
- **日期处理**: Day.js
- **样式预处理**: SCSS
- **状态管理**: Pinia (可选)

## 项目结构

```
meal-accounting/
├── src/
│   ├── components/          # 公共组件
│   │   └── MealItem.vue     # 餐饮项目组件
│   ├── views/               # 页面组件
│   │   └── MealRecord.vue   # 主页面
│   ├── api/                 # API接口
│   │   ├── request.ts       # 请求配置
│   │   └── meal.ts          # 餐饮API
│   ├── styles/              # 样式文件
│   │   └── index.scss       # 全局样式
│   ├── App.vue              # 根组件
│   └── main.ts              # 入口文件
├── package.json             # 依赖配置
├── vite.config.ts           # Vite配置
└── index.html               # HTML模板
```

## 快速开始

### 环境要求

- Node.js 16+
- npm 8+

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用

### 构建生产版本

```bash
npm run build
```

## 使用说明

1. **选择日期**：点击头部的日期输入框选择要记账的日期
2. **输入金额**：在对应的餐饮项目输入金额
   - 输入整数：10 → 显示10
   - 输入小数：10.5 → 显示10.50
3. **自动计算**：系统会自动计算总金额
4. **保存记录**：点击保存按钮，数据会保存到后端数据库
5. **查看历史**：切换日期可以查看不同日期的记账记录

## API 接口

项目需要配合后端API使用，主要接口：

- `POST /api/meal/save` - 保存餐饮记录
- `GET /api/meal/get/{date}` - 获取指定日期记录
- `DELETE /api/meal/delete/{date}` - 删除指定日期记录

## 界面说明

- **头部区域**：餐饮记账标题 + 日期选择
- **餐饮列表**：早饭、午饭、晚饭、零食、饮料、其他
- **总计区域**：显示总金额
- **保存按钮**：固定在底部

## 配置说明

### 后端API地址配置

在 `src/api/request.ts` 中修改API基础地址：

```typescript
const request = axios.create({
  baseURL: 'http://localhost:8080/api', // 修改为你的后端地址
  timeout: 10000
})
```

## 开发说明

### 添加新的餐饮项目

1. 在 `src/views/MealRecord.vue` 的 `meals` 数组中添加新项目
2. 确保后端API也支持新字段
3. 更新相关的数据处理逻辑

### 自定义样式

主要样式文件在 `src/styles/index.scss`，可以修改：
- 颜色主题
- 布局间距
- 组件样式

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件
- 微信联系

---

如该项目对你有帮助，欢迎 Star 支持。
