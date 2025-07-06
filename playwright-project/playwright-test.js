// 简单的Playwright测试脚本
const { chromium } = require('playwright');

(async () => {
  console.log('启动Playwright测试...');
  
  // 启动浏览器
  const browser = await chromium.launch();
  console.log('浏览器已启动');
  
  // 创建新页面
  const page = await browser.newPage();
  console.log('页面已创建');
  
  // 访问百度
  console.log('正在访问百度...');
  await page.goto('https://www.baidu.com');
  
  // 获取页面标题
  const title = await page.title();
  console.log(`页面标题: ${title}`);
  
  // 截图（可选）
  await page.screenshot({ path: 'screenshot.png' });
  console.log('截图已保存为screenshot.png');
  
  // 关闭浏览器
  await browser.close();
  console.log('测试完成，浏览器已关闭');
})().catch(error => {
  console.error('测试过程中出现错误:', error);
});