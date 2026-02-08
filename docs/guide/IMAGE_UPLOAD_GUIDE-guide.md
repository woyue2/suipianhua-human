# 图片插入功能实现说明

## 已完成的工作

### 1. Store 添加 removeImage 方法
在 `lib/store.ts` 中已添加：
- 类型定义：`removeImage: (nodeId: string, imageId: string) => void;`
- 实现方法：从节点的 images 数组中删除指定图片

### 2. 创建的组件

#### ImageUploader.tsx
- 位置：`components/editor/ImageUploader.tsx`
- 功能：
  - 文件选择和上传
  - 从 localStorage 读取图床配置
  - 调用 `/api/upload` 接口上传图片
  - 上传成功后调用 `addImage` 添加到节点
  - 显示上传状态（上传中/错误提示）

#### NodeImages.tsx
- 位置：`components/editor/NodeImages.tsx`
- 功能：
  - 显示节点的所有图片（靠左排列，从左到右）
  - 图片悬停显示删除按钮
  - 点击图片可预览大图
  - 支持删除图片

### 3. 需要手动修改 OutlineNode.tsx

由于自动修改遇到问题，请手动进行以下修改：

#### 步骤 1：添加 import 语句（第9行后）
```typescript
import { TagList } from './TagList';
import { ImageUploader } from './ImageUploader';
import { NodeImages } from './NodeImages';
```

#### 步骤 2：修改按钮图标（区分子节点和兄弟节点）
找到这两行（约第223-226行）：
```typescript
// 原来：
<span className="text-lg">+</span>  // 添加子节点
<span className="text-lg">+</span>  // 添加同级节点

// 改为：
<span className="text-lg">⤵️</span>  // 添加子节点
<span className="text-lg">➕</span>  // 添加同级节点
```

#### 步骤 3：在工具栏添加图片上传按钮（约第232行）
在删除按钮后添加：
```typescript
              <button onClick={() => deleteNode(nodeId)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors" title="删除">
                <span className="text-lg">🗑</span>
              </button>
              {/* 添加以下两行 */}
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />
              <ImageUploader nodeId={nodeId} />
            </>
```

#### 步骤 4：添加图片显示区域（约第200行）
在 TagList 后面添加：
```typescript
            {tags && tags.length > 0 && (
              <TagList tags={tags} onRemove={removeTag} />
            )}
          </div>

          {/* 添加以下部分 */}
          {/* 图片显示区域 - 在节点内容下方 */}
          {node.images && node.images.length > 0 && (
            <NodeImages nodeId={nodeId} images={node.images} />
          )}
        </div>
      </div>
```

## 使用方法

1. **上传图片**：
   - 悬停在节点上1秒，显示操作工具栏
   - 点击最右侧的 🖼️ 按钮
   - 选择图片文件
   - 等待上传完成

2. **查看图片**：
   - 图片会显示在节点内容下方
   - 靠左排列，从左到右
   - 点击图片可预览大图

3. **删除图片**：
   - 悬停在图片上
   - 点击右上角的 × 按钮
   - 确认删除

## 配置要求

使用前需要在设置中配置图床：
1. 点击右上角设置按钮
2. 选择图床提供商（Imgur / SM.MS / 自定义）
3. 输入 API Key
4. 保存设置

## 技术细节

- 图片上传通过后端代理 `/api/upload` 完成
- 支持的图片格式：PNG, JPEG, JPG, GIF, WEBP
- 最大文件大小：5MB
- 图片 URL 存储在节点的 `images` 数组中
- 图片数据结构：`ImageAttachment` 包含 id, url, width, height 等信息

