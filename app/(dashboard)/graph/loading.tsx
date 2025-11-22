import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function GraphLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Skeleton className="h-9 w-32 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-[600px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

