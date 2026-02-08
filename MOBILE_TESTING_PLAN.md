# 移动端适配渐进式测试计划

**项目：** Tree Index 大纲编辑器
**创建日期：** 2026-02-08
**版本：** v1.0

---

## 一、测试方法和工具

### 1.1 开发阶段测试（实时）

**Chrome DevTools 设备模拟**
```bash
1. 打开 Chrome DevTools (F12)
2. 点击设备工具栏图标 (Ctrl+Shift+M)
3. 选择设备：iPhone SE, iPhone 12 Pro, iPad
4. 测试响应式断点：320px, 375px, 768px, 1024px
```

### 1.2 真机测试（Phase 完成后）⭐ 关键

**方法1：局域网访问**
```bash
# 1. 启动开发服务器
npm run dev

# 2. 查看本机 IP
# Linux/Mac: ifconfig | grep inet
# Windows: ipconfig

# 3. 手机浏览器访问
http://你的IP:3000
```

**方法2：ngrok 公网访问**
```bash
npx ngrok http 3000
# 用手机访问 ngrok 提供的 URL
```

### 1.3 自动化测试（可选）

**Playwright 移动端测试**
```bash
npm install -D @playwright/test
npx playwright test --project="Mobile Chrome"
```

---

## 二、Phase 1 测试用例（布局适配）

### ✅ 测试用例 1.1：侧边栏响应式

| 测试项 | 操作步骤 | 预期结果 | 测试设备 |
|--------|---------|---------|---------|
| **桌面端默认显示** | 1. 访问首页<br>2. 屏幕宽度 ≥ 1024px | 侧边栏始终可见，占据左侧 256px | Chrome 1920x1080 |
| **移动端默认隐藏** | 1. 访问首页<br>2. 屏幕宽度 < 1024px | 侧边栏隐藏在屏幕左侧 | iPhone SE (375px) |
| **汉堡菜单打开** | 1. 点击左上角汉堡图标<br>2. 观察动画 | 侧边栏从左滑入<br>显示遮罩层<br>动画流畅（300ms） | iPhone 12 Pro |
| **遮罩层关闭** | 1. 打开侧边栏<br>2. 点击遮罩层 | 侧边栏滑出<br>遮罩层淡出 | iPad (768px) |
| **滑动手势关闭** | 1. 打开侧边栏<br>2. 向左滑动 | 侧边栏跟随手指滑出 | 真机测试 ⭐ |

**Playwright 测试脚本：**
```typescript
// tests/sidebar.spec.ts
import { test, expect } from '@playwright/test';

test.describe('侧边栏响应式', () => {
  test('移动端默认隐藏', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -256, 0)');
  });

  test('点击汉堡菜单打开', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    
    await page.click('[data-testid="hamburger-menu"]');
    await page.waitForTimeout(300); // 等待动画
    
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  });

  test('点击遮罩层关闭', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    
    await page.click('[data-testid="hamburger-menu"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="overlay"]');
    await page.waitForTimeout(300);
    
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -256, 0)');
  });
});
```

### ✅ 测试用例 1.2：底部工具栏

| 测试项 | 操作步骤 | 预期结果 | 测试设备 |
|--------|---------|---------|---------|
| **移动端显示** | 1. 访问首页<br>2. 屏幕 < 1024px | 底部固定工具栏可见<br>包含：保存、撤销、AI、更多 | iPhone 12 |
| **桌面端隐藏** | 1. 访问首页<br>2. 屏幕 ≥ 1024px | 底部工具栏不显示 | Chrome 桌面 |
| **按钮可点击** | 1. 点击"保存"按钮<br>2. 点击"撤销"按钮 | 功能正常触发<br>有视觉反馈（active 状态） | 真机 ⭐ |
| **虚拟键盘适配** | 1. 点击节点编辑<br>2. 弹出键盘 | 工具栏上移或隐藏<br>不遮挡输入框 | iPhone 真机 ⭐ |
| **安全区域** | 1. iPhone X 及以上<br>2. 查看底部间距 | 工具栏不被底部横条遮挡 | iPhone 13 |

### 📋 Phase 1 手动测试清单

