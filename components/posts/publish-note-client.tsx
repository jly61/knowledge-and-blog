"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { publishNoteAsPost } from "@/app/actions/posts"
import { generateSEO } from "@/app/actions/ai/seo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { Sparkles } from "lucide-react"

interface PublishNoteClientProps {
  note: {
    id: string
    title: string
    content: string
    excerpt: string | null
    categoryId: string | null
    tags: Array<{ id: string; name: string }>
    postId: string | null
  }
  categories: Array<{ id: string; name: string; color?: string | null }>
  tags: Array<{ id: string; name: string; color?: string | null }>
}

export function PublishNoteClient({ note, categories, tags }: PublishNoteClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [metaTitle, setMetaTitle] = useState(note.title)
  const [metaDescription, setMetaDescription] = useState(note.excerpt || "")
  const [categoryId, setCategoryId] = useState(note.categoryId || "none")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    note.tags.map((tag) => tag.id)
  )
  const [coverImage, setCoverImage] = useState("")
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false)

  /**
   * 使用 AI 生成 SEO 元数据
   */
  const handleGenerateSEO = async () => {
    setIsGeneratingSEO(true)
    try {
      const seoData = await generateSEO(note.title, note.content)
      
      // 填充生成的 SEO 数据
      if (seoData.metaTitle) {
        setMetaTitle(seoData.metaTitle)
      }
      if (seoData.metaDescription) {
        setMetaDescription(seoData.metaDescription)
      }
      
      toast.success("SEO 元数据生成成功")
    } catch (error) {
      console.error("SEO generation error:", error)
      toast.error(
        error instanceof Error
          ? `生成失败: ${error.message}`
          : "SEO 生成失败，请稍后重试"
      )
    } finally {
      setIsGeneratingSEO(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      try {
        const post = await publishNoteAsPost(note.id, {
          metaTitle: metaTitle || undefined,
          metaDescription: metaDescription || undefined,
          categoryId: categoryId === "none" ? undefined : categoryId,
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
          coverImage: coverImage || undefined,
        })

        toast.success(note.postId ? "文章更新成功" : "文章发布成功")
        router.push(`/blog/${post.slug}`)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "发布失败")
      }
    })
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>文章信息</CardTitle>
          <CardDescription>
            {note.postId
              ? "更新文章信息，内容将从笔记同步"
              : "设置文章的基本信息和 SEO 元数据"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="metaTitle">SEO 标题</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateSEO}
                disabled={isGeneratingSEO || isPending}
                className="gap-2"
              >
                {isGeneratingSEO ? (
                  <>
                    <Spinner size="sm" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI 生成
                  </>
                )}
              </Button>
            </div>
            <Input
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="用于 SEO 的标题（默认使用笔记标题）"
            />
            <p className="text-sm text-muted-foreground">
              如果不填写，将使用笔记标题
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription">SEO 描述</Label>
            <Textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="文章摘要，用于 SEO 和预览"
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              点击上方的"AI 生成"按钮可自动生成 SEO 标题和描述
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImage">封面图 URL</Label>
            <Input
              id="coverImage"
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>分类和标签</CardTitle>
          <CardDescription>设置文章的分类和标签</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="category">分类</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无分类</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>标签</Label>
            <div className="flex flex-wrap gap-2 mt-2 p-2 border rounded-md min-h-[40px]">
              {tags.length === 0 ? (
                <span className="text-sm text-muted-foreground">暂无标签</span>
              ) : (
                tags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={selectedTagIds.includes(tag.id)}
                      onCheckedChange={() => toggleTag(tag.id)}
                    />
                    <Label
                      htmlFor={`tag-${tag.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {tag.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner className="mr-2" size="sm" />}
          {note.postId ? "更新文章" : "发布文章"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          取消
        </Button>
      </div>
    </form>
  )
}

