"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.generateSlug = generateSlug;
exports.extractExcerpt = extractExcerpt;
exports.formatDate = formatDate;
exports.formatRelativeTime = formatRelativeTime;
var clsx_1 = require("clsx");
var tailwind_merge_1 = require("tailwind-merge");
function cn() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
/**
 * 生成 URL 友好的 slug
 */
function generateSlug(text) {
    if (!text || text.trim() === '') {
        // 如果文本为空，生成一个基于时间戳的 slug
        return "post-".concat(Date.now());
    }
    var slug = text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // 移除特殊字符
        .replace(/[\s_-]+/g, '-') // 替换空格为连字符
        .replace(/^-+|-+$/g, ''); // 移除首尾连字符
    // 如果处理后的 slug 为空，使用时间戳
    if (!slug || slug === '') {
        slug = "post-".concat(Date.now());
    }
    return slug;
}
/**
 * 提取文本摘要
 */
function extractExcerpt(content, maxLength) {
    if (maxLength === void 0) { maxLength = 160; }
    // 移除 Markdown 语法
    var plainText = content
        .replace(/^#+\s+/gm, '') // 移除标题标记
        .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体
        .replace(/\*([^*]+)\*/g, '$1') // 移除斜体
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 移除链接，保留文本
        .replace(/`([^`]+)`/g, '$1') // 移除代码标记
        .replace(/\n+/g, ' ') // 替换换行为空格
        .trim();
    if (plainText.length <= maxLength) {
        return plainText;
    }
    return plainText.slice(0, maxLength).trim() + '...';
}
/**
 * 格式化日期
 */
function formatDate(date) {
    var d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d);
}
/**
 * 格式化相对时间
 */
function formatRelativeTime(date) {
    var d = typeof date === 'string' ? new Date(date) : date;
    var now = new Date();
    var diff = now.getTime() - d.getTime();
    var seconds = Math.floor(diff / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    if (days > 7) {
        return formatDate(d);
    }
    else if (days > 0) {
        return "".concat(days, "\u5929\u524D");
    }
    else if (hours > 0) {
        return "".concat(hours, "\u5C0F\u65F6\u524D");
    }
    else if (minutes > 0) {
        return "".concat(minutes, "\u5206\u949F\u524D");
    }
    else {
        return '刚刚';
    }
}
