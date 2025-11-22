"use client"

import { useEffect, useState, useTransition } from "react"
import { Spinner } from "@/components/ui/spinner"
import { createComment } from "@/app/actions/comments"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface CommentFormProps {
  postId: string
  parentId?: string
  onSuccess?: () => void
}

export function CommentForm({ postId, parentId, onSuccess }: CommentFormProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState("")
  const [authorName, setAuthorName] = useState("")
  const [authorEmail, setAuthorEmail] = useState("")
  const [authorUrl, setAuthorUrl] = useState("")

  // 当 session 加载完成后，更新 authorName
  useEffect(() => {
    if (status === "authenticated" && session?.user?.name) {
      setAuthorName(session.user.name)
    }
  }, [session, status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast.error("请输入评论内容")
      return
    }

    // 如果用户已登录，使用 session 中的信息；否则需要用户输入姓名
    const finalAuthorName = session?.user?.name || authorName.trim()
    
    if (!finalAuthorName) {
      toast.error("请输入您的姓名")
      return
    }

    

    startTransition(async () => {
      try {
        // 如果用户已登录，使用 session 中的信息
        const finalAuthorName = session?.user?.name || authorName.trim()
        const finalAuthorEmail = session?.user?.email || authorEmail || undefined
        
        await createComment(postId, {
          content,
          authorName: finalAuthorName,
          authorEmail: finalAuthorEmail,
          authorUrl: authorUrl || undefined,
          parentId,
        })

        toast.success(parentId ? "回复成功" : "评论成功，已显示")
        setContent("")
        if (!session?.user) {
          setAuthorName("")
          setAuthorEmail("")
          setAuthorUrl("")
        }
        // 等待一小段时间确保数据库已更新，然后刷新
        setTimeout(() => {
          router.refresh()
        }, 100)
        onSuccess?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "评论失败")
      }
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="content">
              {parentId ? "回复" : "发表评论"}
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={parentId ? "写下你的回复..." : "写下你的评论..."}
              rows={4}
              required
              disabled={isPending}
            />
          </div>

          {!session?.user && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="authorName">姓名 *</Label>
                <Input
                  id="authorName"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="您的姓名"
                  required
                  disabled={isPending}
                />
              </div>
              <div>
                <Label htmlFor="authorEmail">邮箱</Label>
                <Input
                  id="authorEmail"
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isPending}
                />
              </div>
              <div>
                <Label htmlFor="authorUrl">网站</Label>
                <Input
                  id="authorUrl"
                  type="url"
                  value={authorUrl}
                  onChange={(e) => setAuthorUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  disabled={isPending}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !content.trim()}>
              {isPending && <Spinner className="mr-2" size="sm" />}
              {isPending ? "提交中..." : parentId ? "回复" : "发表评论"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

