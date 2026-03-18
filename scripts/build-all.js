#!/usr/bin/env node
/**
 * 批量构建所有攻略卡片
 *
 * 用法: npm run build [输出目录]
 * 示例: npm run build output/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = process.cwd();
const GENERATE_SCRIPT = path.join(PROJECT_DIR, '.claude/skills/wow-onepage/scripts/generate-html.js');
const SCREENSHOT_SCRIPT = path.join(PROJECT_DIR, 'scripts/screenshot.js');

function findAllBossFiles() {
  const bossesDir = path.join(PROJECT_DIR, 'docs', 'bosses');
  if (!fs.existsSync(bossesDir)) return [];
  const files = [];
  const dirs = fs.readdirSync(bossesDir, { withFileTypes: true })
    .filter(d => d.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
  for (const dir of dirs) {
    const mdPath = path.join(bossesDir, dir.name, 'README.md');
    if (fs.existsSync(mdPath)) {
      files.push({ name: dir.name, mdPath, relPath: `docs/bosses/${dir.name}/README.md` });
    }
  }
  return files;
}

async function buildAll(outputDir) {
  const output = path.resolve(PROJECT_DIR, outputDir || 'output');
  if (!fs.existsSync(output)) fs.mkdirSync(output, { recursive: true });

  const files = findAllBossFiles();
  console.log(`\n🎮 批量构建攻略卡片`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`找到 ${files.length} 个攻略文件`);
  console.log(`输出目录: ${output}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  let success = 0, failed = 0;

  for (const file of files) {
    console.log(`\n处理: ${file.name}`);
    const htmlPath = path.join(output, `${file.name}.html`);
    const pngPath = path.join(output, `${file.name}.png`);

    try {
      console.log('  生成 HTML...');
      execSync(`node "${GENERATE_SCRIPT}" "${file.mdPath}" "${htmlPath}"`, { cwd: PROJECT_DIR, stdio: 'pipe' });

      console.log('  生成图片...');
      execSync(`node "${SCREENSHOT_SCRIPT}" "${htmlPath}" "${pngPath}"`, { cwd: PROJECT_DIR, stdio: 'pipe' });

      console.log(`  ✅ 完成: ${pngPath}`);
      success++;
    } catch (err) {
      console.error(`  ❌ 失败: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`构建完成: ${success} 成功, ${failed} 失败`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

function main() {
  const args = process.argv.slice(2);
  buildAll(args[0] || 'output').catch(console.error);
}

main();
