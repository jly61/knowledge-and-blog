"use client"

import { useState } from "react"
import { uploadImage } from "@/app/actions/upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Image as ImageIcon, Upload } from "lucide-react"
import { useTransition } from "react"
import { ImageUpload } from "./image-upload"

interface ImageUploadButtonProps {
  onUploadComplete: (url: string) => void
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function ImageUploadButton({
  onUploadComplete,
  variant = "outline",
  size = "default",
  className,
}: ImageUploadButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleUploadComplete = (url: string) => {
    onUploadComplete(url)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={isPending}>
          <ImageIcon className="w-4 h-4 mr-2" />
          上传图片
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>上传图片</DialogTitle>
        </DialogHeader>
        <ImageUpload onUploadComplete={handleUploadComplete} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

