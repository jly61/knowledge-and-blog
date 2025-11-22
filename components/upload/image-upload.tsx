"use client"

import { useState, useRef } from "react"
import { uploadImage } from "@/app/actions/upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { useTransition } from "react"

interface ImageUploadProps {
  onUploadComplete: (url: string) => void
  onCancel?: () => void
  className?: string
}

export function ImageUpload({
  onUploadComplete,
  onCancel,
  className,
}: ImageUploadProps) {
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      toast.error("只能上传图片文件")
      return
    }

    // 验证文件大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("图片大小不能超过 5MB")
      return
    }

    // 显示预览
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      toast.error("请选择图片")
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("file", file)

        const result = await uploadImage(formData)
        toast.success("图片上传成功")
        onUploadComplete(result.url)
        setPreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "上传失败")
      }
    })
  }

  const handleCancel = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onCancel?.()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("只能上传图片文件")
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("图片大小不能超过 5MB")
      return
    }

    // 设置文件到 input
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files
      handleFileSelect({ target: fileInputRef.current } as any)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          {preview ? (
            <div className="relative w-full max-w-md">
              <img
                src={preview}
                alt="预览"
                className="w-full h-auto rounded-lg"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setPreview(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  点击选择图片或拖拽图片到这里
                </p>
                <p className="text-xs text-muted-foreground">
                  支持 JPG、PNG、GIF 等格式，最大 5MB
                </p>
              </div>
            </>
          )}

          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload-input"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
            >
              <Upload className="w-4 h-4 mr-2" />
              选择图片
            </Button>
            {preview && (
              <>
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={isPending}
                >
                  {isPending ? "上传中..." : "上传"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  取消
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

