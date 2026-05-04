# VibeCraft 学生作品展示投票墙 - 设计文档

> 状态：🟡 设计中 → 开发中

## 1. 项目定位

为 VibeCraft 三天 AI 编程集训营（2026年5月1-3日）的 4 位创始成员创建作品展示投票墙。集中展示 Day 1 个人主页和 Day 2 产品 V1 的成果，供家长、同学、朋友浏览、留言、点赞互动。

## 2. 做给谁

- **主要用户**：VibeCraft 集训营的家长、同学、朋友
- **次要用户**：关注青少年 AI 教育的观众

## 3. 解决什么

4 位学生的作品分散在各自的 Netlify/Vercel 链接中，缺少一个集中展示+互动的窗口。投票墙将这些成果聚合在一页，提供统一的浏览和互动体验。

## 4. 核心功能

1. **学生作品展示墙** — 4 位学生各一张卡片，展示 Day 1 + Day 2 作品链接
2. **点赞投票** — 观众可为每位学生的作品点赞，实时显示票数
3. **留言互动** — 每位学生下方可留言评论（昵称 + 内容）
4. **VibeCraft 品牌视觉** — 像素风 UI，品牌 Logo + 配色方案
5. **v1 数据本地存储** — localStorage 持久化投票和留言
6. **v2 预留** — 后续接入后端数据库

## 5. 学生作品数据

| 学生 | Day 1 个人主页 | Day 2 产品 V1 | 状态 |
|------|---------------|--------------|------|
| Corum | https://corum-website.netlify.app/ | 大游戏 | 努力中 |
| Isaac | https://shiny-buttercream-a762db.netlify.app/ | https://escape-from-max-game.netlify.app/ | 已发布 |
| Langer | https://langer-homepage.netlify.app/ | https://langer-f1-game.netlify.app/ | 已发布 |
| Max | https://max-website-nine.vercel.app/ | https://haunted-village.vercel.app | 已发布 |

## 6. 品牌视觉

- **品牌主色**：VibeCraft 绿 `#00D97E`（像素风主色）
- **辅助色**：科技蓝 `#3B82F6`、活泼黄 `#FBBF24`、深色背景 `#1A1A2E`
- **字体**：中文圆体/手写体 + 英文等宽字体
- **Logo**：`VibeCraft_logo_主版.svg`（像素绿 VIBECRAFT + 蓝 STUDIO）
- **风格**：像素风 + 科技感 + 童趣，扁平化设计

## 7. 技术方案

- **v1（当前）**：纯 HTML/CSS/JS，纯前端，localStorage 持久化
- **v2（后续）**：接入后端数据库，支持跨设备数据同步

## 8. 文件结构

```
student-showcase/
├── DESIGN.md          # 设计文档
├── PROGRESS.md        # 进度记录
├── index.html         # 主页面
├── style.css          # 品牌样式
├── app.js             # 交互逻辑
├── data.js            # 学生数据配置
└── public/
    └── logo.svg       # VibeCraft 品牌 Logo
```

## 9. 数据模型

### localStorage 结构

```js
{
  "votes": {
    "corum": 12,
    "isaac": 8,
    "langer": 15,
    "max": 6
  },
  "voted": {
    "corum": true,   // 当前浏览器已投票的学生
    "isaac": false,
    ...
  },
  "comments": {
    "corum": [
      { "nickname": "家长A", "content": "太棒了！", "time": 1714800000000 },
      ...
    ],
    ...
  }
}
```

## 10. 页面结构

```
┌──────────────────────────────────────────┐
│  [Navbar · VibeCraft Logo + 标题]        │
├──────────────────────────────────────────┤
│                                          │
│   ┌────────┐  ┌────────┐               │
│   │ Corum  │  │ Isaac  │               │
│   │ Day1 ✓ │  │ Day1 ✓ │               │
│   │ Day2 🚧│  │ Day2 ✓ │               │
│   │ ♥ 12   │  │ ♥ 8    │               │
│   │ 💬 3   │  │ 💬 5   │               │
│   └────────┘  └────────┘               │
│                                          │
│   ┌────────┐  ┌────────┐               │
│   │ Langer │  │  Max   │               │
│   │ Day1 ✓ │  │ Day1 ✓ │               │
│   │ Day2 ✓ │  │ Day2 🚧│               │
│   │ ♥ 15   │  │ ♥ 6    │               │
│   │ 💬 7   │  │ 💬 2   │               │
│   └────────┘  └────────┘               │
│                                          │
├──────────────────────────────────────────┤
│  [Footer · VibeCraft Studio © 2026]     │
└──────────────────────────────────────────┘
```

## 11. 验收标准

- [ ] 4 位学生卡片全部展示，含 Day1 + Day2 链接
- [ ] Corum/Max Day2 显示"开发中"状态
- [ ] 点赞功能生效，每人限投 1 次（localStorage 记录）
- [ ] 留言功能生效，支持昵称 + 内容输入
- [ ] 像素风 UI + VibeCraft 品牌配色
- [ ] 页面在桌面和移动端均可正常浏览
