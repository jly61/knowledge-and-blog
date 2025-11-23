#!/usr/bin/env tsx
/**
 * 环境切换脚本
 * 
 * 使用方法：
 *   pnpm switch-env development
 *   pnpm switch-env preview
 *   pnpm switch-env production
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const envFiles = {
  development: '.env.development.local',
  preview: '.env.preview.local',
  production: '.env.production.local',
}

function main() {
  const args = process.argv.slice(2)
  const targetEnv = args[0] as keyof typeof envFiles

  if (!targetEnv || !envFiles[targetEnv]) {
    console.error('❌ 请指定环境: development, preview, 或 production')
    console.log('\n使用方法:')
    console.log('  pnpm switch-env development')
    console.log('  pnpm switch-env preview')
    console.log('  pnpm switch-env production')
    process.exit(1)
  }

  const targetFile = envFiles[targetEnv]
  const exampleFile = '.env.example'

  console.log(`🔄 切换到 ${targetEnv} 环境...`)

  // 如果目标文件不存在，从 .env.example 创建
  if (!existsSync(targetFile)) {
    if (existsSync(exampleFile)) {
      const example = readFileSync(exampleFile, 'utf-8')
      writeFileSync(targetFile, example)
      console.log(`✅ 已创建 ${targetFile}（从 .env.example）`)
    } else {
      console.log(`⚠️  ${targetFile} 不存在，请手动创建`)
    }
  }

  console.log(`✅ 环境已切换到: ${targetEnv}`)
  console.log(`📄 配置文件: ${targetFile}`)
  console.log('\n💡 提示:')
  console.log('  1. 编辑配置文件填写实际值')
  console.log('  2. 运行 pnpm validate-env 验证配置')
}

main()

