"use client"

import { useState } from "react"
import { CommentItem } from "./comment-item"
import { CommentForm } from "./comment-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

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

interface CommentListProps {
  postId: string
  comments: Comment[]
  currentUserId?: string
}

export function CommentList({ postId, comments, currentUserId }: CommentListProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          评论 ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 评论表单 */}
        <CommentForm postId={postId} />

        {/* 评论列表 */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>还没有评论，来发表第一条评论吧！</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={postId}
                currentUserId={currentUserId}
                replyingTo={replyingTo}
                onReply={setReplyingTo}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

