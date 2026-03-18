#!/usr/bin/env node
/**
 * WoW 攻略 Markdown 转 HTML 生成器
 * 移动端优先设计 - 卡片化布局
 * 支持后处理优化：危险等级、标签、视觉层次
 */

const fs = require('fs');
const path = require('path');

// 魔兽风格配色
const COLORS = {
  bg: '#0D0D1A',
  cardBg: '#1A1A2E',
  cardLight: '#252540',
  title: '#FFD700',
  text: '#E8E8E8',
  accent: '#FF6B00',
  danger: '#FF4444',
  dangerGradient: 'linear-gradient(135deg, #fc950f 0%, #fdc379 100%)',
  border: '#3A3A5A',
  muted: '#888899',
  success: '#7CFC00',
  // 后处理配色
  dangerRed: '#FF4444',
  warningOrange: '#FF6B00',
  normalBlue: '#4FC3F7'
};

// 需要高亮的关键词（仅致命机制）
const DANGER_KEYWORDS = ['团灭', '秒杀', '灭团', '必死', '狂暴'];

// 精简文本
function simplifyText(text) {
  if (!text) return text;
  let result = text;

  const simplifications = [
    [/会在(.+?)中/g, '在$1中'],
    [/开始施法/g, '读条'],
    [/施法结束后/g, '读条后'],
    [/深渊虚空塑形者/g, '大怪'],
    [/三个格子/g, '3格'],
    [/九个格子/g, '9格'],
    [/三个被占领/g, '3个被占领'],
    [/会导致/g, ''],
    [/需要(.+?)来/g, '$1'],
    [/玩家/g, ''],
    [/Boss会/g, 'Boss'],
    [/BOSS会/g, 'BOSS'],
    [/随机点名一个/g, '点名'],
    [/随机点名/g, '点名'],
    [/造成范围AOE/g, 'AOE'],
    [/造成范围 AOE/g, 'AOE'],
    [/并且/g, '，'],
    [/然后/g, ''],
    [/将会/g, ''],
    [/可以进行/g, ''],
    [/记得/g, ''],
    [/一定/g, ''],
  ];

  for (const [pattern, replacement] of simplifications) {
    result = result.replace(pattern, replacement);
  }

  result = result.replace(/\s+/g, ' ').trim();
  result = result.replace(/，+/g, '，');
  result = result.replace(/^，/, '');
  return result;
}

// 高亮致命机制
function highlightDanger(text) {
  if (!text) return text;
  let result = text;
  for (const keyword of DANGER_KEYWORDS) {
    const regex = new RegExp(keyword, 'g');
    result = result.replace(regex, `<span class="highlight-danger">${keyword}</span>`);
  }
  return result;
}

function processText(text) {
  return highlightDanger(simplifyText(text));
}

