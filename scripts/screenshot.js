#!/usr/bin/env node
/**
 * HTML 转图片截图工具
 * 使用 Playwright 将 HTML 页面截图
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function screenshot(inputPath, outputPath) {
  const absolutePath = path.resolve(inputPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`文件不存在: ${absolutePath}`);
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
      '--enable-automation',
      '--password-store=basic',
      '--use-mock-keychain',
      '--disable-features=TranslateUI',
      '--disable-popup-blocking',
      '--disable-notifications',
      '--headless=new'
    ]
  });

  try {
    // 直接使用 412 宽度原生渲染
    const page = await browser.newPage({
      viewport: { width: 412, height: 100 }
    });
    await page.goto(`file://${absolutePath}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const height = await page.evaluate(() => {
      const container = document.querySelector('.container') || document.querySelector('.mantra')?.parentElement || document.body;
      return Math.max(container.scrollHeight, document.documentElement.scrollHeight) + 40;
    });

    await page.setViewportSize({ width: 412, height });
    await page.screenshot({ path: outputPath, fullPage: false, type: 'png' });

    console.log(`图片已生成: ${outputPath}`);
    console.log(`尺寸: 412 x ${height}px`);
    return outputPath;

  } finally {
    await browser.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('用法: node scripts/screenshot.js <input.html> <output.png>');
    process.exit(1);
  }

  try {
    await screenshot(args[0], args[1]);
  } catch (error) {
    console.error('截图失败:', error.message);
    process.exit(1);
  }
}

main();
