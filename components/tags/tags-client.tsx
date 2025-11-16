"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { createTag, updateTag, deleteTag } from "@/app/actions/tags"
import { Plus, Edit, Trash2, Tag as TagIcon } from "lucide-react"
import { toast } from "sonner"

interface Tag {
  id: string
  name: string
  slug: string
  color: string | null
  _count: {
    notes: number
    posts: number
  }
}

interface TagsClientProps {
  initialTags: Tag[]
}

export function TagsClient({ initialTags }: TagsClientProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags)
  const [isPending, startTransition] = useTransition()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    color: "",
  })

  const handleCreate = () => {
    setFormData({ name: "", color: "" })
    setIsCreateOpen(true)
  }

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      color: tag.color || "",
    })
    setIsEditOpen(true)
  }

  const handleDelete = (tag: Tag) => {
    setDeletingTag(tag)
    setIsDeleteOpen(true)
  }

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const newTag = await createTag({
          name: formData.name,
          color: formData.color || undefined,
        })
        // 添加默认的统计信息
        const tagWithStats: Tag = {
          ...newTag,
          _count: {
            notes: 0,
            posts: 0,
          },
        } as Tag
        setTags((prev) => [...prev, tagWithStats])
        setIsCreateOpen(false)
        setFormData({ name: "", color: "" })
        toast.success("标签创建成功")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "创建失败")
      }
    })
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTag) return

    startTransition(async () => {
      try {
        const updated = await updateTag(editingTag.id, {
          name: formData.name,
          color: formData.color || undefined,
        })
        setTags((prev) =>
          prev.map((tag) => (tag.id === editingTag.id ? updated as Tag : tag))
        )
        setIsEditOpen(false)
        setEditingTag(null)
        toast.success("标签更新成功")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "更新失败")
      }
    })
  }

  const handleConfirmDelete = async () => {
    if (!deletingTag) return

    startTransition(async () => {
      try {
        await deleteTag(deletingTag.id)
        setTags((prev) => prev.filter((tag) => tag.id !== deletingTag.id))
        setIsDeleteOpen(false)
        setDeletingTag(null)
        toast.success("标签删除成功")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "删除失败")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          共 {tags.length} 个标签
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              新建标签
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmitCreate}>
              <DialogHeader>
                <DialogTitle>新建标签</DialogTitle>
                <DialogDescription>
                  创建一个新的标签来标记你的笔记和文章
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">名称 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：JavaScript、React、学习"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">颜色</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color || "#3b82f6"}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isPending}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "创建中..." : "创建"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tags.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TagIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">还没有创建任何标签</p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              创建第一个标签
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <Card key={tag.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {tag.color && (
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                    )}
                    <CardTitle className="text-lg">#{tag.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(tag)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tag)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{tag._count?.notes || 0} 篇笔记</span>
                  <span>{tag._count?.posts || 0} 篇文章</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 编辑对话框 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form onSubmit={handleSubmitEdit}>
            <DialogHeader>
              <DialogTitle>编辑标签</DialogTitle>
              <DialogDescription>
                修改标签信息
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">名称 *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">颜色</Label>
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color || "#3b82f6"}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isPending}
              >
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "更新中..." : "更新"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除标签 "#{deletingTag?.name}" 吗？
              {deletingTag && (deletingTag._count.notes > 0 || deletingTag._count.posts > 0) && (
                <span className="block mt-2 text-destructive">
                  该标签下有 {deletingTag._count.notes} 篇笔记和 {deletingTag._count.posts} 篇文章
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "删除中..." : "删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

