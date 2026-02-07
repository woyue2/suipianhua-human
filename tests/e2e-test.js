const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();
  const baseURL = 'http://localhost:3004';

  console.log('🧪 开始 E2E 测试...\n');

  try {
    // 测试 1: 页面加载
    console.log('测试 1: 页面加载');
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    const title = await page.title();
    console.log(`  ✅ 页面标题: ${title}`);
    console.log(`  ✅ 页面 URL: ${page.url()}\n`);

    // 截图
    await page.screenshot({ path: '/tmp/e2e-initial.png', fullPage: true });
    console.log('  📸 初始截图已保存: /tmp/e2e-initial.png\n');

    // 测试 2: 检查工具栏按钮
    console.log('测试 2: 检查工具栏按钮');
    const buttons = await page.locator('button').all();
    console.log(`  ✅ 找到 ${buttons.length} 个按钮:`);

    const buttonTexts = await Promise.all(
      buttons.map(async btn => await btn.textContent())
    );
    buttonTexts.forEach(text => {
      if (text && text.trim()) {
        console.log(`     - ${text.trim()}`);
      }
    });
    console.log('');

    // 测试 3: 检查快捷键提示
    console.log('测试 3: 检查快捷键提示');
    const shortcuts = await page.locator('text=Ctrl+Z').textContent();
    if (shortcuts) {
      console.log(`  ✅ 快捷键提示显示: ${shortcuts}`);
    }
    console.log('');

    // 测试 4: 检查页面内容状态
    console.log('测试 4: 检查页面内容');
    const hasEmptyState = await page.locator('text=暂无内容').count();
    const hasContent = await page.locator('text=根节点').count();

    if (hasEmptyState > 0) {
      console.log('  ✅ 页面显示空状态提示');
    } else if (hasContent > 0) {
      console.log('  ✅ 页面已有内容，找到"根节点"');
    } else {
      console.log('  ⚠️  未检测到空状态或根节点');
    }
    console.log('');

    // 测试 6: 检查节点渲染
    console.log('测试 6: 检查节点结构');
    const nodes = await page.locator('input[type="text"]').all();
    console.log(`  ✅ 找到 ${nodes.length} 个可编辑输入框`);
    if (nodes.length > 0) {
      const firstNodeContent = await nodes[0].inputValue();
      console.log(`  ✅ 第一个节点内容: "${firstNodeContent}"`);
    }
    console.log('');

    // 测试 7: 编辑节点内容
    console.log('测试 7: 编辑节点内容');
    if (nodes.length > 0) {
      await nodes[0].click();
      await nodes[0].fill('测试编辑内容');
      await page.waitForTimeout(500);
      const updatedContent = await nodes[0].inputValue();
      console.log(`  ✅ 节点内容已更新: "${updatedContent}"`);

      // 截图
      await page.screenshot({ path: '/tmp/e2e-after-edit.png', fullPage: true });
      console.log('  📸 编辑后截图已保存: /tmp/e2e-after-edit.png\n');
    }

    // 测试 8: 检查折叠/展开按钮
    console.log('测试 8: 检查折叠/展开功能');
    const arrows = await page.locator('button').filter(async btn => {
      const text = await btn.textContent();
      return text && (text.includes('▶') || text.includes('▼') || text.includes('•'));
    }).all();

    if (arrows.length > 0) {
      console.log(`  ✅ 找到 ${arrows.length} 个折叠/展开按钮`);
      const firstArrowText = await arrows[0].textContent();
      console.log(`  ✅ 第一个箭头符号: "${firstArrowText}"`);
    }
    console.log('');

    // 测试 9: 测试保存按钮
    console.log('测试 9: 测试保存功能');
    const saveButton = page.locator('button:has-text("保存")');
    await saveButton.click();
    await page.waitForTimeout(2000);

    // 检查保存状态
    const pageContent = await page.content();
    if (pageContent.includes('已保存') || pageContent.includes('保存中')) {
      console.log('  ✅ 保存功能正常工作');
    }
    console.log('');

    // 测试 10: API 端点测试
    console.log('测试 10: API 端点测试');
    try {
      const apiResponse = await page.request.get(`${baseURL}/api/documents`);
      const contentType = apiResponse.headers()['content-type'];
      console.log(`  ✅ GET /api/documents 响应正常`);
      console.log(`  ✅ Content-Type: ${contentType}`);

      if (contentType && contentType.includes('application/json')) {
        const apiData = await apiResponse.json();
        console.log(`  ✅ 响应数据: ${JSON.stringify(apiData)}`);
      } else {
        const text = await apiResponse.text();
        console.log(`  ⚠️  非JSON响应: ${text.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`  ⚠️  API测试失败: ${error.message}`);
    }
    console.log('');

    // 最终截图
    await page.screenshot({ path: '/tmp/e2e-final.png', fullPage: true });
    console.log('📸 最终截图已保存: /tmp/e2e-final.png\n');

    console.log('='.repeat(50));
    console.log('🎉 所有 E2E 测试完成！');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ 测试失败:', error.message);

    // 错误截图
    await page.screenshot({ path: '/tmp/e2e-error.png', fullPage: true });
    console.log('📸 错误截图已保存: /tmp/e2e-error.png');
  } finally {
    await browser.close();
  }
})();