```markdown
## Phase 1 完成后必做测试

### 桌面端（Chrome DevTools）
- [ ] 1920x1080：侧边栏可见，底部工具栏隐藏
- [ ] 1024x768：侧边栏可见，底部工具栏隐藏
- [ ] 调整窗口大小：断点切换流畅

### 移动端（Chrome DevTools）
- [ ] 375x667 (iPhone SE)：侧边栏隐藏，底部工具栏显示
- [ ] 390x844 (iPhone 12)：布局正常
- [ ] 414x896 (iPhone 12 Pro Max)：布局正常
- [ ] 768x1024 (iPad)：侧边栏隐藏，底部工具栏显示

### 真机测试（⭐ 关键！必须测试）
- [ ] 打开/关闭侧边栏：动画流畅，无卡顿
- [ ] 底部工具栏：按钮大小合适（拇指可轻松点击）
- [ ] 虚拟键盘：弹出时工具栏不遮挡输入
- [ ] 滚动：页面滚动流畅，无抖动
- [ ] 遮罩层：点击关闭侧边栏正常
```

---

## 三、Phase 2 测试用例（内容优化）

### ✅ 测试用例 2.1：节点编辑

| 测试项 | 操作步骤 | 预期结果 | 测试设备 |
|--------|---------|---------|---------|
| **触摸区域** | 1. 点击节点折叠按钮<br>2. 测量点击区域 | 按钮至少 44x44px<br>容易点击 | 真机 ⭐ |
| **长按菜单** | 1. 长按节点（500ms）<br>2. 观察工具栏 | 显示上下文工具栏<br>包含：加粗、斜体、删除等 | 真机 ⭐ |
| **文本编辑** | 1. 点击节点文本<br>2. 输入内容 | 光标定位准确<br>键盘不遮挡输入框 | 真机 ⭐ |
| **拖拽排序** | 1. 长按节点<br>2. 拖动到新位置 | 拖拽流畅<br>有视觉反馈 | 真机 ⭐ |
| **间距调整** | 1. 查看节点间距<br>2. 对比桌面端 | 移动端间距更紧凑<br>不拥挤 | iPhone 12 |

### ✅ 测试用例 2.2：模态框适配

| 测试项 | 操作步骤 | 预期结果 | 测试设备 |
|--------|---------|---------|---------|
| **设置弹窗** | 1. 打开设置<br>2. 移动端查看 | 全屏显示<br>可滚动<br>关闭按钮可见 | iPhone 12 |
| **AI 重组弹窗** | 1. 打开 AI 重组<br>2. 输入内容 | 弹窗高度自适应<br>键盘不遮挡输入 | 真机 ⭐ |
| **滚动锁定** | 1. 打开弹窗<br>2. 尝试滚动背景 | 背景不可滚动<br>关闭后恢复滚动位置 | 真机 ⭐ |
| **图片预览** | 1. 点击图片<br>2. 查看预览 | 全屏预览<br>可缩放<br>可关闭 | iPhone 12 |

### 📋 Phase 2 手动测试清单

```markdown
## Phase 2 完成后必做测试

### 节点交互（真机测试）
- [ ] 折叠/展开按钮：点击区域足够大
- [ ] 长按节点：500ms 后显示工具栏
- [ ] 文本编辑：光标定位准确
- [ ] 拖拽排序：流畅无卡顿

### 模态框（真机测试）
- [ ] 设置弹窗：全屏显示，可滚动
- [ ] AI 弹窗：键盘不遮挡输入
- [ ] 滚动锁定：背景不可滚动
- [ ] 图片预览：全屏，可缩放

### 工具栏（真机测试）
- [ ] 上下文工具栏：位置合适，不遮挡内容
- [ ] 按钮大小：至少 44x44px
- [ ] 视觉反馈：点击有 active 状态
```

---

## 四、Phase 3 测试用例（性能优化）

### ✅ 测试用例 3.1：Lighthouse 性能测试

**测试步骤：**
```bash
1. 打开 Chrome DevTools
2. 切换到 Lighthouse 标签
3. 选择"移动端"
4. 勾选"性能"、"可访问性"、"最佳实践"
5. 点击"生成报告"
```

**目标指标：**
| 指标 | 目标值 | 说明 |
|------|--------|------|
| Performance | > 85 | 性能评分 |
| Accessibility | > 90 | 可访问性 |
| Best Practices | > 90 | 最佳实践 |
| FCP | < 2.5s | 首次内容绘制 |
| LCP | < 3.5s | 最大内容绘制 |
| TTI | < 4.5s | 可交互时间 |
| CLS | < 0.1 | 累积布局偏移 |

