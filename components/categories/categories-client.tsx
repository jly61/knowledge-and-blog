"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { createCategory, updateCategory, deleteCategory } from "@/app/actions/categories"
import { Plus, Edit, Trash2, Folder } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  _count: {
    notes: number
    posts: number
  }
}

interface CategoriesClientProps {
  initialCategories: Category[]
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isPending, startTransition] = useTransition()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "",
  })

  const handleCreate = () => {
    setFormData({ name: "", description: "", color: "" })
    setIsCreateOpen(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || "",
    })
    setIsEditOpen(true)
  }

  const handleDelete = (category: Category) => {
    setDeletingCategory(category)
    setIsDeleteOpen(true)
  }

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const newCategory = await createCategory({
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color || undefined,
        })
        // 添加默认的统计信息
        const categoryWithStats: Category = {
          ...newCategory,
          _count: {
            notes: 0,
            posts: 0,
          },
        } as Category
        setCategories((prev) => [...prev, categoryWithStats])
        setIsCreateOpen(false)
        setFormData({ name: "", description: "", color: "" })
        toast.success("分类创建成功")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "创建失败")
      }
    })
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    startTransition(async () => {
      try {
        const updated = await updateCategory(editingCategory.id, {
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color || undefined,
        })
        setCategories((prev) =>
          prev.map((cat) => (cat.id === editingCategory.id ? updated as Category : cat))
        )
        setIsEditOpen(false)
        setEditingCategory(null)
        toast.success("分类更新成功")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "更新失败")
      }
    })
  }

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return

    startTransition(async () => {
      try {
        await deleteCategory(deletingCategory.id)
        setCategories((prev) => prev.filter((cat) => cat.id !== deletingCategory.id))
        setIsDeleteOpen(false)
        setDeletingCategory(null)
        toast.success("分类删除成功")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "删除失败")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          共 {categories.length} 个分类
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              新建分类
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmitCreate}>
              <DialogHeader>
                <DialogTitle>新建分类</DialogTitle>
                <DialogDescription>
                  创建一个新的分类来组织你的笔记和文章
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">名称 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：技术、生活、学习"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="分类的简要描述（可选）"
                    rows={3}
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

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">还没有创建任何分类</p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              创建第一个分类
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {category.color && (
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {category.description && (
                  <CardDescription className="mt-2">
                    {category.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{category._count?.notes || 0} 篇笔记</span>
                  <span>{category._count?.posts || 0} 篇文章</span>
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
              <DialogTitle>编辑分类</DialogTitle>
              <DialogDescription>
                修改分类信息
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
                <Label htmlFor="edit-description">描述</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
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
              确定要删除分类 "{deletingCategory?.name}" 吗？
              {deletingCategory && (deletingCategory._count.notes > 0 || deletingCategory._count.posts > 0) && (
                <span className="block mt-2 text-destructive">
                  该分类下有 {deletingCategory._count.notes} 篇笔记和 {deletingCategory._count.posts} 篇文章
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

