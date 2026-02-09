# Git 凭证配置指南

本指南介绍如何配置 Git 凭证，避免每次推送时重复输入密码。

## 问题描述

当使用 HTTPS 方式推送到 GitHub 时，出现以下错误：

```
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/username/repo.git'
```

这是因为 GitHub 已弃用密码认证，需要使用 Personal Access Token (PAT)。

## 解决方案

### 步骤 1：生成 GitHub Personal Access Token

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置 token 名称和过期时间
4. 选择所需的权限（至少勾选 `repo`）
5. 点击 "Generate token"
6. **重要**：复制生成的 token（只显示一次）

### 步骤 2：配置 Git Credential Helper

#### 方法 A：自动存储（推荐）

```bash
# 1. 设置 credential helper
git config --global credential.helper store

# 2. 将凭据写入 ~/.git-credentials
echo "https://用户名:你的token@github.com" >> ~/.git-credentials

# 示例：
# echo "https://woyue2:ghp_xxxxxxxxxxxx@github.com" >> ~/.git-credentials
```

#### 方法 B：首次推送时输入

```bash
# 1. 设置 credential helper
git config --global credential.helper store

# 2. 尝试推送，会提示输入用户名和密码
git push
# Username: 你的 GitHub 用户名
# Password: 粘贴你的 token（不是 GitHub 密码）
```

### 步骤 3：验证配置

```bash
# 查看当前 remote 配置
git remote -v

# 尝试推送
git push
```

推送成功后，以后就不需要再输入密码了。

## 其他认证方式

### 使用 SSH 认证

如果更倾向于使用 SSH，可以切换 remote URL：

```bash
# 切换到 SSH URL
git remote set-url origin git@github.com:用户名/仓库名.git

# 例如：
# git remote set-url origin git@github.com:woyue2/suipianhua-human.git
```

前提是你已经配置了 SSH 密钥并添加到 GitHub。

### 使用 GitHub CLI (gh)

```bash
# 安装 gh 后
gh auth login

# 之后 gh 会自动处理认证
```

## 常见问题

### Q: 为什么每次打开终端都要重新配置？

A: 这通常是因为 credential helper 没有正确配置。确保执行了：
```bash
git config --global credential.helper store
```

### Q: Token 保存在哪里？

A: 保存在 `~/.git-credentials` 文件中，格式为：
```
https://用户名:token@github.com
```

### Q: 如何更新 Token？

A: 编辑 `~/.git-credentials` 文件，替换旧的 token 即可。

### Q: 如何撤销配置？

A: 删除凭据文件并重置配置：
```bash
rm ~/.git-credentials
git config --global --unset credential.helper
```

## 安全建议

1. **定期轮换 Token**：建议设置 token 的过期时间，并定期更新
2. **限制权限**：只授予必要的权限范围
3. **不要分享**：Token 相当于密码，不要分享给他人
4. **使用 SSH**：对于长期使用的项目，SSH 密钥更安全

## 总结

| 方法 | 优点 | 缺点 |
|------|------|------|
| HTTPS + Token | 简单，跨平台 | Token 可能过期 |
| SSH | 更安全，无需 token | 需要配置 SSH 密钥 |
| GitHub CLI | 官方工具，功能丰富 | 需要额外安装 |

选择适合你的方式，配置一次即可永久使用。
