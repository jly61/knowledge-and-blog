"use client"

import { useState, useTransition } from "react"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"
import { deletePost } from "@/app/actions/posts"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

interface DeletePostButtonProps {
  postId: string
  postTitle: string
  variant?: "default" | "destructive" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function DeletePostButton({
  postId,
  postTitle,
  variant = "destructive",
  size = "default",
}: DeletePostButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deletePost(postId)
        toast.success("文章已删除")
        router.push("/blog")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "删除失败")
      } finally {
        setIsOpen(false)
      }
    })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Spinner className="mr-2" size="sm" />
            删除中...
          </>
        ) : (
          <>
            <Trash2 className="mr-2 h-4 w-4" />
            删除文章
          </>
        )}
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除文章</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除文章 &quot;{postTitle}&quot; 吗？
            <br />
            <span className="mt-2 block text-destructive">
              此操作无法撤销。如果文章关联了笔记，笔记的发布状态将被清除，但笔记内容会保留。
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "删除中..." : "确认删除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

