---
name: wow-onepage
description: |
  将魔兽世界攻略 Markdown 文件转换为适合手机分享的 HTML 卡片。

  触发方式：
  - 使用命令 `/wow-onepage` 后跟文件路径
  - 用户说"生成攻略图"、"攻略一图流"、"把攻略转成图片"、"帮我做一张攻略卡片"等

  当用户想要把现有的 WoW 攻略文档制作成便于手机查看的 HTML 卡片时使用此 skill。
---

# WoW 攻略 HTML 卡片生成器

将魔兽世界攻略 Markdown 转换为移动端优先的魔兽风格 HTML 卡片。

## 工作流程

### 1. 确认输入文件

- 如果用户提供了具体文件路径，直接使用
- 如果用户只说了 Boss 名称，在 `docs/bosses/` 目录下搜索匹配的 README.md
- 支持同时处理多个文件

### 2. 创作一句话攻略

在生成 HTML 之前，**必须先创作"一句话攻略"**——用朗朗上口的打油诗/顺口溜总结 Boss 关键机制。

**创作规则：**
- 从攻略内容（核心思路、关键技能、职责分工）中提炼关键机制
- 每行 7 字左右，共 4-6 行
- 押韵、对仗、朗朗上口
- 覆盖最重要的机制（点名、躲技能、换坦、打断等）
- 避免书面语，用口语化、好记的表达

**示例：**
```
点名放水靠边站
分摊人群别落单
地板躲好别贪贪
披风穿墙别忘按
```

### 3. 生成基础 HTML

使用 `scripts/generate-html.js` 脚本生成 HTML：

```bash
node .claude/skills/wow-onepage/scripts/generate-html.js <input.md> <output.html> "<一句话攻略>"
```

**输出位置：** HTML 文件生成在源文件同目录，命名为 `<原文件名>.html`

### 4. AI 后处理优化（关键步骤）

生成基础 HTML 后，**必须进行 AI 后处理优化**。直接修改生成的 HTML 文件。

#### 4.1 技能卡片 - 危险等级配色

分析每个技能的危险程度，添加对应的 CSS 类：

| 危险等级 | CSS 类 | 颜色 | 适用场景 |
|---------|--------|------|---------|
| 危险 | `skill-danger` | 红色 #FF4444 | 团灭、秒杀、必死机制 |
| 警告 | `skill-warning` | 橙色 #FF6B00 | 需要注意、可能致死 |
| 普通 | `skill-normal` | 蓝色 #4FC3F7 | 常规机制 |

**修改示例：**
```html
<!-- 原始 -->
<div class="skill-item">
  <div class="skill-name">暗影进军</div>
  <div class="skill-response">控制传送门位置，防止连成直线</div>
</div>

<!-- 优化后 -->
<div class="skill-item skill-danger">
  <div class="skill-name">⚠️ 暗影进军</div>
  <div class="skill-response">控制传送门位置，防止连成直线</div>
</div>
```

#### 4.2 职责分工 - 直接展示

移除标签页交互，改为**垂直堆叠**直接展示所有职责：

```html
<!-- 改为直接展示，无标签页 -->
<div class="card">
  <div class="card-header">
    <span class="card-icon">👥</span>
    <span class="card-title">职责分工</span>
  </div>
  <div class="card-body">
    <div class="role-section">
      <div class="role-title">🛡️ 坦克</div>
      <ul class="duty-list">...</ul>
    </div>
    <div class="role-section">
      <div class="role-title">⚔️ 输出</div>
      <ul class="duty-list">...</ul>
    </div>
    ...
  </div>
</div>
```

#### 4.3 机制要点 - 添加标签 + 精简描述

为每个机制添加类型标签，精简描述文字：

**标签类型：**
- `核心` - 关键机制，必须掌握
- `分担` - 分担圈/分摊伤害
- `点名` - 点名机制
- `转火` - 需要转火目标
- `躲避` - 需要躲避的技能

**修改示例：**
```html
<div class="phase-item">
  <div class="phase-name">
    <span class="tag tag-core">核心</span>
    暗影进军
  </div>
  <ul class="phase-points">
    <li>3x3网格，三连占领即<span class="highlight-danger">团灭</span></li>
    <li>控制传送门位置，防止连成直线</li>
  </ul>
</div>
```

#### 4.4 视觉层次优化

**高亮关键词：**
```css
/* 仅高亮致命关键词 */
.highlight-danger {
  color: #FF4444;
  font-weight: bold;
  text-shadow: 0 0 8px rgba(255, 68, 68, 0.5);
}
```

**卡片阴影和边框：**
```css
.card {
  background: #1A1A2E;
  border-radius: 12px;
  margin: 12px;
  overflow: hidden;
  border: 1px solid #3A3A5A;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.card-danger {
  border-color: #FF4444;
  box-shadow: 0 4px 12px rgba(255, 68, 68, 0.2);
}
```

### 5. 后处理 CSS 模板

在 HTML 的 `<style>` 中添加以下样式：

```css
/* === 技能危险等级 === */
.skill-item.skill-danger {
  border-left: 3px solid #FF4444;
  background: rgba(255, 68, 68, 0.1);
}
.skill-item.skill-danger .skill-name { color: #FF4444; }

.skill-item.skill-warning {
  border-left: 3px solid #FF6B00;
  background: rgba(255, 107, 0, 0.1);
}
.skill-item.skill-warning .skill-name { color: #FF6B00; }

.skill-item.skill-normal {
  border-left: 3px solid #4FC3F7;
  background: rgba(79, 195, 247, 0.1);
}
.skill-item.skill-normal .skill-name { color: #4FC3F7; }

/* === 机制标签 === */
.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  margin-right: 6px;
}
.tag-core { background: #FF4444; color: #fff; }
.tag-share { background: #9C27B0; color: #fff; }
.tag-target { background: #FF6B00; color: #fff; }
.tag-switch { background: #4CAF50; color: #fff; }
.tag-dodge { background: #2196F3; color: #fff; }

/* === 高亮关键词 === */
.highlight-danger {
  color: #FF4444;
  font-weight: bold;
}

/* === 职责分区 === */
.role-section {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #3A3A5A;
}
.role-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
.role-title {
  font-size: 15px;
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 8px;
}

/* === 卡片增强 === */
.card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
```

## 完整示例

**输入：**
```
/wow-onepage docs/bosses/01-元首阿福扎恩/README.md
```

**处理流程：**
1. 读取 MD 文件
2. 创作一句话攻略
3. 调用脚本生成基础 HTML
4. AI 分析并优化 HTML（危险等级、标签、视觉层次）
5. 保存优化后的 HTML

**输出：**
```
✅ 生成 docs/bosses/01-元首阿福扎恩/README.html
```

## 批量处理

支持处理多个文件或目录：
```
/wow-onepage docs/bosses/01-元首阿福扎恩/README.md docs/bosses/04-威厄高尔和艾佐拉克/README.md
/wow-onepage docs/bosses/  # 处理所有 Boss 攻略
```
