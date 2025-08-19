import type { ReactNode } from "react"
import { Header } from "@/components/header"

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      <Header />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
