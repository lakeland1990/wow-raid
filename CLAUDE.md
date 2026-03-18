# 魔兽世界团本攻略项目

本项目用于抓取和整理魔兽世界 12.0 资料片《Midnight》的团本攻略信息。

## 项目结构

```
wow-raid/
├── src/
│   └── scraper.js          # Playwright 抓取脚本
├── scripts/
│   ├── dev-server.js       # 开发预览服务器
│   ├── screenshot.js       # HTML 转图片
│   └── build-all.js        # 批量构建
├── .claude/skills/
│   └── wow-onepage/        # 攻略卡片生成 skill
│       ├── SKILL.md
│       └── scripts/generate-html.js
├── docs/
│   └── bosses/             # Boss 攻略目录
│       │
│       │── 虚空尖塔 (Voidspire)
│       ├── 01-元首阿福扎恩/
│       ├── 02-弗拉希乌斯/
│       ├── 03-堕落之王萨尔哈达尔/
│       ├── 04-威厄高尔和艾佐拉克/
│       ├── 05-光芒先锋军/
│       ├── 06-宇宙之冠/
│       │
│       │── 幽梦裂隙 (The Dreamrift)
│       ├── D1-奇美鲁斯/
│       │
│       │── 奎尔丹纳斯进军 (March on Quel'Danas)
│       ├── Q1-贝洛伦/
│       └── Q2-至暗之夜降临/
├── package.json
└── CLAUDE.md
```

## 团本信息

### 虚空尖塔 (Voidspire) - 6 个 Boss
| 序号 | 中文名 | 英文名 | 备注 |
|------|--------|--------|------|
| 1 | 元首阿福扎恩 | Imperator Averzian | 副本开门首领 |
| 2/3 | 弗拉希乌斯 | Vorasius | 巨型深渊掠食者 |
| 2/3 | 堕落之王萨尔哈达尔 | Fallen-King Salhadaar | 11.2 版本剧情人物 |
| 4 | 威厄高尔和艾佐拉克 | Vaelgor & Ezzorak | 双龙议会型 Boss |
| 5 | 光芒先锋军 | Lightblinded Vanguard | 守门首领，圣骑士议会风格 |
| 6 | 宇宙之冠 | Crown of the Cosmos | 虚空腐化的奥蕾莉亚 |

### 幽梦裂隙 (The Dreamrift) - 1 个 Boss
| 序号 | 中文名 | 英文名 | 备注 |
|------|--------|--------|------|
| 1 | 奇美鲁斯 | Chimaerus | 唯一 Boss |

### 奎尔丹纳斯进军 (March on Quel'Danas) - 2 个 Boss
| 序号 | 中文名 | 英文名 | 备注 |
|------|--------|--------|------|
| 1 | 贝洛伦 | Belo'ren, Child of Al'ar | 阿莱之子 |
| 2 | 至暗之夜降临 | Midnight Falls | L'ura |

## 使用方法

### 运行抓取脚本
```bash
node src/scraper.js
```

脚本会：
1. 访问 Wowhead 攻略页面
2. 下载所有可用的攻略图片
3. 使用 OCR 提取图片中的文字内容
4. 为每个 Boss 创建独立的目录和 README.md 文件

### 依赖
- Node.js
- Playwright (已配置为无头模式)

## 数据来源

- [Wowhead Midnight Season 1 Raid Cheat Sheets](https://www.wowhead.com/guide/midnight/raids/all-boss-cheat-sheets)

## 攻略卡片生成

项目支持将攻略 Markdown 转换为适合手机分享的 HTML 卡片。

### Skill: wow-onepage

将攻略 MD 转换为魔兽风格的 HTML 卡片：
```
/wow-onepage docs/bosses/01-元首阿福扎恩/README.md
```

输出：`docs/bosses/01-元首阿福扎恩/README.html`（同目录）

### 项目脚本 (scripts/)

| 脚本 | 功能 | 命令 |
|------|------|------|
| `dev-server.js` | 浏览器预览服务器 | `npm run dev` |
| `screenshot.js` | HTML 转图片 | `npm run screenshot <input.html> <output.png>` |
| `build-all.js` | 批量构建所有卡片 | `npm run build [输出目录]` |

### 预览服务器

```bash
npm run dev
```

访问 http://localhost:3000，可以看到所有攻略的文件列表，点击即可查看对应的 HTML。

## 注意事项

- 部分Boss（宇宙之冠、贝洛伦、至暗之夜降临）的攻略图片在 Wowhead 上显示 "Coming Soon"
- 脚本使用 Playwright 无头模式，无需桌面环境
- OCR 提取的内容为英文，已整理成中文格式