// 解析 Markdown
function parseMarkdown(content) {
  const result = {
    title: '',
    raid: '',
    enName: '',
    note: '',
    fightInfo: {},
    coreIdea: '',
    oneLiner: '',
    phases: [],
    tankDuties: [],
    dpsDuties: [],
    healerDuties: [],
    teamDuties: [],
    skillTable: []
  };

  const lines = content.split('\n');
  let currentSection = '';
  let currentPhase = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('# ')) {
      result.title = line.replace('# ', '').trim();
      continue;
    }

    if (line.startsWith('> **')) {
      const match = line.match(/\*\*(.+?)\*\*:\s*(.+)/);
      if (match) {
        const [, key, value] = match;
        if (key.includes('副本')) result.raid = value;
        if (key.includes('英文名')) result.enName = value;
        if (key.includes('备注')) result.note = value;
      }
      continue;
    }

    if (line.startsWith('## ')) {
      currentSection = line.replace('## ', '').trim();
      currentPhase = null;
      continue;
    }

    if (line.startsWith('### ')) {
      const phaseName = line.replace('### ', '').trim();
      if (currentSection === '阶段机制' || currentSection.includes('机制') || currentSection.includes('技能')) {
        currentPhase = { name: phaseName, points: [] };
        result.phases.push(currentPhase);
      }
      continue;
    }

    if (currentSection === '核心思路' && line && !line.startsWith('>') && !line.startsWith('-') && !line.startsWith('|')) {
      if (!result.coreIdea && line.length > 5) {
        result.coreIdea = line;
      }
    }

    if (currentSection === '战斗信息' && line.startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim().replace(/\*\*/g, ''));
      if (cells.length === 2 && !cells[0].startsWith('-')) {
        if (cells[0] !== '项目') {
          result.fightInfo[cells[0]] = cells[1];
        }
      }
      continue;
    }

    if (currentSection === '关键技能' && line.startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim().replace(/\*\*/g, ''));
      if (cells.length >= 3 && !cells[0].startsWith('-') && cells[0] !== '技能名') {
        result.skillTable.push({
          name: cells[0],
          desc: cells[1],
          response: cells[2] || ''
        });
      }
      continue;
    }

    if (line.startsWith('- ')) {
      const point = line.replace('- ', '').trim();
      if (currentSection.includes('坦克')) {
        result.tankDuties.push(point);
      } else if (currentSection.includes('DPS') || currentSection.includes('dps')) {
        result.dpsDuties.push(point);
      } else if (currentSection.includes('治疗') || currentSection.includes('奶')) {
        result.healerDuties.push(point);
      } else if (currentSection.includes('全团')) {
        result.teamDuties.push(point);
      } else if (currentPhase) {
        currentPhase.points.push(point);
      } else if (currentSection.includes('职责')) {
        result.teamDuties.push(point);
      }
      continue;
    }
  }

  return result;
}

