你现在就可以先打开 http://localhost:3000/api/supabase-health 看返回。如果需要，我也能将你的 Vercel 域名加入 Supabase 设置并对生产环境做一次完整联通验证。

- 设置 .env.local：
- NEXT_PUBLIC_SUPABASE_URL=你的 URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 ANON KEY
- APP_ACCESS_PASSWORD=你的密码
- 重启开发服务器（确保环境变量生效）
- 打开 http://localhost:3000/access，输入密码进入首页
- 登录 Supabase（ http://localhost:3000/login ），登录成功后：
- 新建文档、编辑并保存
- 查看侧边栏文档列表（来自 Supabase）
- 切换文档会优先从 Supabase加载

- 现在的 AI 不再强行进行任务分类 ，而是专注于识别行内的 语义片段 (Semantic Segments) 。
- 它能识别 content （主要内容）、 url （链接）、 note （备注）、 tag （标签）、 code （代码）以及 unknown （未知片段）。


- 默认是否开启自动保存 ：修改 lib/store.ts 中的 autoSaveEnabled 。
- 默认文档内容 ：修改 lib/constants.ts 中的 INITIAL_NODES 。
- 设置界面的行为 ：修改 components/ui/SettingsModal.tsx 。