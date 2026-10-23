# 智味菜谱 · Zhiwei Food

> 一个基于微信云开发的菜谱管理与饭局点菜小程序

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)
[![Miniprogram](https://img.shields.io/badge/miniprogram-原生%20TypeScript-green)](https://developers.weixin.qq.com/miniprogram/dev/framework/)
[![CloudBase](https://img.shields.io/badge/cloudbase-%E5%BE%AE%E4%BF%A1%E4%BA%91%E5%BC%80%E5%8F%91-blue)](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

## 项目简介

「智味菜谱」是一个面向家庭与小型聚会场景的微信小程序，核心解决两个问题：

1. **菜谱管理** —— 记录菜名、食材、做法、步骤，按分类归档，支持公开/私密。
2. **饭局点菜** —— 发起人分享小程序链接给好友，好友进入同一饭局，从发起人共享的菜单里各自点菜、各自提交订单，发起人负责结束饭局。

项目采用 **微信小程序原生框架 + TypeScript 严格模式 + 微信云开发（云函数 / 云数据库 / 云存储）** 的全栈方案，无需自建服务器，开箱即用。

---

## 功能特性（MVP）

### 🍳 厨房模块
- 菜谱列表：按分类筛选、关键词搜索、全部/我的切换
- 分类管理：7 个默认分类（荤菜/素菜/鱼虾海鲜/汤羹/凉菜/主食/甜品），可增删改排序
- 菜谱编辑：菜名、封面图、简介、分类、难度（1~5 星）、用时、份量、食材（动态增删+单位）、步骤（动态增删+步骤图）、小贴士、口味标签、场景标签、公开开关
- 菜谱详情：浏览计数、作者信息、编辑/删除（仅作者）、分享、加入购物车
- 按食材配菜：输入或快捷选择食材，智能匹配已有菜谱，显示匹配度与缺少食材

### 🛒 购物车与订单
- 个人购物车：数量步进、备注、删除、合计、提交订单
- 订单列表：按状态筛选（全部/待确认/制作中/已完成）、分页加载、饭局订单标识
- 订单详情：状态卡片、菜品明细（含「来自 xxx」）、参与者、状态流转（待确认→制作中→已完成 / 取消）

### 🍽️ 饭局点菜（多人协作）
- 发起人点击「邀请下单」→ 创建饭局 → 弹出分享面板 → 分享给好友
- 好友点开链接 → 自动加入饭局 → 浏览发起人共享的菜谱 → 加菜
- 所有人实时看到已点菜品（按加菜人分组，3 秒轮询刷新）
- 每个人只能删除自己加的菜，各自提交自己的订单
- 发起人负责结束饭局
- 订单可在主页「订单」tab 查看

### 👤 我的
- 用户资料：微信头像快速填写、昵称、个人简介
- 我的菜谱统计
- 分类管理、按食材配菜、清除缓存、关于

---

## 技术栈

| 分类 | 技术 |
|---|---|
| 小程序框架 | 微信原生小程序（WXML / WXSS / JS） |
| 开发语言 | TypeScript（严格模式 `strict: true`，`target: ES2020`） |
| 组件框架 | glass-easel |
| 渲染引擎 | Skyline（`skylineRenderEnable: true`） |
| 后端 | 微信云开发（CloudBase）：云函数 + 云数据库 + 云存储 |
| 云函数 SDK | `wx-server-sdk` |
| 类型定义 | `miniprogram-api-typings` |

---

## 项目结构

```
zhiwei_food/
├── miniprogram/                  # 小程序前端
│   ├── pages/                    # 页面（每页四件套：ts/wxml/wxss/json）
│   │   ├── kitchen/              # 厨房首页（菜谱列表 + 邀请下单）
│   │   ├── recipe-edit/          # 菜谱新增/编辑
│   │   ├── recipe-detail/        # 菜谱详情
│   │   ├── category-manage/      # 分类管理
│   │   ├── match/                # 按食材配菜
│   │   ├── cart/                 # 购物车
│   │   ├── dinner-party/         # 饭局点菜（多人协作）
│   │   ├── order-list/           # 订单列表（tabBar）
│   │   ├── order-detail/         # 订单详情
│   │   └── profile/              # 我的（tabBar）
│   ├── components/               # 自定义组件
│   │   ├── recipe-card/          # 菜谱卡片
│   │   └── empty-state/          # 空状态
│   ├── services/                 # 服务层（封装云函数调用）
│   │   ├── recipe.ts             # 菜谱与分类
│   │   ├── order.ts              # 购物车/订单/饭局
│   │   └── user.ts               # 用户
│   ├── types/                    # TypeScript 类型定义
│   │   ├── recipe.ts
│   │   ├── order.ts
│   │   └── user.ts
│   ├── utils/                    # 工具函数
│   │   ├── request.ts            # callFunction 封装 / 图片上传
│   │   ├── constants.ts          # 全局常量
│   │   └── format.ts             # 时间格式化
│   ├── app.ts / app.json / app.wxss
│   └── sitemap.json
├── cloudfunctions/               # 云函数（每个含 index.js + package.json）
│   ├── initDatabase/             # 初始化数据库集合
│   ├── userManage/               # 用户登录/资料
│   ├── recipeCRUD/               # 菜谱与分类增删改查
│   ├── orderManage/              # 购物车/订单/饭局
│   └── matchRecipe/              # 按食材匹配菜谱
├── docs/                         # 项目文档
│   ├── 需求分析文档.md
│   ├── 开发文档.md
│   └── MVP部署指南.md
├── typings/                      # 小程序 API 类型声明
├── project.config.json           # 开发者工具项目配置
├── tsconfig.json                 # TypeScript 配置（严格模式）
└── package.json
```

---

## 快速开始

### 环境要求

- 微信开发者工具（稳定版）
- Node.js 14+（用于云函数本地调试，非必需）
- 一个微信小程序账号（个人开发者即可，需开通云开发）

### 1. 导入项目

1. 克隆仓库到本地
2. 打开微信开发者工具 → 导入项目
3. 选择项目根目录，AppID 填你自己的小程序 AppID
4. 打开项目后，在 `project.config.json` 中确认 `appid` 字段

### 2. 开通云开发并配置环境 ID

1. 开发者工具顶部点击 **「云开发」**，开通云开发服务
2. 在云开发控制台左上角复制 **环境 ID**
3. 复制 `miniprogram/config.example.ts` 为 `miniprogram/config.ts`，填入你的环境 ID：

```ts
// miniprogram/config.ts（已被 .gitignore 忽略，不会提交）
export const CLOUD_ENV = '你的云环境ID'
```

> `config.ts` 是本地私有配置，仓库中不包含。云函数端已使用 `cloud.DYNAMIC_CURRENT_ENV`，会自动跟随小程序端环境，无需修改。

### 3. 部署云函数

在开发者工具左侧 `cloudfunctions/` 目录下，对每个云函数文件夹右键，选择 **「上传并部署：云端安装依赖（不上传 node_modules）」**，共 5 个：

- `initDatabase`
- `userManage`
- `recipeCRUD`
- `orderManage`
- `matchRecipe`

验证：云开发控制台 → 云函数列表中能看到这 5 个函数。

### 4. 初始化数据库

在云开发控制台 → 云函数 → 点击 `initDatabase` → **「云端测试」** 运行一次，创建全部数据集合。

成功后控制台会返回：

```json
{ "code": 0, "data": { "created": [...], "existed": [...] }, "msg": "ok" }
```

### 5. 编译运行

点击开发者工具的「编译」按钮，即可在模拟器中运行。首次进入会自动调用云函数完成登录（创建用户记录与默认分类）。

---

## 云函数说明

所有云函数统一返回格式：

```json
{ "code": 0, "data": { ... }, "msg": "ok" }   // 成功
{ "code": 1, "data": null, "msg": "错误信息" }  // 失败
```

通过 `event.action` 字段路由不同操作。

### initDatabase
| 功能 | 说明 |
|---|---|
| 初始化 | 批量创建 10 个集合，已存在的忽略 |

### userManage
| action | 说明 |
|---|---|
| `login` | 取 OPENID，不存在则创建用户（默认昵称「美食爱好者」+ 7 个默认分类） |
| `updateProfile` | 更新昵称、头像、简介 |
| `getProfile` | 获取当前用户资料 |

### recipeCRUD
| action | 说明 |
|---|---|
| `getCategories` | 获取当前用户全部分类 |
| `saveCategory` | 新增/更新分类 |
| `deleteCategory` | 删除分类（校验属主，该分类下菜谱 categoryId 置空） |
| `createRecipe` | 新增菜谱（msgSecCheck 内容安全校验、分类计数 +1） |
| `updateRecipe` | 更新菜谱（仅作者） |
| `deleteRecipe` | 删除菜谱（仅作者，分类计数 -1） |
| `getRecipeList` | 菜谱列表（支持分类/关键词/全部·我的筛选、分页） |
| `getRecipeDetail` | 菜谱详情（浏览计数 +1，私密菜谱仅作者可见） |

### orderManage
| action | 说明 |
|---|---|
| `addToCart` | 加入购物车（冗余菜谱标题/封面/加菜人） |
| `updateCart` | 更新数量/备注（仅属主） |
| `removeFromCart` | 移除购物车项（仅属主） |
| `getCartList` | 购物车列表（支持 partyId 过滤） |
| `createOrder` | 创建订单（个人或饭局，支持 `onlyMine` 仅提交自己点的） |
| `getOrderList` | 订单列表（支持状态/饭局筛选、分页） |
| `getOrderDetail` | 订单详情 |
| `updateOrderStatus` | 更新订单状态（状态机校验：pending→cooking\|cancelled，cooking→done） |
| `createParty` | 创建饭局 |
| `enterParty` | 加入饭局（按 partyId 自动加入） |
| `getPartyDetail` | 饭局详情 + 已点菜品 + 发起人菜谱池 |
| `getMyParties` | 我发起的饭局列表 |
| `closeParty` | 结束饭局（仅发起人） |

### matchRecipe
| action | 说明 |
|---|---|
| `matchByIngredients` | 按食材匹配菜谱（小写归一化，交集匹配度排序，取前 50） |

---

## 数据库集合

| 集合 | 说明 |
|---|---|
| `users` | 用户资料（openid、昵称、头像、简介、统计） |
| `recipes` | 菜谱（含食材、步骤、标签、公开状态、浏览/点赞/收藏计数） |
| `categories` | 分类（名称、图标、排序、菜谱数） |
| `carts` | 购物车项（含 partyId 区分个人/饭局，addedBy 标记加菜人） |
| `orders` | 订单（订单号、菜品明细、状态、参与者、关联饭局） |
| `dinner_parties` | 饭局（标题、参与者、状态、创建者） |
| `favorites` | *预留：收藏* |
| `posts` | *预留：厨神圈动态* |
| `comments` | *预留：评论* |
| `fridge_items` | *预留：冰箱食材* |

### 建议索引

| 集合 | 索引字段 |
|---|---|
| `users` | `_openid`（唯一） |
| `recipes` | `_openid` + `isPublic` + `createdAt` |
| `categories` | `_openid` + `sort` |
| `carts` | `_openid` + `partyId` |
| `orders` | `_openid` + `status`，`orderNo`（唯一） |
| `dinner_parties` | `_openid` + `status` |

---

## 页面说明

| 页面 | 路径 | 说明 |
|---|---|---|
| 厨房 | `pages/kitchen/kitchen` | 菜谱列表 + 分类筛选 + 搜索 + 邀请下单 |
| 菜谱编辑 | `pages/recipe-edit/recipe-edit` | 新增/编辑菜谱（`?id=` 区分） |
| 菜谱详情 | `pages/recipe-detail/recipe-detail` | 菜谱展示 + 加购 + 分享 |
| 分类管理 | `pages/category-manage/category-manage` | 分类增删改排序 |
| 按食材配菜 | `pages/match/match` | 输入食材匹配菜谱 |
| 购物车 | `pages/cart/cart` | 个人购物车 + 提交订单 |
| 饭局点菜 | `pages/dinner-party/dinner-party` | 多人协作点菜（`?id=` 房间 / 默认 hub） |
| 订单列表 | `pages/order-list/order-list` | 订单列表（tabBar，支持 `?partyId=` 饭局筛选） |
| 订单详情 | `pages/order-detail/order-detail` | 订单状态流转 |
| 我的 | `pages/profile/profile` | 用户资料 + 菜单入口 |

---

## 开发规范

### TypeScript 严格模式
- `strict: true`、`strictNullChecks`、`noImplicitAny`、`noUnusedLocals`、`noUnusedParameters`、`noUnusedReturns`、`noFallthroughCasesInSwitch`
- `catch` 变量必须使用（如 `console.warn(e)`）
- 事件处理器参数统一用 `(e: any)`
- 列表 `wx:key` 优先使用业务属性（`_id` / `name` / `order` / `recipeId`）

### 服务层约定
- 所有云函数调用统一走 [utils/request.ts](miniprogram/utils/request.ts) 的 `callFunction<T>(name, data)`，自动处理 `code != 0` 的 toast 提示
- 图片上传统一走 `uploadImage(filePath)` → 返回 `fileID`，路径规范 `uploads/{openid}/{ts}_rand.jpg`

### 全局样式
- 主色 `#FF6B35`（通过 CSS 变量 `--primary` 定义）
- 通用类：`.card` / `.btn-primary` / `.btn-plain` / `.tag` / `.divider` / `.section-title` / `.loading-tip`
- 底部固定栏模式：`.footer` + `.bottom-space` 占位，自适应安全区

---

## 路线图（Roadmap）

MVP 已完成的功能：菜谱管理、分类管理、按食材配菜、购物车、订单、饭局多人点菜。

后续规划（按优先级）：

- [ ] **厨神圈** —— 分享菜谱与制作过程，评论互动，筛选优质做法
- [ ] **收藏与点赞** —— 菜谱收藏、点赞、浏览排行榜
- [ ] **冰箱食材管理** —— 记录家中现有食材，过期提醒
- [ ] **联网搜索做法** —— 参考小红书等平台，按点赞/收藏筛选，抓取无版权图片视频
- [ ] **AI 生成菜谱** —— 输入食材由大模型生成菜谱
- [ ] **订单打印/导出** —— 饭局结束后导出菜单清单
- [ ] **多端支持** —— 支付宝 / 抖音小程序

---

## 常见问题

**Q: 报 `FunctionName parameter could not be found` 错误？**
A: 云函数未部署。请按「快速开始」第 3 步上传部署 5 个云函数。

**Q: 报 `collection not exists` 错误？**
A: 数据库未初始化。请运行 `initDatabase` 云函数创建集合。

**Q: 新建的菜谱在分类里看不到？**
A: 请确认编辑菜谱时选择了分类。未选分类的菜谱只会出现在「全部」列表中。

**Q: 饭局里加菜提示「发起人没有菜单」？**
A: 请确认发起人账号下已创建菜谱。饭局共享的是发起人的全部菜谱（含私密）。

**Q: 真机分享后好友打不开？**
A: 请确认小程序已发布体验版或正式版，且分享路径 `pages/dinner-party/dinner-party?id=xxx` 正确。

---

## 文档

- [需求分析文档](docs/需求分析文档.md)
- [开发文档](docs/开发文档.md)
- [MVP 部署指南](docs/MVP部署指南.md)

---

## 贡献指南

欢迎 Issue 和 PR！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/xxx`
3. 提交更改：`git commit -m 'feat: xxx'`
4. 推送分支：`git push origin feature/xxx`
5. 发起 Pull Request

提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：`feat` / `fix` / `docs` / `refactor` / `chore` 等。

---

## License

[MIT](LICENSE)

自由使用、修改、分发。如对您有帮助，欢迎 Star ⭐
