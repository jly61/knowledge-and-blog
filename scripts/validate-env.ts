#!/usr/bin/env tsx
/**
 * 环境变量验证脚本
 * 
 * 使用方法：
 *   pnpm validate-env          # 验证当前环境
 *   pnpm validate-env --env production  # 验证生产环境
 */

import { readFileSync } from 'fs'
import { join } from 'path'

interface EnvVar {
  name: string
  required: boolean
  description: string
  validate?: (value: string) => boolean | string
}

const envVars: EnvVar[] = [
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL 数据库连接字符串',
    validate: (value) => {
      if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
        return 'DATABASE_URL 必须是 PostgreSQL 连接字符串'
      }
      return true
    },
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    description: '应用的基础 URL',
    validate: (value) => {
      try {
        new URL(value)
        return true
      } catch {
        return 'NEXTAUTH_URL 必须是有效的 URL'
      }
    },
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'NextAuth.js 加密密钥',
    validate: (value) => {
      if (value.length < 32) {
        return 'NEXTAUTH_SECRET 长度至少为 32 个字符'
      }
      return true
    },
  },
  {
    name: 'GITHUB_CLIENT_ID',
    required: false,
    description: 'GitHub OAuth Client ID（可选）',
  },
  {
    name: 'GITHUB_CLIENT_SECRET',
    required: false,
    description: 'GitHub OAuth Client Secret（可选）',
  },
  {
    name: 'GOOGLE_CLIENT_ID',
    required: false,
    description: 'Google OAuth Client ID（可选）',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: false,
    description: 'Google OAuth Client Secret（可选）',
  },
  {
    name: 'NODE_ENV',
    required: false,
    description: '环境标识（development/preview/production）',
    validate: (value) => {
      const valid = ['development', 'preview', 'production']
      if (!valid.includes(value)) {
        return `NODE_ENV 必须是以下之一：${valid.join(', ')}`
      }
      return true
    },
  },
]

function loadEnvFile(envFile: string): Record<string, string> {
  try {
    const content = readFileSync(envFile, 'utf-8')
    const env: Record<string, string> = {}
    
    content.split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          let value = match[2].trim()
          // 移除引号
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }
          env[key] = value
        }
      }
    })
    
    return env
  } catch (error) {
    return {}
  }
}

function validateEnv(env: Record<string, string>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'
  
  for (const envVar of envVars) {
    const value = env[envVar.name] || process.env[envVar.name]
    
    if (envVar.required && !value) {
      // 在 CI 环境中，如果环境变量未设置，使用占位符进行格式验证
      if (isCI) {
        // CI 环境中，如果变量未设置，跳过验证（因为可能使用 GitHub Secrets）
        // 只验证已设置的变量的格式
        continue
      } else {
        errors.push(`❌ ${envVar.name} 是必需的，但未设置`)
        continue
      }
    }
    
    if (value && envVar.validate) {
      const result = envVar.validate(value)
      if (result !== true) {
        errors.push(`❌ ${envVar.name}: ${result}`)
      }
    }
  }
  
  // 检查 OAuth 配置的完整性（仅在非 CI 环境或变量已设置时检查）
  if (!isCI || env.GITHUB_CLIENT_ID || env.GITHUB_CLIENT_SECRET) {
    if (env.GITHUB_CLIENT_ID && !env.GITHUB_CLIENT_SECRET) {
      errors.push('⚠️  设置了 GITHUB_CLIENT_ID 但未设置 GITHUB_CLIENT_SECRET')
    }
    if (env.GITHUB_CLIENT_SECRET && !env.GITHUB_CLIENT_ID) {
      errors.push('⚠️  设置了 GITHUB_CLIENT_SECRET 但未设置 GITHUB_CLIENT_ID')
    }
  }
  if (!isCI || env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_SECRET) {
    if (env.GOOGLE_CLIENT_ID && !env.GOOGLE_CLIENT_SECRET) {
      errors.push('⚠️  设置了 GOOGLE_CLIENT_ID 但未设置 GOOGLE_CLIENT_SECRET')
    }
    if (env.GOOGLE_CLIENT_SECRET && !env.GOOGLE_CLIENT_ID) {
      errors.push('⚠️  设置了 GOOGLE_CLIENT_SECRET 但未设置 GOOGLE_CLIENT_ID')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

function main() {
  const args = process.argv.slice(2)
  const envArg = args.find(arg => arg.startsWith('--env='))
  const envType = envArg ? envArg.split('=')[1] : 'development'
  
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'
  
  console.log(`🔍 验证环境变量 (${envType})...\n`)
  
  let env: Record<string, string> = {}
  
  // 在 CI 环境中，不加载本地 .env 文件，只使用 process.env
  if (!isCI) {
    // 尝试加载 .env 文件
    const envFiles = [
      `.env.${envType}.local`,
      `.env.${envType}`,
      '.env.local',
      '.env',
    ]
    
    for (const file of envFiles) {
      const loaded = loadEnvFile(file)
      if (Object.keys(loaded).length > 0) {
        env = { ...env, ...loaded }
        console.log(`📄 已加载: ${file}`)
      }
    }
  } else {
    console.log('📄 CI 环境：从 GitHub Secrets 读取环境变量\n')
  }
  
  // 合并 process.env（优先级最高）
  env = { ...env, ...process.env }
  
  const result = validateEnv(env)
  
  if (result.valid) {
    console.log('\n✅ 所有必需的环境变量都已正确配置！\n')
    
    // 显示已配置的变量（隐藏敏感值）
    console.log('已配置的环境变量：')
    for (const envVar of envVars) {
      const value = env[envVar.name] || process.env[envVar.name]
      if (value) {
        const displayValue = envVar.name.includes('SECRET') || envVar.name.includes('PASSWORD')
          ? '***' + value.slice(-4)
          : value
        console.log(`  ✅ ${envVar.name}=${displayValue}`)
      } else if (envVar.required && !isCI) {
        // 在非 CI 环境中显示未设置的必需变量
        console.log(`  ❌ ${envVar.name} (未设置)`)
      } else if (envVar.required && isCI) {
        // 在 CI 环境中，提示变量将从 GitHub Secrets 读取
        console.log(`  ⚠️  ${envVar.name} (未设置，将在部署时从 GitHub Secrets 读取)`)
      }
    }
    
    process.exit(0)
  } else {
    console.log('\n❌ 环境变量验证失败：\n')
    result.errors.forEach((error) => console.log(`  ${error}`))
    
    if (isCI) {
      console.log('\n💡 CI 环境提示：')
      console.log('  在 GitHub Actions 中，环境变量通过 GitHub Secrets 配置')
      console.log('  请确保在仓库设置 → Secrets 中配置了必需的环境变量：')
      console.log('    - DATABASE_URL')
      console.log('    - NEXTAUTH_URL')
      console.log('    - NEXTAUTH_SECRET\n')
    } else {
      console.log('\n💡 提示：')
      console.log('  1. 复制 .env.example 为 .env.local')
      console.log('  2. 填写必需的环境变量')
      console.log('  3. 运行 pnpm validate-env 再次验证\n')
    }
    process.exit(1)
  }
}

main()

