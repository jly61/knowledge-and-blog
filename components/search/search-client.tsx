"use client"

import { useState, useTransition, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { searchNotes, getCategoriesForSearch, getTagsForSearch, type SearchResult } from "@/app/actions/search"
import { formatRelativeTime } from "@/lib/utils"
import Link from "next/link"
import { Search, X } from "lucide-react"
import { HighlightText } from "@/components/search/highlight-text"

export function SearchClient() {
  const [query, setQuery] = useState("")
  const [categoryId, setCategoryId] = useState<string>("all")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [results, setResults] = useState<SearchResult[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [isPending] = useTransition()

  // 加载分类和标签
  useEffect(() => {
    Promise.all([
      getCategoriesForSearch(),
      getTagsForSearch(),
    ]).then(([cats, tagList]) => {
      setCategories(cats)
      setTags(tagList)
    })
  }, [])

  const handleSearch = async () => {
    if (!query.trim() && categoryId === "all" && selectedTagIds.length === 0) {
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      const searchResults = await searchNotes({
        query: query.trim(),
        categoryId: categoryId === "all" ? undefined : categoryId,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      })
      setResults(searchResults)
    } catch (error) {
      console.error("搜索失败:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const clearFilters = () => {
    setQuery("")
    setCategoryId("all")
    setSelectedTagIds([])
    setResults([])
    setHasSearched(false)
  }

  return (
    <div className="space-y-6">
      {/* 搜索框 */}
      <Card>
        <CardHeader>
          <CardTitle>搜索</CardTitle>
          <CardDescription>输入关键词搜索笔记</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="搜索笔记标题或内容..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading || isPending}>
              {isLoading || isPending ? "搜索中..." : "搜索"}
            </Button>
            {(query || categoryId !== "all" || selectedTagIds.length > 0) && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* 高级筛选 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label htmlFor="category">分类</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>标签</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={selectedTagIds.includes(tag.id)}
                      onCheckedChange={() => toggleTag(tag.id)}
                    />
                    <Label
                      htmlFor={`tag-${tag.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {tag.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 搜索结果 */}
      {hasSearched && (
        <div>
          <div className="mb-4 text-sm text-muted-foreground">
            找到 {results.length} 条结果
          </div>

          {results.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">没有找到匹配的笔记</p>
                <p className="text-sm text-muted-foreground mt-2">
                  尝试使用不同的关键词或调整筛选条件
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((note) => (
                <Card key={note.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link href={`/notes/${note.id}`}>
                          <CardTitle className="hover:text-primary transition-colors">
                            <HighlightText text={note.title} query={query} />
                          </CardTitle>
                        </Link>
                        <CardDescription className="mt-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {note.category && (
                              <span className="px-2 py-1 bg-secondary rounded text-xs">
                                {note.category.name}
                              </span>
                            )}
                            {note.tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="px-2 py-1 bg-secondary rounded text-xs"
                              >
                                #{tag.name}
                              </span>
                            ))}
                            <span className="text-xs">
                              {formatRelativeTime(note.updatedAt)}
                            </span>
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {note.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        <HighlightText text={note.excerpt} query={query} />
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      {note._count && (
                        <>
                          <span>{note._count.links} 个链接</span>
                          <span>{note._count.backlinks} 个反向链接</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

