const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

const TARGET_URL = 'https://www.wowhead.com/guide/midnight/raids/all-boss-cheat-sheets';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'bosses');

// Boss 中文名称映射（虚空尖塔 - Voidspire）
const BOSS_TRANSLATIONS = {
  // 虚空尖塔 (Voidspire)
  'imperator averzian': { cn: '元首阿福扎恩', raid: '虚空尖塔', note: '副本开门首领' },
  'vorasius': { cn: '瓦拉西斯', raid: '虚空尖塔', note: '巨型深渊掠食者' },
  'fallen-king salhadaar': { cn: '堕落之王萨尔哈达尔', raid: '虚空尖塔', note: '曾出现在 11.2 版本的剧情人物' },
  'vaelgor & ezzorak': { cn: '威厄高尔和艾佐拉克', raid: '虚空尖塔', note: '双龙议会型 Boss' },
  'lightblinded vanguard': { cn: '光芒先锋军', raid: '虚空尖塔', note: '守门首领，圣骑士议会风格' },
  'crown of the cosmos': { cn: '宇宙之冠', raid: '虚空尖塔', note: '虚空腐化的奥蕾莉亚' },
  'crown of the cosmos (alleria windrunner)': { cn: '宇宙之冠', raid: '虚空尖塔', note: '虚空腐化的奥蕾莉亚' },

  // 幽梦裂隙 (The Dreamrift)
  'chimaerus': { cn: '奇美鲁斯', raid: '幽梦裂隙', note: '' },

  // 奎尔丹纳斯进军 (March on Quel'Danas)
  'belo\'ren, child of al\'ar': { cn: '贝洛伦', raid: '奎尔丹纳斯进军', note: '阿莱之子' },
  'belo\'ren': { cn: '贝洛伦', raid: '奎尔丹纳斯进军', note: '阿莱之子' },
  'midnight falls': { cn: '午夜瀑布', raid: '奎尔丹纳斯进军', note: '' },
};

