#!/usr/bin/env node
/**
 * 开发服务器 - 持续运行，浏览所有攻略 HTML
 *
 * 用法: npm run dev
 * 访问: http://localhost:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PROJECT_DIR = process.cwd();

// MIME 类型
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

// 支持的图片扩展名
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

// 查找所有攻略文件
function findAllFiles() {
  const bossesDir = path.join(PROJECT_DIR, 'docs', 'bosses');
  if (!fs.existsSync(bossesDir)) return [];

  const files = [];
  const dirs = fs.readdirSync(bossesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const dir of dirs) {
    const dirPath = path.join(bossesDir, dir.name);
    const mdPath = path.join(dirPath, 'README.md');
    const htmlPath = path.join(dirPath, 'README.html');

    // 查找目录下的所有图片
    const images = [];
    if (fs.existsSync(dirPath)) {
      const dirFiles = fs.readdirSync(dirPath);
      for (const file of dirFiles) {
        const ext = path.extname(file).toLowerCase();
        if (IMAGE_EXTS.includes(ext)) {
          images.push({
            name: file,
            path: `docs/bosses/${dir.name}/${file}`
          });
        }
      }
    }

    files.push({
      name: dir.name,
      hasMd: fs.existsSync(mdPath),
      hasHtml: fs.existsSync(htmlPath),
      hasImages: images.length > 0,
      images: images,
      mdPath: `docs/bosses/${dir.name}/README.md`,
      htmlPath: `docs/bosses/${dir.name}/README.html`
    });
  }
  return files;
}

// 生成首页
function generateIndex(files) {
  const listHtml = files.map(f => `
    <div class="boss-card ${f.hasHtml || f.hasImages ? '' : 'disabled'}">
      <div class="boss-info">
        <span class="boss-name">${f.name}</span>
        <span class="boss-status">
          ${f.hasHtml ? '<a href="' + f.htmlPath + '">✅ HTML</a>' : ''}
          ${f.hasImages ? '<a href="#" class="img-link" data-images=\'' + JSON.stringify(f.images) + '\'>🖼️ 图(' + f.images.length + ')</a>' : ''}
          ${f.hasMd ? '<a href="' + f.mdPath + '">📄 MD</a>' : ''}
          ${!f.hasMd && !f.hasHtml && !f.hasImages ? '❌ 无文件' : ''}
        </span>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WoW 攻略卡片浏览器</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Microsoft YaHei", sans-serif;
      background: #0D0D1A;
      color: #E0E0E0;
      min-height: 100vh;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #FFD700;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header p {
      color: #888;
      font-size: 14px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .boss-card {
      background: #1A1A2E;
      border: 1px solid #4A4A6A;
      border-radius: 8px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s;
    }
    .boss-card:hover:not(.disabled) {
      border-color: #FF6B00;
      background: #1F1F35;
    }
    .boss-card.disabled {
      opacity: 0.5;
    }
    .boss-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .boss-name {
      font-size: 16px;
      font-weight: 500;
    }
    .boss-status {
      font-size: 12px;
      color: #888;
    }
    .boss-status a {
      color: #FFD700;
      text-decoration: none;
      margin-left: 8px;
      cursor: pointer;
    }
    .boss-status a:hover {
      text-decoration: underline;
    }
    .stats {
      text-align: center;
      margin-bottom: 20px;
      color: #888;
      font-size: 14px;
    }
    .stats span {
      margin: 0 15px;
    }
    .stats .count {
      color: #FFD700;
      font-weight: bold;
    }
    /* 图片预览模态框 */
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 1000;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    }
    .modal.active {
      display: flex;
    }
    .modal-content {
      max-width: 95%;
      max-height: 90%;
      object-fit: contain;
    }
    .modal-close {
      position: absolute;
      top: 20px;
      right: 30px;
      color: #FFD700;
      font-size: 30px;
      cursor: pointer;
    }
    .modal-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      color: #FFD700;
      font-size: 40px;
      cursor: pointer;
      user-select: none;
      padding: 20px;
    }
    .modal-nav:hover {
      color: #FF6B00;
    }
    .modal-prev { left: 20px; }
    .modal-next { right: 20px; }
    .modal-info {
      color: #888;
      margin-top: 15px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎮 WoW 攻略卡片浏览器</h1>
    <p>点击查看 HTML/MD 文件 | 点击 🖼️图 预览攻略图片 | 端口 ${PORT}</p>
  </div>
  <div class="stats">
    <span>HTML: <span class="count" id="html-count">0</span></span>
    <span>图片: <span class="count" id="img-count">0</span></span>
    <span>MD: <span class="count" id="md-count">0</span></span>
  </div>
  <div class="grid" id="file-list">
    ${listHtml}
  </div>

  <!-- 图片预览模态框 -->
  <div class="modal" id="image-modal">
    <span class="modal-close" onclick="closeModal()">&times;</span>
    <span class="modal-nav modal-prev" onclick="prevImage()">&#10094;</span>
    <img class="modal-content" id="modal-image" src="">
    <span class="modal-nav modal-next" onclick="nextImage()">&#10095;</span>
    <div class="modal-info" id="modal-info"></div>
  </div>

  <script>
    // 统计
    document.getElementById('html-count').textContent =
      document.querySelectorAll('.boss-status a[href$=".html"]').length;
    document.getElementById('img-count').textContent =
      document.querySelectorAll('.img-link').length;
    document.getElementById('md-count').textContent =
      document.querySelectorAll('.boss-card').length;

    // 图片预览
    let currentImages = [];
    let currentIndex = 0;

    document.querySelectorAll('.img-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        currentImages = JSON.parse(link.dataset.images);
        currentIndex = 0;
        showImage();
      });
    });

    function showImage() {
      const img = currentImages[currentIndex];
      document.getElementById('modal-image').src = img.path;
      document.getElementById('modal-info').textContent =
        img.name + ' (' + (currentIndex + 1) + '/' + currentImages.length + ')';
      document.getElementById('image-modal').classList.add('active');
    }

    function closeModal() {
      document.getElementById('image-modal').classList.remove('active');
    }

    function prevImage() {
      if (currentIndex > 0) {
        currentIndex--;
        showImage();
      }
    }

    function nextImage() {
      if (currentIndex < currentImages.length - 1) {
        currentIndex++;
        showImage();
      }
    }

    // 键盘导航
    document.addEventListener('keydown', (e) => {
      if (!document.getElementById('image-modal').classList.contains('active')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    });

    // 点击背景关闭
    document.getElementById('image-modal').addEventListener('click', (e) => {
      if (e.target.id === 'image-modal') closeModal();
    });
  </script>
</body>
</html>`;
}

// 主函数
function main() {
  const files = findAllFiles();

  console.log(`\n🎮 WoW 攻略卡片浏览器`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`HTML 文件: ${files.filter(f => f.hasHtml).length}`);
  console.log(`MD 文件: ${files.filter(f => f.hasMd).length}`);
  console.log(`预览地址: http://localhost:${PORT}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // 首页
    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(generateIndex(findAllFiles()));
      return;
    }

    // 静态文件（docs/ 目录下的文件）
    try {
      const filePath = path.join(PROJECT_DIR, decodeURIComponent(url.pathname));
      console.log('请求文件:', filePath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fs.readFileSync(filePath));
        return;
      }
    } catch (e) {
      console.error('文件访问错误:', e.message);
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found: ' + url.pathname);
  });

  server.listen(PORT, () => {
    console.log('✅ 服务器已启动');
    console.log('💡 按 Ctrl+C 停止\n');
  });
}

main();
