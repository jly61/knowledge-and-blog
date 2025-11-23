#!/bin/bash
# 部署回滚脚本
#
# 使用方法：
#   ./scripts/rollback.sh [version]
#   ./scripts/rollback.sh previous  # 回滚到上一个版本
#   ./scripts/rollback.sh <deployment-url>  # 回滚到指定部署

set -e

VERSION=${1:-"previous"}

echo "🔄 开始回滚部署..."
echo "回滚到版本: $VERSION"

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "❌ 未安装 Vercel CLI"
  echo "安装方法: npm i -g vercel"
  echo ""
  echo "或者访问 Vercel Dashboard 手动回滚："
  echo "1. 访问 https://vercel.com/dashboard"
  echo "2. 选择项目"
  echo "3. 进入 Deployments"
  echo "4. 找到要回滚的版本，点击 'Promote to Production'"
  exit 1
fi

# 检查是否已登录
if ! vercel whoami &> /dev/null; then
  echo "❌ 未登录 Vercel"
  echo "请先运行: vercel login"
  exit 1
fi

# 执行回滚
echo "执行回滚操作..."
vercel rollback "$VERSION"

echo ""
echo "✅ 回滚完成！"
echo ""
echo "💡 提示："
echo "  - 检查应用是否正常运行"
echo "  - 验证核心功能"
echo "  - 查看错误日志"

