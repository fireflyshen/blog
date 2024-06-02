#!/bin/zsh
# 切换到博客根目录
cd /Users/firefly/Blog/blog # 确保这里是你的博客根目录

# 添加所有更改
# git add .

# 提交更改
# git commit -m "Auto deploy commit"

# 删除旧的dist目录
# rm -rf dist

# 编译生成新的dist文件
# npm run build

# 添加dist文件到Git
git add .

# 提交更改
git commit -m "Auto deploy commit"

# 推送到GitHub
git push origin main  # 根据你的分支名调整

echo "Blog has been deployed successfully!"

