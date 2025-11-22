"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createNote, updateNote } from "@/app/actions/notes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { DeleteNoteButton } from "@/components/notes/delete-note-button"

// 使用类型推断，避免直接导入可能不存在的类型
type Category = { id: string; name: string }
type Tag = { id: string; name: string }
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MarkdownSplitEditor } from "@/components/editor/markdown-split-editor"
import { Spinner } from "@/components/ui/spinner"

// 编辑笔记时需要的类型（不需要 links 和 backlinks）
type NoteForEditor = {
  id: string
  title: string
  content: string
  categoryId: string | null
  tags: Array<{ id: string; name: string }>
  isPinned?: boolean
  isFavorite?: boolean
  isMOC?: boolean
}

interface NoteEditorProps {
  note?: NoteForEditor
  categories: Category[]
  tags: Tag[]
  noteTitleMap?: Map<string, string>
}

export function NoteEditor({ note, categories, tags, noteTitleMap = new Map() }: NoteEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(note?.title || "")
  const [content, setContent] = useState(note?.content || "")
  const [categoryId, setCategoryId] = useState(note?.categoryId ?? "none")
  const [selectedTags, setSelectedTags] = useState<string[]>(
    note?.tags?.map((t: { id: string }) => t.id) || []
  )
  const [isPinned, setIsPinned] = useState(note?.isPinned || false)
  const [isFavorite, setIsFavorite] = useState(note?.isFavorite || false)
  const [isMOC, setIsMOC] = useState(note?.isMOC || false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      return
    }

    startTransition(async () => {
      try {
        if (note) {
          await updateNote(note.id, {
            title,
            content,
            categoryId: categoryId === "none" ? undefined : categoryId,
            tagIds: selectedTags,
            isPinned,
            isFavorite,
            isMOC,
          })
        } else {
          await createNote({
            title,
            content,
            categoryId: categoryId === "none" ? undefined : categoryId,
            tagIds: selectedTags,
            isMOC,
          })
        }
        router.push("/notes")
        router.refresh()
      } catch (error) {
        console.error("保存失败:", error)
        alert("保存失败，请重试")
      }
    })
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">标题</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入笔记标题..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">内容</Label>
        <MarkdownSplitEditor
          content={content}
          onChange={setContent}
          noteTitleMap={noteTitleMap}
          placeholder="使用 Markdown 格式编写，支持 [[双向链接]]..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">分类</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">无分类</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>标签</Label>
          <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
            {tags.length === 0 ? (
              <span className="text-sm text-muted-foreground">暂无标签</span>
            ) : (
              tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => toggleTag(tag.id)}
                  />
                  <span className="text-sm">{tag.name}</span>
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <Checkbox
            checked={isPinned}
            onCheckedChange={(checked) => setIsPinned(checked as boolean)}
          />
          <span>置顶</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <Checkbox
            checked={isFavorite}
            onCheckedChange={(checked) => setIsFavorite(checked as boolean)}
          />
          <span>收藏</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <Checkbox
            checked={isMOC}
            onCheckedChange={(checked) => setIsMOC(checked as boolean)}
          />
          <span>MOC (索引页)</span>
        </label>
      </div>

      <div className="flex justify-between items-center">
        {note && (
          <DeleteNoteButton
            noteId={note.id}
            noteTitle={note.title}
            hasPost={false}
          />
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            取消
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner className="mr-2" size="sm" />}
            {isPending ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </form>
  )
}

