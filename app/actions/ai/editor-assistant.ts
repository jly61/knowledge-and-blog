/**
 * AI 编辑器助手类型定义
 *
 * 用于编辑器副驾驶功能：润色、扩写、缩写、翻译
 * 实际实现已移至 /app/api/ai/editor-assistant/route.ts
 */

/**
 * 编辑器操作类型
 */
export type EditorAction = "polish" | "expand" | "summarize" | "translate"

/**
 * 翻译目标语言
 */
export type TargetLanguage = "en" | "zh" | "ja" | "ko" | "fr" | "de" | "es"

