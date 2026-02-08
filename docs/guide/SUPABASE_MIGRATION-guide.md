# 🚀 Supabase 迁移指南

## 何时迁移？

当你需要以下功能时，就该迁移了：
- ✅ 多设备同步（电脑、手机、平板）
- ✅ 云端备份（防止数据丢失）
- ✅ 多人协作
- ✅ 随时随地访问

## 迁移步骤

### 第 1 步：创建 Supabase 项目

1. **注册账号**
   - 访问 https://supabase.com
   - 使用 GitHub 账号登录（推荐）

2. **创建项目**
   ```
   Organization: 你的组织名
   Project Name: tree-index
   Database Password: 设置一个强密码（保存好！）
   Region: Singapore 或 Tokyo（离中国最近）
   ```

3. **等待项目创建**（约 2 分钟）

### 第 2 步：创建数据库表

在 Supabase Dashboard → SQL Editor 中执行：

```sql
-- 创建文档表
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  root JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引（提升查询性能）
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_updated_at ON documents(updated_at DESC);

-- 启用行级安全（RLS）
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 创建安全策略（用户只能访问自己的文档）
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- 创建自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 第 3 步：安装依赖

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 第 4 步：配置环境变量

在项目根目录创建 `.env.local`：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=你的项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon key

# 在 Supabase Dashboard → Settings → API 中找到这两个值
```

### 第 5 步：创建 Supabase 客户端

创建 `lib/supabase.ts`：

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// 类型定义
export type Document = Database['public']['Tables']['documents']['Row']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']
```

### 第 6 步：生成 TypeScript 类型

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 生成类型定义
supabase gen types typescript --project-id "你的项目ID" > types/supabase.ts
```

### 第 7 步：替换数据库操作

#### 原来的代码（IndexedDB）

```typescript
// lib/db.ts
export const documentDb = {
  async saveDocument(document: Document) {
    await db.documents.put(document);
  },

  async loadDocument(documentId: string) {
    return await db.documents.get(documentId);
  },

  async listDocuments() {
    return await db.documents.toArray();
  },

  async deleteDocument(documentId: string) {
    await db.documents.delete(documentId);
  }
};
```

#### 新的代码（Supabase）

```typescript
// lib/supabase-db.ts
import { supabase } from './supabase'
import { Document } from '@/types'

export const documentDb = {
  // 保存文档
  async saveDocument(document: Document) {
    const { data, error } = await supabase
      .from('documents')
      .upsert({
        id: document.id,
        title: document.title,
        root: document.root,
        metadata: document.metadata,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 加载单个文档
  async loadDocument(documentId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (error) throw error
    return data
  },

  // 获取所有文档
  async listDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data
  },

  // 删除文档
  async deleteDocument(documentId: string) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (error) throw error
  },

  // 搜索文档
  async searchDocuments(query: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, updated_at')
      .ilike('title', `%${query}%`)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data
  }
}
```

### 第 8 步：添加身份验证

创建 `components/auth/AuthProvider.tsx`：

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### 第 9 步：添加登录页面

创建 `app/login/page.tsx`：

```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (isSignUp) {
        await signUp(email, password)
        alert('注册成功！请查收邮件验证')
      } else {
        await signIn(email, password)
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">
          {isSignUp ? '注册' : '登录'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            {isSignUp ? '注册' : '登录'}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-sm text-blue-600 hover:underline"
        >
          {isSignUp ? '已有账号？登录' : '没有账号？注册'}
        </button>
      </div>
    </div>
  )
}
```

### 第 10 步：更新 Store

修改 `lib/store.ts`，将 `documentDb` 导入改为 Supabase 版本：

```typescript
// 原来
import { documentDb } from '@/lib/db'

// 改为
import { documentDb } from '@/lib/supabase-db'

// 其他代码保持不变！
```

### 第 11 步：添加实时同步（可选）

```typescript
// lib/store.ts 中添加
useEffect(() => {
  const channel = supabase
    .channel('documents')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'documents',
      },
      (payload) => {
        console.log('文档变化:', payload)
        // 重新加载文档列表
        fetchDocuments()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

## 数据迁移

### 从 IndexedDB 导出数据

```typescript
// 在浏览器控制台执行
import Dexie from 'dexie'

const db = new Dexie('OutlineEditorDB')
db.version(1).stores({ documents: '++id, documentId' })

const docs = await db.documents.toArray()
console.log(JSON.stringify(docs, null, 2))
// 复制输出的 JSON
```

### 导入到 Supabase

```typescript
// 创建迁移脚本 scripts/migrate.ts
import { supabase } from '@/lib/supabase'
import oldData from './old-data.json'

async function migrate() {
  for (const doc of oldData) {
    await supabase.from('documents').insert({
      id: doc.data.id,
      title: doc.data.title,
      root: doc.data.root,
      metadata: doc.data.metadata,
    })
  }
  console.log('迁移完成！')
}

migrate()
```

## 测试清单

- [ ] 创建文档
- [ ] 编辑文档
- [ ] 删除文档
- [ ] 搜索文档
- [ ] 多设备同步
- [ ] 登录/登出
- [ ] 实时更新

## 常见问题

### Q: 迁移后原来的数据怎么办？
A: 可以保留 IndexedDB 作为本地缓存，或者导出后删除。

### Q: 免费额度够用吗？
A: 500MB 数据库 + 50,000 活跃用户，对个人项目绰绰有余。

### Q: 如何备份数据？
A: Supabase 自动备份，也可以定期导出 JSON。

### Q: 性能会变慢吗？
A: 网络请求会有延迟（50-200ms），但可以用乐观更新优化。

## 优化建议

1. **乐观更新**：先更新 UI，后台同步
2. **本地缓存**：结合 IndexedDB 做离线支持
3. **批量操作**：减少网络请求次数
4. **懒加载**：只加载需要的数据

## 总结

迁移到 Supabase 的好处：
- ✅ 无需手写 API
- ✅ 自动多设备同步
- ✅ 云端备份
- ✅ 免费额度充足
- ✅ 实时订阅
- ✅ 内置身份验证

代码改动量：
- 核心改动：`lib/db.ts` → `lib/supabase-db.ts`
- 其他代码：几乎不用改！

迁移时间：约 2-4 小时

现在不着急迁移，等需要多设备同步时再迁移即可！🚀

