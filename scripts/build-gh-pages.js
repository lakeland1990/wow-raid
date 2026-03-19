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
const DIST_DIR = path.join(PROJECT_DIR, 'dist');
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
  const bossCards = bossDirs.map(dirName => {
    const info = getBossInfo(dirName);
    const hasHtml = fs.existsSync(path.join(BOSSES_DIR, dirName, 'README.html'));
    const hasMd = fs.existsSync(path.join(BOSSES_DIR, dirName, 'README.md'));

    if (!hasHtml && !hasMd) return '';

    const href = hasHtml ? `bosses/${dirName}/README.html` : `bosses/${dirName}/README.md`;
    const status = hasHtml ? '✅' : '📄';

    return `
    <a href="${href}" class="boss-card">
      <div class="boss-raid">${info.raid}</div>
      <div class="boss-name">${info.name}</div>
      <div class="boss-status">${status}</div>
    </a>`;
  }).filter(Boolean).join('\n');

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
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
    }
    .header h1 {
      color: #FFD700;
      font-size: 28px;
      margin-bottom: 8px;
      text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
    }
    .header .subtitle {
      color: #888;
      font-size: 14px;
    }
    .header .version {
      color: #FF6B00;
      font-size: 13px;
      margin-top: 8px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
    }
    .boss-card {
      background: #1A1A2E;
      border: 1px solid #3A3A5A;
      border-radius: 12px;
      padding: 16px;
      text-decoration: none;
      transition: all 0.2s;
      display: block;
    }
    .boss-card:hover {
      border-color: #FF6B00;
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(255, 107, 0, 0.2);
    }
    .boss-raid {
      font-size: 11px;
      color: #FF6B00;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .boss-name {
      font-size: 16px;
      font-weight: bold;
      color: #E0E0E0;
      margin-bottom: 8px;
    }
    .boss-status {
      font-size: 12px;
      color: #888;
    }
    .footer {
      text-align: center;
      padding: 30px 20px;
      color: #666;
      font-size: 12px;
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
      <div class="subtitle">奶个爪爪 · 速查卡片</div>
      <div class="version">Midnight Season 1 · 2026</div>
    </div>
    <div class="grid">
      ${bossCards}
    </div>
    <div class="footer">
      数据来源: <a href="https://www.wowhead.com" target="_blank">Wowhead</a>
    </div>
  </div>
</body>
</html>`;
}

// 注入返回按钮到 HTML
function injectBackButton(html, depth) {
  const backPath = depth === 1 ? '../index.html' : '../../index.html';
  const backButton = `
  <style>
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
  return html.replace('</body>', backButton + '\n</body>');
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

  // 清理并创建 dist 目录
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // 查找所有 Boss 目录
  const bossDirs = findBossDirs();
  console.log(`📁 找到 ${bossDirs.length} 个 Boss 目录`);

  // 生成首页
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
