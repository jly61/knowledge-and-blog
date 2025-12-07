/**
 * Tiptap 双向链接扩展
 *
 * 支持 [[笔记标题]] 语法的双向链接
 */

import { Node, mergeAttributes } from "@tiptap/core"
import { ReactRenderer } from "@tiptap/react"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { LinkPreview } from "@/components/notes/link-preview"
import React from "react"

export interface BidirectionalLinkOptions {
  HTMLAttributes: Record<string, any>
  noteTitleMap?: Map<string, string>
}

/**
 * 双向链接节点
 */
export const BidirectionalLink = Node.create<BidirectionalLinkOptions>({
  name: "bidirectionalLink",

  addOptions() {
    return {
      HTMLAttributes: {},
      noteTitleMap: new Map(),
    }
  },

  group: "inline",

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      noteTitle: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-note-title"),
        renderHTML: (attributes) => {
          if (!attributes.noteTitle) {
            return {}
          }
          return {
            "data-note-title": attributes.noteTitle,
          }
        },
      },
      noteId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-note-id"),
        renderHTML: (attributes) => {
          if (!attributes.noteId) {
            return {}
          }
          return {
            "data-note-id": attributes.noteId,
          }
        },
      },
      isBroken: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-broken") === "true",
        renderHTML: (attributes) => {
          if (!attributes.isBroken) {
            return {}
          }
          return {
            "data-broken": "true",
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="bidirectional-link"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    const noteTitle = node.attrs.noteTitle || ""
    const isBroken = node.attrs.isBroken

    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "bidirectional-link",
        class: isBroken
          ? "text-muted-foreground border-b border-dashed border-muted-foreground cursor-help"
          : "text-primary hover:underline font-medium cursor-pointer",
        title: isBroken ? "笔记不存在，点击创建" : `跳转到: ${noteTitle}`,
      }),
      noteTitle,
    ]
  },

  addNodeView() {
    return ({ node, editor }) => {
      const noteTitle = node.attrs.noteTitle || ""
      const noteId = node.attrs.noteId
      const isBroken = node.attrs.isBroken

      const dom = document.createElement("span")
      dom.setAttribute("data-type", "bidirectional-link")
      dom.className = isBroken
        ? "text-muted-foreground border-b border-dashed border-muted-foreground cursor-help"
        : "text-primary hover:underline font-medium cursor-pointer"

      if (!isBroken && noteId) {
        // 使用 LinkPreview 组件
        const reactRenderer = new ReactRenderer(LinkPreview, {
          props: { noteId },
          editor,
        })

        const linkElement = document.createElement("a")
        linkElement.href = `/notes/${noteId}`
        linkElement.textContent = noteTitle
        linkElement.className =
          "text-primary hover:underline font-medium cursor-pointer"
        linkElement.onclick = (e) => {
          e.preventDefault()
          // 在编辑器中，可以阻止默认跳转，或者打开新窗口
          window.open(`/notes/${noteId}`, "_blank")
        }

        dom.appendChild(linkElement)
        reactRenderer.dom.appendChild(linkElement)

        return {
          dom: reactRenderer.dom,
          destroy: () => {
            reactRenderer.destroy()
          },
        }
      } else {
        // 断链显示
        dom.textContent = noteTitle
        dom.title = "笔记不存在，点击创建"
        return {
          dom,
        }
      }
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("bidirectionalLinkHandler"),
        props: {
          handleKeyDown: (view, event) => {
            // 处理 [[ 输入，自动创建双向链接
            if (event.key === "[" && event.shiftKey) {
              const { state, dispatch } = view
              const { selection } = state
              const { $from } = selection

              // 检查光标前是否已经有 [
              const textBefore = state.doc.textBetween(
                Math.max(0, $from.pos - 1),
                $from.pos
              )

              if (textBefore === "[") {
                // 插入 [[
                const tr = state.tr.insertText("[[", $from.pos)
                dispatch(tr)
                return true
              }
            }

            return false
          },
        },
      }),
    ]
  },
})

