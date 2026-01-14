"use client"

import * as React from "react"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useI18n } from "@/components/i18n-provider"

export function LocaleToggle() {
    const { locale, setLocale } = useI18n()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Languages className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocale("zh")}>
                    <span className={locale === "zh" ? "font-bold" : ""}>
                        🇨🇳 中文
                    </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("en")}>
                    <span className={locale === "en" ? "font-bold" : ""}>
                        🇺🇸 English
                    </span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
