"use client"

import { useState, useTransition } from "react"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"
import { deleteNote } from "@/app/actions/notes"
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

interface DeleteNoteButtonProps {
  noteId: string
  noteTitle: string
  hasPost?: boolean
  variant?: "default" | "destructive" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function DeleteNoteButton({
  noteId,
  noteTitle,
  hasPost = false,
  variant = "destructive",
  size = "default",
}: DeleteNoteButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteNote(noteId)
        toast.success("笔记已删除")
        router.push("/notes")
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
            删除笔记
          </>
        )}
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除笔记</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除笔记 &quot;{noteTitle}&quot; 吗？
            <br />
            <span className="mt-2 block text-destructive">
              此操作无法撤销。
              {hasPost && (
                <>
                  <br />
                  如果笔记已发布为文章，关联的文章也会被删除。
                </>
              )}
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

