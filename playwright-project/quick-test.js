// 快速测试Playwright是否正常工作
const { chromium } = require('playwright');

(async () => {
  try {
    console.log('🚀 开始快速测试Playwright...');
    
    // 启动浏览器（无头模式，更快）
    const browser = await chromium.launch({ headless: true });
    console.log('✅ 浏览器启动成功');
    
    // 创建页面
    const page = await browser.newPage();
    console.log('✅ 页面创建成功');
    
    // 访问简单页面
    await page.goto('data:text/html,<h1>Playwright测试页面</h1>');
    console.log('✅ 页面导航成功');
    
    // 获取页面内容
    const content = await page.textContent('h1');
    console.log(`✅ 页面内容获取成功: ${content}`);
    
    // 关闭浏览器
    await browser.close();
    console.log('✅ 浏览器关闭成功');
    
    console.log('\n🎉 Playwright安装测试完全成功！');
    console.log('📋 测试结果:');
    console.log('   - 浏览器启动: ✅');
    console.log('   - 页面操作: ✅');
    console.log('   - 内容获取: ✅');
    console.log('   - 资源清理: ✅');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
})();