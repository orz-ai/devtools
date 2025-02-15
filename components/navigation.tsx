"use client"

import { Wrench } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ModeToggle } from "./mode-toggle"
import { Button } from "./ui/button"

const tools = [
  {
    name: "JSON Formatter",
    href: "/tools/json-formatter",
  },
  {
    name: "SQL Formatter",
    href: "/tools/sql-formatter",
  },
  {
    name: "Base64 Encoder/Decoder",
    href: "/tools/base64",
  },
  {
    name: "URL Encoder/Decoder",
    href: "/tools/url-codec",
  },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center w-full m-auto px-4">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="bg-gradient-to-br from-primary/20 to-primary/10 w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:from-primary/30 group-hover:to-primary/20">
            <Wrench className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
          </div>
          <span className="font-bold text-lg">DevTools Hub</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-1 ml-8">
          {tools.map((tool) => (
            <Button
              key={tool.href}
              variant={pathname === tool.href ? "secondary" : "ghost"}
              size="sm"
              asChild
              className="h-9"
            >
              <Link href={tool.href}>
                {tool.name}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