### ✅ 测试用例 3.2：真机性能测试

| 测试项 | 操作步骤 | 预期结果 | 测试设备 |
|--------|---------|---------|---------|
| **首屏加载** | 1. 清除缓存<br>2. 刷新页面<br>3. 计时 | < 3秒显示内容 | 真机 4G 网络 |
| **滚动性能** | 1. 创建 50+ 节点<br>2. 快速滚动 | 60fps 流畅滚动<br>无白屏 | 真机 ⭐ |
| **图片加载** | 1. 插入 10 张图片<br>2. 滚动查看 | 懒加载生效<br>不阻塞滚动 | 真机 |
| **内存占用** | 1. 长时间使用<br>2. 查看内存 | 无内存泄漏<br>< 100MB | Chrome DevTools |

### 📋 Phase 3 手动测试清单

```markdown
## Phase 3 完成后必做测试

### Lighthouse 测试
- [ ] 移动端性能评分 > 85
- [ ] 桌面端性能评分 > 90
- [ ] 可访问性评分 > 90
- [ ] FCP < 2.5s
- [ ] LCP < 3.5s

### 真机性能测试
- [ ] 首屏加载 < 3秒（4G 网络）
- [ ] 滚动流畅（60fps）
- [ ] 图片懒加载正常
- [ ] 长时间使用无卡顿
```

---

## 五、兼容性测试矩阵

| 设备/浏览器 | 屏幕尺寸 | 优先级 | 测试内容 | 状态 |
|------------|---------|--------|---------|------|
| **iPhone SE** | 375x667 | 🔴 高 | 最小屏幕适配 | ⬜ 待测试 |
| **iPhone 12/13** | 390x844 | 🔴 高 | 主流设备 | ⬜ 待测试 |
| **iPhone 12 Pro Max** | 428x926 | 🟡 中 | 大屏手机 | ⬜ 待测试 |
| **iPad** | 768x1024 | 🟡 中 | 平板竖屏 | ⬜ 待测试 |
| **iPad Pro** | 1024x1366 | 🟢 低 | 平板横屏 | ⬜ 待测试 |
| **Android (Chrome)** | 360x640 | 🔴 高 | Android 主流 | ⬜ 待测试 |
| **Android (Samsung)** | 412x915 | 🟡 中 | 三星浏览器 | ⬜ 待测试 |

---

## 六、快速测试脚本

### 6.1 自动启动测试环境

创建 `scripts/test-mobile.sh`：

```bash
#!/bin/bash

echo "🚀 移动端适配测试脚本"
echo "======================="

# 1. 启动开发服务器
echo "📦 启动开发服务器..."
npm run dev &
SERVER_PID=$!
sleep 5

# 2. 获取本机 IP
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    IP=$(hostname -I | awk '{print $1}')
elif [[ "$OSTYPE" == "darwin"* ]]; then
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
fi

echo ""
echo "📱 手机访问地址: http://$IP:3000"
echo "💻 本地访问地址: http://localhost:3000"
echo ""

# 3. 测试提示
echo "🔧 测试步骤："
echo "1. 打开 Chrome: http://localhost:3000"
echo "2. 按 F12 打开 DevTools"
echo "3. 按 Ctrl+Shift+M 切换设备模式"
echo "4. 测试以下设备："
echo "   - iPhone SE (375x667)"
echo "   - iPhone 12 Pro (390x844)"
echo "   - iPad (768x1024)"
echo ""
echo "5. 真机测试："
echo "   - 手机浏览器访问: http://$IP:3000"
echo ""

# 4. 等待测试完成
read -p "按 Enter 键停止服务器..."
kill $SERVER_PID
echo "✅ 测试完成"
```

**使用方法：**
```bash
chmod +x scripts/test-mobile.sh
./scripts/test-mobile.sh
```

### 6.2 Playwright 配置

创建 `playwright.config.ts`：

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 七、测试报告模板

### 7.1 Phase 测试报告

