import { getCurrentUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SignOutButton } from "@/components/auth/sign-out-button"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-xl font-bold">
                知识库
              </Link>
              <nav className="flex gap-4">
                <Link href="/notes">
                  <Button variant="ghost">笔记</Button>
                </Link>
                <Link href="/search">
                  <Button variant="ghost">搜索</Button>
                </Link>
                <Link href="/graph">
                  <Button variant="ghost">知识图谱</Button>
                </Link>
                <Link href="/daily">
                  <Button variant="ghost">每日笔记</Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/blog">
                <Button variant="ghost">博客</Button>
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}