// 清理文件名（移除特殊字符）
function sanitizeFileName(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

// 清理目录名
function sanitizeDirName(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .trim();
}

// 查找 Boss 翻译
function findBossTranslation(enName) {
  const normalized = enName.toLowerCase().trim();

  // 精确匹配
  if (BOSS_TRANSLATIONS[normalized]) {
    return BOSS_TRANSLATIONS[normalized];
  }

  // 模糊匹配
  for (const [key, value] of Object.entries(BOSS_TRANSLATIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return null;
}

// 下载图片
function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    protocol.get(url, (response) => {
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(destPath);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// 自动滚动页面以触发懒加载
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

async function main() {
  console.log('Starting WoW Raid Boss scraper...');
  console.log(`Target URL: ${TARGET_URL}`);

  // 确保输出目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-sync',
      '--metrics-recording-only',
      '--no-first-run',
      '--safebrowsing-disable-auto-update',
      '--disable-component-update'
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('Navigating to page...');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('Waiting for content to load...');
    await page.waitForSelector('.guide-body, .guide-content, #infobox-parent', { timeout: 30000 }).catch(() => {
      console.log('Warning: Specific selectors not found, continuing anyway...');
    });

    // 滚动页面以触发懒加载
    console.log('Scrolling to trigger lazy loading...');
    await autoScroll(page);
    await page.waitForTimeout(3000);

    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);

    // 获取页面内容
    const pageContent = await page.evaluate(() => {
      const body = document.body;
      const mainSelectors = ['.guide-body', '.guide-content', '#guide-content', '.article-content', 'main', '.content'];
      let mainContent = null;
      for (const selector of mainSelectors) {
        mainContent = document.querySelector(selector);
        if (mainContent) break;
      }
      const content = mainContent || body;
      return {
        html: content.innerHTML,
        text: content.innerText
      };
    });

    console.log(`Content length: ${pageContent.text.length} characters`);

    // 解析 Boss 数据
    const bossData = await page.evaluate(() => {
      const bosses = [];

      // 查找所有 cheat sheet 图片
      const cheatSheetImages = document.querySelectorAll('img[src*="cheat"], img[alt*="cheat"], img[alt*="Cheat"]');

      cheatSheetImages.forEach((img) => {
        const alt = img.alt || '';
        const src = img.src || '';

        if (alt.toLowerCase().includes('cheat') || src.toLowerCase().includes('cheat')) {
          let bossName = alt
            .replace(/cheat\s*sheet/gi, '')
            .replace(/boss/gi, '')
            .trim();

          if (bossName && bossName.length > 2) {
            bosses.push({
              name: bossName,
              imageUrl: src,
              type: 'image'
            });
          }
        }
      });

      // 查找所有 Boss 标题
      const bossHeadings = document.querySelectorAll('h1[id*="cheat"], h2[id*="cheat"], h3[id*="cheat"], h4[id*="cheat"]');

      bossHeadings.forEach(heading => {
        const text = heading.textContent?.trim();
        const id = heading.id || '';

        if (text && !bosses.find(b => b.name === text.replace(/cheat\s*sheet/gi, '').trim())) {
          let bossName = text.replace(/cheat\s*sheet/gi, '').trim();
          if (bossName && bossName.length > 2) {
            let content = [];
            let sibling = heading.nextElementSibling;
            let count = 0;
            while (sibling && count < 20) {
              if (sibling.tagName?.match(/^H[1-3]$/)) break;
              const textContent = sibling.textContent?.trim();
              if (textContent && textContent.length > 10) {
                content.push(textContent);
              }
              sibling = sibling.nextElementSibling;
              count++;
            }

            bosses.push({
              name: bossName,
              content: content.join('\n\n'),
              type: 'text',
              id: id
            });
          }
        }
      });

      return bosses;
    });

    console.log(`Found ${bossData.length} boss sections`);

    // 过滤掉非 Boss 的条目
    const validBosses = bossData.filter(boss => {
      const name = boss.name.toLowerCase();
      return !name.includes('contribute') &&
             !name.includes('privacy') &&
             !name.includes('cookie') &&
             !name.includes('raid cheat sheet') &&
             !name.includes('overview') &&
             !name.includes('changelog');
    });

    console.log(`Valid bosses: ${validBosses.length}`);

    // 清理旧的目录结构
    const existingItems = fs.readdirSync(OUTPUT_DIR);
    existingItems.forEach(item => {
      const itemPath = path.join(OUTPUT_DIR, item);
      if (fs.statSync(itemPath).isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else if (!item.startsWith('_')) {
        fs.unlinkSync(itemPath);
      }
    });

    // 为每个 Boss 创建独立目录
    for (let index = 0; index < validBosses.length; index++) {
      const boss = validBosses[index];
      const translation = findBossTranslation(boss.name);
      const cnName = translation ? translation.cn : boss.name;
      const raidName = translation ? translation.raid : '未知副本';
      const note = translation ? translation.note : '';

      // 创建 Boss 目录名：序号-中文名
      const dirName = `${String(index + 1).padStart(2, '0')}-${sanitizeDirName(cnName)}`;
      const bossDir = path.join(OUTPUT_DIR, dirName);

      if (!fs.existsSync(bossDir)) {
        fs.mkdirSync(bossDir, { recursive: true });
      }

      console.log(`\nProcessing: ${cnName} (${boss.name})`);

      // 下载图片
      let imageFileName = null;
      if (boss.type === 'image' && boss.imageUrl) {
        const ext = boss.imageUrl.split('?')[0].split('.').pop() || 'png';
        imageFileName = `cheat-sheet.${ext}`;
        const imagePath = path.join(bossDir, imageFileName);

        try {
          console.log(`  Downloading image: ${boss.imageUrl}`);
          await downloadImage(boss.imageUrl, imagePath);
          console.log(`  Saved image: ${imagePath}`);
        } catch (err) {
          console.error(`  Failed to download image: ${err.message}`);
          imageFileName = null;
        }
      }

      // 创建 Markdown 文件
      const mdPath = path.join(bossDir, 'README.md');
      let markdown = `# ${cnName}\n\n`;
      markdown += `> **副本**: ${raidName}\n`;
      markdown += `> **英文名**: ${boss.name}\n`;
      if (note) {
        markdown += `> **备注**: ${note}\n`;
      }
      markdown += `\n> 来源: Wowhead Midnight Season 1 Raid Cheat Sheet\n\n`;
      markdown += `---\n\n`;

      if (imageFileName) {
        markdown += `## 攻略速查图\n\n`;
        markdown += `![${cnName} Cheat Sheet](./${imageFileName})\n\n`;
        markdown += `> **原图链接**: ${boss.imageUrl}\n\n`;
      }

      if (boss.content) {
        markdown += `## Boss 简介\n\n`;
        markdown += boss.content;
        markdown += `\n`;
      }

      // 如果既有图片又有内容，添加占位符供后续补充
      if (imageFileName) {
        markdown += `\n---\n\n`;
        markdown += `## 机制要点\n\n`;
        markdown += `> 待补充（从图片中提取）\n\n`;
        markdown += `### 坦克职责\n\n`;
        markdown += `- \n\n`;
        markdown += `### DPS 职责\n\n`;
        markdown += `- \n\n`;
        markdown += `### 治疗职责\n\n`;
        markdown += `- \n\n`;
        markdown += `### 关键技能\n\n`;
        markdown += `| 技能名 | 描述 | 应对 |\n`;
        markdown += `|--------|------|------|\n`;
        markdown += `| | | |\n`;
      }

      fs.writeFileSync(mdPath, markdown, 'utf-8');
      console.log(`  Created: ${mdPath}`);
    }

    // 保存原始内容到根目录
    const rawOutputPath = path.join(OUTPUT_DIR, '_raw_content.txt');
    fs.writeFileSync(rawOutputPath, pageContent.text, 'utf-8');
    console.log(`\nSaved raw content to: ${rawOutputPath}`);

    console.log('\n=== Scraping completed successfully! ===');
    console.log(`Total bosses: ${validBosses.length}`);

  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
