import { NoteListSkeleton } from "@/components/loading/note-list-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export default function NotesLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <NoteListSkeleton />
    </div>
  )
}