```markdown
# Phase X 测试报告

**测试日期：** 2026-02-XX
**测试人员：** XXX
**测试环境：** Chrome DevTools + iPhone 12 真机

## 测试结果总览

| 类别 | 通过 | 失败 | 待修复 |
|------|------|------|--------|
| 布局适配 | 8 | 1 | 1 |
| 交互功能 | 6 | 0 | 0 |
| 性能指标 | 4 | 1 | 1 |

## ✅ 通过的测试

- [x] 侧边栏响应式（桌面端/移动端）
- [x] 底部工具栏显示/隐藏
- [x] 汉堡菜单动画流畅
- [x] 节点点击区域足够大
- [x] 模态框全屏显示

## ❌ 失败的测试

### 1. 虚拟键盘弹出时工具栏被遮挡
- **问题描述：** iPhone 12 上输入时，底部工具栏遮挡输入框
- **复现步骤：** 
  1. 点击节点编辑
  2. 弹出虚拟键盘
  3. 输入框被工具栏遮挡
- **严重程度：** 🔴 高
- **建议修复：** 实现 useVirtualKeyboard hook，键盘弹出时隐藏工具栏

## ⚠️ 需要改进

### 1. 侧边栏动画在低端设备上有轻微卡顿
- **问题描述：** Android 低端设备上动画不够流畅
- **严重程度：** 🟡 中
- **建议：** 使用 transform 替代 left/right 属性，启用 GPU 加速

## 性能数据

| 指标 | 目标 | 实际 | 状态 |
|------|------|------|------|
| Lighthouse 性能 | > 85 | 87 | ✅ |
| FCP | < 2.5s | 2.1s | ✅ |
| LCP | < 3.5s | 2.8s | ✅ |
| TTI | < 4.5s | 3.2s | ✅ |
| CLS | < 0.1 | 0.05 | ✅ |

## 截图

（附上关键问题的截图）

## 下一步行动

1. 🔴 修复虚拟键盘遮挡问题（优先级：高）
2. 🟡 优化侧边栏动画性能（优先级：中）
3. ✅ 进入 Phase 2 测试
```

---

## 八、常见问题和解决方案

### Q1: 真机测试时无法访问本地服务器？

**解决方案：**
```bash
# 1. 确保手机和电脑在同一 WiFi
# 2. 检查防火墙设置
# Linux:
sudo ufw allow 3000

# Mac:
# 系统偏好设置 → 安全性与隐私 → 防火墙 → 防火墙选项 → 允许 Node

# 3. 使用 0.0.0.0 启动服务器
# package.json
"dev": "next dev -H 0.0.0.0"
```

### Q2: Chrome DevTools 设备模拟不准确？

**解决方案：**
- DevTools 只能模拟屏幕尺寸，无法模拟真实的触摸事件和性能
- **关键交互必须真机测试**：虚拟键盘、手势、滚动性能

### Q3: Playwright 测试失败？

**解决方案：**
```bash
# 1. 安装浏览器
npx playwright install

# 2. 调试模式运行
npx playwright test --debug

# 3. 查看测试报告
npx playwright show-report
```

---

## 九、测试时间表

| 阶段 | 测试内容 | 预计时间 | 负责人 |
|------|---------|---------|--------|
| **Phase 1** | 布局适配测试 | 1-2天 | XXX |
| **Phase 2** | 内容优化测试 | 2-3天 | XXX |
| **Phase 3** | 性能测试 | 1-2天 | XXX |
| **回归测试** | 全功能测试 | 1天 | XXX |
| **总计** | | 5-8天 | |

---

## 十、总结

### 测试优先级

🔴 **必须测试（真机）：**
1. 侧边栏打开/关闭手感
2. 底部工具栏按钮大小
3. 虚拟键盘交互
4. 滚动性能

🟡 **重要测试（DevTools + 真机）：**
1. 响应式断点切换
2. 模态框适配
3. 节点编辑交互

🟢 **可选测试（DevTools）：**
1. 不同设备尺寸
2. 横屏/竖屏切换

### 关键建议

1. **每个 Phase 完成后立即测试**，不要等到最后
2. **真机测试不可省略**，模拟器无法替代
3. **优先测试核心交互**，次要功能可以后测
4. **记录测试结果**，便于追踪问题

---

**文档版本：** v1.0
**创建日期：** 2026-02-08
**维护者：** Tree Index Team


