"use client"

import { useEffect } from "react"
import Prism from "prismjs"

// 导入基本样式
import "prismjs/themes/prism.css"
// 导入暗色主题（可选）
import "prismjs/themes/prism-tomorrow.css"
// 导入需要的语言
import "prismjs/components/prism-sql"
import "prismjs/components/prism-json"
import "prismjs/components/prism-javascript"
// 可以根据需要继续导入其他语言支持

interface SyntaxHighlighterProps {
    code: string
    language: string
    className?: string
}

export function SyntaxHighlighter({ code, language, className = "" }: SyntaxHighlighterProps) {
    useEffect(() => {
        Prism.highlightAll()
    }, [code])

    return (
        <pre className={className}>
            <code className={`language-${language}`}>{code}</code>
        </pre>
    )
} 