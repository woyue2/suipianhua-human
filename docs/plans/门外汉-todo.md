- 现在的 AI 不再强行进行任务分类 ，而是专注于识别行内的 语义片段 (Semantic Segments) 。
- 它能识别 content （主要内容）、 url （链接）、 note （备注）、 tag （标签）、 code （代码）以及 unknown （未知片段）。


- 默认是否开启自动保存 ：修改 lib/store.ts 中的 autoSaveEnabled 。
- 默认文档内容 ：修改 lib/constants.ts 中的 INITIAL_NODES 。
- 设置界面的行为 ：修改 components/ui/SettingsModal.tsx 。