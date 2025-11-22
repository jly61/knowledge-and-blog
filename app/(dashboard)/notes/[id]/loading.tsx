import { NoteDetailSkeleton } from "@/components/loading/note-detail-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function NoteDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-9 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-16" />
        </div>
      </div>
      <NoteDetailSkeleton />
    </div>
  )
}

