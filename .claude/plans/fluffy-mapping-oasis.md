# 魔兽世界团本攻略抓取计划

## Context
用户需要获取魔兽世界 12.0 团本（Midnight）的攻略信息，从 wowhead 网站抓取并总结每个 Boss 的打法和要点。

**目标网站**: https://www.wowhead.com/guide/midnight/raids/all-boss-cheat-sheets

## 实现方案

### 1. 创建 Playwright 抓取脚本
创建 `src/scraper.js` 使用 Playwright 抓取 wowhead 页面内容：
- 使用 chromium 浏览器
- 等待页面加载完成
- 提取所有 Boss 的攻略信息

### 2. 数据提取
从页面中提取：
- 每个 Boss 的名称
- 关键机制和技能
- 坦克、DPS、治疗的注意事项
- 重要提示（Cheat Sheet 内容）

### 3. 整理输出
为**每个 Boss 单独创建一个 Markdown 文件**，保存到 `docs/bosses/` 目录：
```
docs/bosses/
├── boss-1-名称.md
├── boss-2-名称.md
├── boss-3-名称.md
└── ...
```

每个 Boss 文件包含：
- Boss 名称
- 核心机制概述
- 坦克职责
- DPS 职责
- 治疗职责
- 关键技能和应对
- 重要提示

## 关键文件
- `src/scraper.js` - Playwright 抓取脚本（新建）
- `docs/bosses/*.md` - 每个 Boss 的独立攻略文件（新建）

## 验证方式
1. 运行 `node src/scraper.js`
2. 检查 `docs/bosses/` 目录下是否生成了所有 Boss 的攻略文件
3. 确认每个文件内容完整

## 注意事项
- wowhead 可能需要等待 JavaScript 渲染
- 可能需要处理反爬机制
- 内容为英文，将整理成中文攻略
