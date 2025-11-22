"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updatePost } from "@/app/actions/posts"
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
import { DeletePostButton } from "@/components/posts/delete-post-button"
import { ImageUploadButton } from "@/components/upload/image-upload-button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface PostEditorProps {
  post: {
    id: string
    title: string
    content: string
    excerpt: string | null
    metaTitle: string | null
    metaDescription: string | null
    coverImage: string | null
    categoryId: string | null
    tags: Array<{ id: string; name: string }>
    published: boolean
  }
  categories: Array<{ id: string; name: string; color?: string | null }>
  tags: Array<{ id: string; name: string; color?: string | null }>
}

export function PostEditor({ post, categories, tags }: PostEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(post.title)
  const [content, setContent] = useState(post.content)
  const [excerpt, setExcerpt] = useState(post.excerpt || "")
  const [metaTitle, setMetaTitle] = useState(post.metaTitle || post.title)
  const [metaDescription, setMetaDescription] = useState(post.metaDescription || post.excerpt || "")
  const [coverImage, setCoverImage] = useState(post.coverImage || "")
  const [categoryId, setCategoryId] = useState(post.categoryId || "none")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    post.tags.map((tag) => tag.id)
  )
  const [published, setPublished] = useState(post.published)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast.error("标题和内容不能为空")
      return
    }

    startTransition(async () => {
      try {
        const updated = await updatePost(post.id, {
          title,
          content,
          excerpt: excerpt || undefined,
          metaTitle: metaTitle || undefined,
          metaDescription: metaDescription || undefined,
          coverImage: coverImage || undefined,
          categoryId: categoryId === "none" ? undefined : categoryId,
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
          published,
        })

        toast.success("文章更新成功")
        router.push(`/blog/${updated.slug}`)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "更新失败")
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

  const handleImageUpload = (url: string) => {
    // 获取文本区域引用
    const textarea = document.getElementById("content") as HTMLTextAreaElement
    if (!textarea) return

    // 获取光标位置
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const textBefore = content.substring(0, start)
    const textAfter = content.substring(end)

    // 插入 Markdown 图片语法
    const imageMarkdown = `![图片](${url})`
    const newContent = textBefore + imageMarkdown + textAfter

    setContent(newContent)

    // 设置光标位置到插入内容之后
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + imageMarkdown.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>设置文章的标题和内容</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入文章标题..."
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">内容</Label>
              <ImageUploadButton
                onUploadComplete={handleImageUpload}
                variant="outline"
                size="sm"
              />
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="使用 Markdown 格式编写..."
              rows={20}
              required
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              提示：使用 <code>[[笔记标题]]</code> 创建双向链接，点击"上传图片"按钮插入图片
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">摘要</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="文章摘要，用于预览和 SEO"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO 设置</CardTitle>
          <CardDescription>优化搜索引擎收录</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">SEO 标题</Label>
            <Input
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="用于 SEO 的标题（默认使用文章标题）"
            />
            <p className="text-sm text-muted-foreground">
              如果不填写，将使用文章标题
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription">SEO 描述</Label>
            <Textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="文章描述，用于 SEO 和预览"
              rows={3}
            />
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

      <Card>
        <CardHeader>
          <CardTitle>发布设置</CardTitle>
          <CardDescription>控制文章的发布状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="published"
              checked={published}
              onCheckedChange={(checked) => setPublished(checked === true)}
            />
            <Label htmlFor="published" className="cursor-pointer">
              发布文章（公开可见）
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-between">
        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存更改
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
        <DeletePostButton postId={post.id} postTitle={post.title} />
      </div>
    </form>
  )
}

