"use client"

import { useState } from "react"
import { formatRelativeTime } from "@/lib/utils"
import { CommentForm } from "./comment-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Reply, Trash2 } from "lucide-react"
import { deleteComment } from "@/app/actions/comments"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Comment {
  id: string
  content: string
  authorName: string
  authorEmail: string | null
  authorUrl: string | null
  createdAt: Date
  user: {
    id: string
    name: string | null
    image: string | null
  } | null
  replies?: Comment[]
}

interface CommentItemProps {
  comment: Comment
  postId: string
  currentUserId?: string
  replyingTo: string | null
  onReply: (commentId: string | null) => void
}

export function CommentItem({
  comment,
  postId,
  currentUserId,
  replyingTo,
  onReply,
}: CommentItemProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const isAuthor = currentUserId && comment.user?.id === currentUserId
  const isReplying = replyingTo === comment.id

  const handleDelete = async () => {
    if (!confirm("确定要删除这条评论吗？")) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteComment(comment.id)
      toast.success("评论已删除")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {/* 头像 */}
            <div className="flex-shrink-0">
              {comment.user?.image ? (
                <img
                  src={comment.user.image}
                  alt={comment.user.name || comment.authorName}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {comment.authorName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* 评论内容 */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {comment.user ? (
                  <span className="font-medium">{comment.user.name || comment.authorName}</span>
                ) : comment.authorUrl ? (
                  <Link
                    href={comment.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                  >
                    {comment.authorName}
                  </Link>
                ) : (
                  <span className="font-medium">{comment.authorName}</span>
                )}
                <span className="text-sm text-muted-foreground">
                  {formatRelativeTime(comment.createdAt)}
                </span>
              </div>

              <div className="text-sm whitespace-pre-wrap">{comment.content}</div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    onReply(isReplying ? null : comment.id)
                  }}
                >
                  <Reply className="w-4 h-4 mr-1" />
                  回复
                </Button>
                {isAuthor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    删除
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 回复表单 */}
      {isReplying && (
        <div className="ml-14">
          <CommentForm postId={postId} parentId={comment.id} onSuccess={() => onReply(null)} />
        </div>
      )}

      {/* 回复列表 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-14 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              replyingTo={replyingTo}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}

