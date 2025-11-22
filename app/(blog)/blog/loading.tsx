import { PostListSkeleton } from "@/components/loading/post-list-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function BlogLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-10 w-32 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>
      <PostListSkeleton />
    </div>
  )
}