// 生成 HTML
function generateHTML(data, outputPath) {
  const date = new Date().toISOString().split('T')[0];
  const coreIdeaProcessed = data.coreIdea ? simplifyText(data.coreIdea) : '';

  // 职责数据
  const roles = [];
  if (data.tankDuties.length > 0) roles.push({ id: 'tank', name: '坦克', icon: '🛡️', duties: data.tankDuties });
  if (data.teamDuties.length > 0) roles.push({ id: 'team', name: '全团', icon: '👥', duties: data.teamDuties });
  if (data.dpsDuties.length > 0) roles.push({ id: 'dps', name: '输出', icon: '⚔️', duties: data.dpsDuties });
  if (data.healerDuties.length > 0) roles.push({ id: 'healer', name: '治疗', icon: '💚', duties: data.healerDuties });

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${data.title} - 攻略卡片</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, "Microsoft YaHei", sans-serif;
      background: ${COLORS.bg};
      color: ${COLORS.text};
      min-height: 100vh;
      line-height: 1.5;
    }

    /* ========== 顶部紧凑区 ========== */
    .header {
      background: linear-gradient(180deg, ${COLORS.cardLight} 0%, ${COLORS.cardBg} 100%);
      padding: 16px;
      border-bottom: 2px solid ${COLORS.border};
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .boss-info { flex: 1; }

    .boss-name {
      font-size: 22px;
      font-weight: bold;
      color: ${COLORS.title};
      margin-bottom: 4px;
    }

    .raid-tag {
      display: inline-block;
      background: ${COLORS.accent};
      color: #000;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }

    .fight-meta {
      display: flex;
      gap: 16px;
      flex-shrink: 0;
    }

    .meta-item { text-align: center; }
    .meta-label { font-size: 11px; color: ${COLORS.muted}; }
    .meta-value { font-size: 14px; font-weight: bold; color: ${COLORS.accent}; }

    /* ========== 口诀大字报（第一屏核心） ========== */
    .mantra {
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 107, 0, 0.1) 100%);
      padding: 20px 16px;
      margin: 12px;
      border-radius: 12px;
      border: 2px solid ${COLORS.title};
      text-align: center;
    }

    .mantra-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 20px;
      font-size: 20px;
      font-weight: bold;
      color: ${COLORS.title};
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .mantra-line { padding: 4px 0; }

    /* ========== 卡片通用样式 ========== */
    .card {
      background: ${COLORS.cardBg};
      border-radius: 12px;
      margin: 12px;
      overflow: hidden;
      border: 1px solid ${COLORS.border};
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .card-header {
      background: ${COLORS.cardLight};
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-icon { font-size: 18px; }
    .card-title { font-size: 16px; font-weight: bold; color: ${COLORS.accent}; }
    .card-body { padding: 12px 14px; }

    /* ========== 核心思路 ========== */
    .core-idea-text {
      font-size: 16px;
      line-height: 1.6;
      color: ${COLORS.text};
    }

    /* ========== 高亮关键词 ========== */
    .highlight-danger {
      color: ${COLORS.danger};
      font-weight: bold;
      text-shadow: 0 0 8px rgba(255, 68, 68, 0.5);
    }

    /* ========== 技能卡片（堆叠模式） ========== */
    .skill-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .skill-item {
      background: rgba(58, 58, 90, 0.3);
      border-radius: 8px;
      padding: 10px 12px;
      border-left: 3px solid ${COLORS.muted};
    }

    /* 后处理：危险等级配色 */
    .skill-item.skill-danger {
      border-left-color: ${COLORS.dangerRed};
      background: rgba(255, 68, 68, 0.1);
    }
    .skill-item.skill-danger .skill-name { color: ${COLORS.dangerRed}; }

    .skill-item.skill-warning {
      border-left-color: ${COLORS.warningOrange};
      background: rgba(255, 107, 0, 0.1);
    }
    .skill-item.skill-warning .skill-name { color: ${COLORS.warningOrange}; }

    .skill-item.skill-normal {
      border-left-color: ${COLORS.normalBlue};
      background: rgba(79, 195, 247, 0.1);
    }
    .skill-item.skill-normal .skill-name { color: ${COLORS.normalBlue}; }

    .skill-name {
      font-size: 15px;
      font-weight: bold;
      color: ${COLORS.accent};
      margin-bottom: 4px;
    }

    .skill-response {
      font-size: 14px;
      color: ${COLORS.success};
      padding-left: 8px;
      border-left: 2px solid ${COLORS.success};
    }

    /* ========== 职责分工（直接展示，无标签页） ========== */
    .role-section {
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid ${COLORS.border};
    }
    .role-section:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .role-title {
      font-size: 15px;
      font-weight: bold;
      color: ${COLORS.title};
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .duty-list { list-style: none; }
    .duty-list li {
      font-size: 14px;
      line-height: 1.5;
      padding: 5px 0 5px 16px;
      position: relative;
      border-bottom: 1px solid rgba(58, 58, 90, 0.3);
    }
    .duty-list li:last-child { border-bottom: none; }
    .duty-list li::before {
      content: "▸";
      color: ${COLORS.accent};
      position: absolute;
      left: 0;
    }

    /* ========== 机制要点 ========== */
    .phase-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .phase-item {
      background: rgba(58, 58, 90, 0.3);
      border-radius: 8px;
      padding: 10px 12px;
    }

    .phase-name {
      font-size: 14px;
      font-weight: bold;
      color: ${COLORS.title};
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    /* 后处理：机制标签 */
    .tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      color: #fff;
    }
    .tag-core { background: #FF4444; }
    .tag-share { background: #9C27B0; }
    .tag-target { background: #FF6B00; }
    .tag-switch { background: #4CAF50; }
    .tag-dodge { background: #2196F3; }

    .phase-points { list-style: none; }
    .phase-points li {
      font-size: 13px;
      line-height: 1.4;
      padding: 3px 0 3px 14px;
      position: relative;
    }
    .phase-points li::before {
      content: "•";
      color: ${COLORS.accent};
      position: absolute;
      left: 0;
    }

    /* ========== 底部 ========== */
    .footer {
      text-align: center;
      padding: 16px;
      font-size: 12px;
      color: ${COLORS.muted};
      border-top: 1px solid ${COLORS.border};
      margin-top: 12px;
    }
  </style>
</head>
<body>

  <!-- 顶部紧凑区 -->
  <div class="header">
    <div class="header-row">
      <div class="boss-info">
        <div class="boss-name">${data.title}</div>
        <span class="raid-tag">${data.raid || '团本'}</span>
      </div>
      <div class="fight-meta">
        ${Object.entries(data.fightInfo).map(([key, value]) => `
          <div class="meta-item">
            <div class="meta-label">${key.replace('战斗类型', '类型').replace('嗜血时机', '嗜血')}</div>
            <div class="meta-value">${value.replace('单体目标 + ', '')}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <!-- 口诀大字报（第一屏核心） -->
  ${data.oneLiner ? `
  <div class="mantra">
    <div class="mantra-content">
      ${data.oneLiner.split('\n').filter(line => line.trim()).map(line =>
        `<span class="mantra-line">${line.trim()}</span>`
      ).join('')}
    </div>
  </div>
  ` : ''}

  <!-- 核心思路卡片 -->
  ${data.coreIdea ? `
  <div class="card">
    <div class="card-header">
      <span class="card-icon">💡</span>
      <span class="card-title">核心思路</span>
    </div>
    <div class="card-body">
      <div class="core-idea-text">${highlightDanger(coreIdeaProcessed)}</div>
    </div>
  </div>
  ` : ''}

  <!-- 关键技能卡片（堆叠模式，待后处理添加危险等级） -->
  ${data.skillTable.length > 0 ? `
  <div class="card">
    <div class="card-header">
      <span class="card-icon">⚡</span>
      <span class="card-title">关键技能</span>
    </div>
    <div class="card-body">
      <div class="skill-list">
        ${data.skillTable.map(skill => `
          <div class="skill-item">
            <div class="skill-name">${skill.name}</div>
            <div class="skill-response">${processText(skill.response)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
  ` : ''}

  <!-- 职责分工卡片（直接展示，无标签页） -->
  ${roles.length > 0 ? `
  <div class="card">
    <div class="card-header">
      <span class="card-icon">👥</span>
      <span class="card-title">职责分工</span>
    </div>
    <div class="card-body">
      ${roles.map(role => `
        <div class="role-section">
          <div class="role-title">${role.icon} ${role.name}</div>
          <ul class="duty-list">
            ${role.duties.slice(0, 5).map(d => `<li>${processText(d)}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <!-- 机制要点卡片（待后处理添加标签） -->
  ${data.phases.length > 0 ? `
  <div class="card">
    <div class="card-header">
      <span class="card-icon">📋</span>
      <span class="card-title">机制要点</span>
    </div>
    <div class="card-body">
      <div class="phase-list">
        ${data.phases.map(phase => `
          <div class="phase-item">
            <div class="phase-name">${phase.name}</div>
            <ul class="phase-points">
              ${phase.points.slice(0, 4).map(p => `<li>${processText(p)}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
  ` : ''}

  <!-- 底部 -->
  <div class="footer">
    攻略：奶个爪爪 · Midnight S1 · ${date}
  </div>

</body>
</html>`;

  fs.writeFileSync(outputPath, html, 'utf-8');
  return outputPath;
}

// 主函数
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('用法: node generate-html.js <input.md> <output.html> [一句话攻略]');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1];
  const oneLiner = args[2] || '';

  if (!fs.existsSync(inputPath)) {
    console.error(`文件不存在: ${inputPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(inputPath, 'utf-8');
  const data = parseMarkdown(content);
  data.oneLiner = oneLiner;
  generateHTML(data, outputPath);

  console.log(`HTML 已生成: ${outputPath}`);
}

main();
