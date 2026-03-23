#!/usr/bin/env node
/**
 * 构建 GitHub Pages 发布版本
 *
 * 用法: npm run build:gh
 * 输出: dist/ 目录，可直接部署到 GitHub Pages
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.cwd();
const DIST_DIR = '/opt/workpool/wow-raid-gh';
const DOCS_DIR = path.join(PROJECT_DIR, 'docs');
const BOSSES_DIR = path.join(DOCS_DIR, 'bosses');

// 团本信息
const RAID_INFO = {
  '01': { raid: '虚空尖塔', raidEn: 'Voidspire' },
  '02': { raid: '虚空尖塔', raidEn: 'Voidspire' },
  '03': { raid: '虚空尖塔', raidEn: 'Voidspire' },
  '04': { raid: '虚空尖塔', raidEn: 'Voidspire' },
  '05': { raid: '虚空尖塔', raidEn: 'Voidspire' },
  '06': { raid: '虚空尖塔', raidEn: 'Voidspire' },
  'D1': { raid: '幽梦裂隙', raidEn: 'The Dreamrift' },
  'Q1': { raid: '奎尔丹纳斯进军', raidEn: 'March on Quel\'Danas' },
  'Q2': { raid: '奎尔丹纳斯进军', raidEn: 'March on Quel\'Danas' },
};

// 查找所有 Boss 目录
function findBossDirs() {
  if (!fs.existsSync(BOSSES_DIR)) return [];
  return fs.readdirSync(BOSSES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort((a, b) => a.localeCompare(b));
}

// 获取 Boss 信息
function getBossInfo(dirName) {
  const prefix = dirName.split('-')[0];
  const info = RAID_INFO[prefix] || { raid: '未知', raidEn: 'Unknown' };
  // 移除前缀数字/字母和连字符
  const name = dirName.replace(/^[0-9A-Z]+[-_]/, '');
  return { ...info, name, dirName };
}

// 生成首页
function generateIndex(bossDirs) {
  // 按副本分组
  const raids = {};
  bossDirs.forEach(dirName => {
    const info = getBossInfo(dirName);
    if (!raids[info.raid]) raids[info.raid] = [];
    raids[info.raid].push({ ...info, dirName });
  });

  // 检查是否有 overview 文件
  const overviewHtml = fs.existsSync(path.join(DIST_DIR, 'overview.html'));

  // 生成各副本区域
  const raidSections = Object.entries(raids).map(([raidName, bosses]) => {
    const bossCards = bosses.map(boss => {
      const hasHtml = fs.existsSync(path.join(BOSSES_DIR, boss.dirName, 'README.html'));
      const hasMd = fs.existsSync(path.join(BOSSES_DIR, boss.dirName, 'README.md'));
      if (!hasHtml && !hasMd) return '';

      const href = hasHtml ? `bosses/${boss.dirName}/README.html` : `bosses/${boss.dirName}/README.md`;

      return `<a href="${href}" class="boss-card">${boss.name}</a>`;
    }).filter(Boolean).join('\n');

    return `
    <div class="raid-section">
      <div class="raid-title">${raidName}</div>
      <div class="boss-grid">${bossCards}</div>
    </div>`;
  }).join('\n');

  // 概述卡片
  const overviewCard = overviewHtml ? `
    <div class="raid-section">
      <div class="raid-title" style="color: #FFD700; border-color: #FFD700;">📋 团本概述</div>
      <div class="boss-grid">
        <a href="overview.html" class="boss-card" style="border-color: #FFD700;">难度分级 · T套掉落 · 火花规划</a>
      </div>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WoW Midnight 团本攻略</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, "Microsoft YaHei", sans-serif;
      background: linear-gradient(180deg, #0D0D1A 0%, #1A1A2E 100%);
      color: #E0E0E0;
      min-height: 100vh;
      padding: 16px;
    }
    .container {
      max-width: 430px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
      padding: 16px;
    }
    .header h1 {
      color: #FFD700;
      font-size: 24px;
      margin-bottom: 6px;
      text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
    }
    .header .subtitle {
      color: #888;
      font-size: 13px;
    }
    .header .version {
      color: #FF6B00;
      font-size: 12px;
      margin-top: 6px;
    }
    .raid-section {
      margin-bottom: 24px;
    }
    .raid-title {
      font-size: 18px;
      font-weight: bold;
      color: #FF6B00;
      padding: 8px 0;
      margin-bottom: 12px;
      border-bottom: 2px solid #FF6B00;
    }
    .boss-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .boss-card {
      background: #1A1A2E;
      border: 1px solid #3A3A5A;
      border-radius: 10px;
      padding: 14px 16px;
      text-decoration: none;
      font-size: 15px;
      font-weight: 500;
      color: #E0E0E0;
      transition: all 0.2s;
    }
    .boss-card:hover {
      border-color: #FF6B00;
      background: #252540;
      transform: translateX(4px);
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 11px;
    }
    .footer a {
      color: #FF6B00;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>WoW Midnight 团本攻略</h1>
      <div class="subtitle">急速军团 · 奶个爪爪</div>
      <div class="version">Midnight Season 1 · 2026</div>
    </div>
    ${overviewCard}
    ${raidSections}
    <div class="footer">
      数据来源: <a href="https://www.wowhead.com" target="_blank">Wowhead</a>
    </div>
  </div>
</body>
</html>`;
}

// 生成 overview HTML
function generateOverviewHtml(mdPath) {
  const md = fs.readFileSync(mdPath, 'utf-8');

  // 简单的 Markdown 转 HTML
  let html = md
    // 标题
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // 引用
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // 分隔线
    .replace(/^---$/gm, '<hr>')
    // 表格
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.every(c => c.trim().match(/^-+$/))) {
        return ''; // 跳过分隔行
      }
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    })
    // 清理空表格行
    .replace(/<tr><\/tr>/g, '')
    // 包裹表格
    .replace(/(<tr>.*<\/tr>)/gs, '<table>$1</table>')
    // 段落
    .replace(/^([^<\n].+)$/gm, '<p>$1</p>')
    // 列表
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // 清理多余空行
    .replace(/\n{3,}/g, '\n\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>虚空尖塔 - 团本概述</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, "Microsoft YaHei", sans-serif;
      background: linear-gradient(180deg, #0D0D1A 0%, #1A1A2E 100%);
      color: #E0E0E0;
      min-height: 100vh;
      padding: 16px;
      max-width: 430px;
      margin: 0 auto;
    }
    .back-btn {
      position: fixed;
      top: 12px;
      right: 12px;
      background: rgba(255, 107, 0, 0.9);
      color: #000;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 4px;
      z-index: 100;
    }
    .back-btn:hover { background: #FFD700; }
    h1 {
      color: #FFD700;
      font-size: 22px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #FF6B00;
    }
    h2 {
      color: #FF6B00;
      font-size: 18px;
      margin: 20px 0 12px;
    }
    h3 {
      color: #4FC3F7;
      font-size: 15px;
      margin: 16px 0 8px;
    }
    blockquote {
      background: rgba(255, 107, 0, 0.1);
      border-left: 3px solid #FF6B00;
      padding: 10px 14px;
      margin: 12px 0;
      font-size: 14px;
    }
    hr {
      border: none;
      border-top: 1px solid #3A3A5A;
      margin: 20px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 13px;
    }
    td {
      padding: 8px 6px;
      border-bottom: 1px solid #3A3A5A;
    }
    tr:first-child td {
      font-weight: bold;
      color: #FFD700;
      background: rgba(255, 215, 0, 0.1);
    }
    p { margin: 8px 0; font-size: 14px; line-height: 1.6; }
    li { margin: 4px 0 4px 16px; font-size: 14px; }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 11px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <a href="index.html" class="back-btn">← 返回</a>
  ${html}
  <div class="footer">攻略：奶个爪爪 · Midnight S1 · 2026</div>
</body>
</html>`;
}

// 注入返回按钮和样式到 HTML
function injectBackButton(html, depth) {
  const backPath = depth === 1 ? '../index.html' : '../../index.html';
  const injectedStyles = `
  <style>
    /* 最大宽度限制 */
    body { max-width: 430px; margin: 0 auto; }
    /* 返回按钮 */
    .back-btn {
      position: fixed;
      top: 12px;
      right: 12px;
      background: rgba(255, 107, 0, 0.9);
      color: #000;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 4px;
      z-index: 100;
      transition: all 0.2s;
    }
    .back-btn:hover {
      background: #FFD700;
      transform: scale(1.05);
    }
  </style>
  <a href="${backPath}" class="back-btn">← 返回</a>`;

  // 在 </body> 前插入
  return html.replace('</body>', injectedStyles + '\n</body>');
}

// 复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 主函数
function main() {
  console.log('\n🚀 构建 GitHub Pages 发布版本');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 清理目录内容但保留 .git（worktree 需要）
  if (fs.existsSync(DIST_DIR)) {
    const entries = fs.readdirSync(DIST_DIR);
    for (const entry of entries) {
      if (entry !== '.git') {
        fs.rmSync(path.join(DIST_DIR, entry), { recursive: true });
      }
    }
  } else {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // 查找所有 Boss 目录
  const bossDirs = findBossDirs();
  console.log(`📁 找到 ${bossDirs.length} 个 Boss 目录`);

  // 先处理 overviewraid.html（优先使用已有 HTML）
  const overviewHtmlPath = path.join(BOSSES_DIR, 'overviewraid.html');
  const overviewMdPath = path.join(BOSSES_DIR, 'overviewraid.md');
  if (fs.existsSync(overviewHtmlPath)) {
    fs.copyFileSync(overviewHtmlPath, path.join(DIST_DIR, 'overview.html'));
    console.log('✅ 复制 overviewraid.html');
  } else if (fs.existsSync(overviewMdPath)) {
    const overviewHtml = generateOverviewHtml(overviewMdPath);
    fs.writeFileSync(path.join(DIST_DIR, 'overview.html'), overviewHtml);
    console.log('✅ 生成 overview.html');
  }

  // 创建 CNAME 文件（自定义域名）
  fs.writeFileSync(path.join(DIST_DIR, 'CNAME'), 'wow.qifan.org');
  console.log('✅ 创建 CNAME 文件');

  // 生成首页（此时 overview.html 已存在）
  const indexHtml = generateIndex(bossDirs);
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);
  console.log('✅ 生成首页 index.html');

  // 复制并处理每个 Boss 目录
  let htmlCount = 0;
  for (const dirName of bossDirs) {
    const srcDir = path.join(BOSSES_DIR, dirName);
    const destDir = path.join(DIST_DIR, 'bosses', dirName);

    // 复制整个目录
    copyDir(srcDir, destDir);

    // 如果有 HTML 文件，注入返回按钮
    const htmlPath = path.join(destDir, 'README.html');
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf-8');
      html = injectBackButton(html, 2);
      fs.writeFileSync(htmlPath, html);
      htmlCount++;
    }
  }
  console.log(`✅ 复制并处理 ${bossDirs.length} 个目录，${htmlCount} 个 HTML 添加返回按钮`);

  // 输出统计
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📦 构建完成！输出目录: ${DIST_DIR}`);
  console.log('💡 部署方式: 将 dist/ 目录内容推送到 gh-pages 分支');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main();
