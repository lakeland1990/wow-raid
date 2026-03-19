# WoW Midnight 团本攻略

魔兽世界 12.0 资料片《Midnight》团本攻略整理与卡片生成工具。

## 团本 Boss 列表

### 虚空尖塔 (Voidspire)

| 序号 | 中文名 | 英文名 |
|------|--------|--------|
| 1 | 元首阿福扎恩 | Imperator Averzian |
| 2 | 弗拉希乌斯 | Vorasius |
| 3 | 堕落之王萨尔哈达尔 | Fallen-King Salhadaar |
| 4 | 威厄高尔和艾佐拉克 | Vaelgor & Ezzorak |
| 5 | 光芒先锋军 | Lightblinded Vanguard |
| 6 | 宇宙之冠 | Crown of the Cosmos |

### 幽梦裂隙 (The Dreamrift)

| 序号 | 中文名 | 英文名 |
|------|--------|--------|
| 1 | 奇美鲁斯 | Chimaerus |

### 奎尔丹纳斯进军 (March on Quel'Danas)

| 序号 | 中文名 | 英文名 |
|------|--------|--------|
| 1 | 贝洛伦 | Belo'ren, Child of Al'ar |
| 2 | 至暗之夜降临 | Midnight Falls |

## 安装

```bash
npm install
```

## 使用方法

### 预览攻略卡片

```bash
npm run dev
```

访问 http://localhost:3000 查看所有攻略 HTML 卡片。

### 生成单个攻略卡片

```bash
npm run generate docs/bosses/01-元首阿福扎恩/README.md
```

### HTML 转图片

```bash
npm run screenshot <input.html> <output.png>
```

### 批量构建所有卡片

```bash
npm run build
```

### 构建 GitHub Pages 发布版本

```bash
npm run build:gh
```

生成 `dist/` 目录，包含首页和所有攻略 HTML（带返回按钮）。

### 部署到 GitHub Pages

```bash
# 1. 构建
npm run build:gh

# 2. 进入 dist 目录，初始化 git 并推送
cd dist
git init -b main
git add .
git commit -m "deploy"
git remote add origin https://github.com/<用户名>/wow-raid.git
git push -f origin main:gh-pages

# 3. 清理
rm -rf .git
cd ..
```

然后在 GitHub 仓库设置中启用 Pages，选择 `gh-pages` 分支。

访问地址：`https://<用户名>.github.io/wow-raid/`

## 项目结构

```
wow-raid/
├── docs/bosses/           # Boss 攻略目录
│   ├── 01-元首阿福扎恩/
│   ├── 02-弗拉希乌斯/
│   └── ...
├── scripts/
│   ├── dev-server.js      # 开发服务器
│   ├── screenshot.js      # HTML 转图片
│   └── build-all.js       # 批量构建
├── src/
│   └── scraper.js         # Wowhead 抓取脚本
└── .claude/skills/
    └── wow-onepage/       # 攻略卡片生成 skill
```

## 数据来源

- [Wowhead Midnight Season 1 Raid Cheat Sheets](https://www.wowhead.com/guide/midnight/raids/all-boss-cheat-sheets)

## License

MIT
