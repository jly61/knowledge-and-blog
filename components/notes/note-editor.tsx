"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createNote, updateNote } from "@/app/actions/notes"
import { recommendTags } from "@/app/actions/ai/tags"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { DeleteNoteButton } from "@/components/notes/delete-note-button"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"

// 使用类型推断，避免直接导入可能不存在的类型
type Category = { id: string; name: string }
type Tag = { id: string; name: string }
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { TiptapSplitEditor } from "@/components/editor/tiptap-split-editor"
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
  const [isRecommendingTags, setIsRecommendingTags] = useState(false)

  /**
   * 使用 AI 推荐标签和分类
   */
  const handleRecommendTags = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("请先填写标题和内容")
      return
    }

    setIsRecommendingTags(true)
    try {
      const recommendation = await recommendTags(title, content, selectedTags)

      // 应用推荐的标签（合并，不覆盖已选择的）
      if (recommendation.tagIds.length > 0) {
        const newTags = [...new Set([...selectedTags, ...recommendation.tagIds])]
        setSelectedTags(newTags)
        toast.success(`已推荐 ${recommendation.tagIds.length} 个标签`)
      } else {
        toast.info("未找到合适的标签推荐")
      }

      // 应用推荐的分类（如果推荐了分类且当前没有分类）
      if (recommendation.categoryId && categoryId === "none") {
        setCategoryId(recommendation.categoryId)
        toast.success("已推荐分类")
      }
    } catch (error) {
      console.error("Tag recommendation error:", error)
      toast.error(
        error instanceof Error
          ? `推荐失败: ${error.message}`
          : "标签推荐失败，请稍后重试"
      )
    } finally {
      setIsRecommendingTags(false)
    }
  }

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
        <TiptapSplitEditor
          content={content}
          onChange={setContent}
          noteTitleMap={noteTitleMap}
          placeholder="使用 Markdown 格式编写，支持 [[双向链接]]..."
          currentNoteId={note?.id}
          enableLinkSuggestions={true}
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
          <div className="flex items-center justify-between">
            <Label>标签</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRecommendTags}
              disabled={isRecommendingTags || isPending || !title.trim() || !content.trim()}
              className="gap-2"
            >
              {isRecommendingTags ? (
                <>
                  <Spinner size="sm" />
                  推荐中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI 推荐
                </>
              )}
            </Button>
          </div>
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
          <p className="text-sm text-muted-foreground">
            点击"AI 推荐"按钮可自动推荐合适的标签和分类
          </p>
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

