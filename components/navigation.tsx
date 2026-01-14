"use client"

import { Wrench } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ModeToggle } from "./mode-toggle"
import { LocaleToggle } from "./locale-toggle"
import { Button } from "./ui/button"
import { useI18n } from "./i18n-provider"

const toolsConfig = [
  {
    key: "jsonFormatter",
    href: "/tools/json-formatter",
  },
  {
    key: "sqlFormatter",
    href: "/tools/sql-formatter",
  },
  {
    key: "base64",
    href: "/tools/base64",
  },
  {
    key: "urlCodec",
    href: "/tools/url-codec",
  },
  {
    key: "idWatermark",
    href: "/tools/id-watermark",
  },
]

export function Navigation() {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center w-full m-auto px-4">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="bg-gradient-to-br from-primary/20 to-primary/10 w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:from-primary/30 group-hover:to-primary/20">
            <Wrench className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
          </div>
          <span className="font-bold text-lg">{t('devToolsHub')}</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-1 ml-8">
          {toolsConfig.map((tool) => (
            <Button
              key={tool.href}
              variant={pathname === tool.href ? "secondary" : "ghost"}
              size="sm"
              asChild
              className="h-9"
            >
              <Link href={tool.href}>
                {t(`tools.${tool.key}`)}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-2">
          <LocaleToggle />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
