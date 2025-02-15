"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Copy } from "lucide-react"
import { SyntaxHighlighter } from "@/components/syntax-highlighter"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// 支持的语言列表
const LANGUAGES = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "json", label: "JSON" },
    { value: "sql", label: "SQL" },
    { value: "xml", label: "XML" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "csharp", label: "C#" },
    { value: "php", label: "PHP" },
    { value: "ruby", label: "Ruby" },
    { value: "swift", label: "Swift" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
]

export default function CodeBeautifier() {
    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    const [language, setLanguage] = useState("javascript")
    const [error, setError] = useState<string | null>(null)

    const formatCode = (code: string, lang: string) => {
        if (!code.trim()) {
            setOutput("")
            setError(null)
            return
        }

        try {
            let formatted = code

            // 根据不同语言进行格式化
            switch (lang) {
                case "javascript":
                case "typescript":
                    // 简单的 JS/TS 格式化
                    formatted = formatJavaScript(code)
                    break
                case "json":
                    // JSON 格式化
                    formatted = JSON.stringify(JSON.parse(code), null, 2)
                    break
                case "html":
                case "xml":
                    // HTML/XML 格式化
                    formatted = formatXML(code)
                    break
                case "css":
                    // CSS 格式化
                    formatted = formatCSS(code)
                    break
                case "sql":
                    // SQL 格式化
                    formatted = formatSQL(code)
                    break
                default:
                    // 其他语言暂时只做基本的缩进处理
                    formatted = code.trim()
            }

            setOutput(formatted)
            setError(null)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to format code")
            setOutput("")
        }
    }

    // 简单的 JavaScript 格式化
    const formatJavaScript = (code: string) => {
        return code
            .replace(/([{}\[\]])/g, "\n$1\n")
            .replace(/;/g, ";\n")
            .replace(/,\s*/g, ",\n")
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map((line, _, array) => {
                let indent = 0
                for (let i = 0; i < array.length; i++) {
                    if (array[i].includes("}") || array[i].includes("]")) indent--
                    if (i === array.indexOf(line)) break
                    if (array[i].includes("{") || array[i].includes("[")) indent++
                }
                return "  ".repeat(Math.max(0, indent)) + line
            })
            .join("\n")
    }

    // 简单的 XML/HTML 格式化
    const formatXML = (code: string) => {
        let formatted = code
            .replace(/>(\s*)</g, ">\n<")
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 0)

        let indent = 0
        return formatted
            .map(line => {
                if (line.startsWith("</")) indent--
                let result = "  ".repeat(Math.max(0, indent)) + line
                if (!line.startsWith("</") && !line.endsWith("/>")) indent++
                return result
            })
            .join("\n")
    }

    // 简单的 CSS 格式化
    const formatCSS = (code: string) => {
        return code
            .replace(/\s*{\s*/g, " {\n  ")
            .replace(/\s*}\s*/g, "\n}\n")
            .replace(/;\s*/g, ";\n  ")
            .replace(/,\s*/g, ",\n")
            .replace(/\n\s*\n/g, "\n")
            .trim()
    }

    // 简单的 SQL 格式化
    const formatSQL = (code: string) => {
        return code
            .replace(/\s+/g, " ")
            .replace(/\s*([,()])\s*/g, "$1 ")
            .replace(/\s*([=<>])\s*/g, " $1 ")
            .replace(/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT)\b/gi, "\n$1")
            .replace(/\b(AND|OR)\b/gi, "\n  $1")
            .trim()
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        setInput(newValue)
        formatCode(newValue, language)
    }

    const handleLanguageChange = (value: string) => {
        setLanguage(value)
        formatCode(input, value)
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Code Beautifier</h1>
                <p className="text-muted-foreground">Beautify and format various programming languages</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Select
                            value={language}
                            onValueChange={handleLanguageChange}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                {LANGUAGES.map(lang => (
                                    <SelectItem key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Card className="p-4">
                        <Textarea
                            placeholder={`Paste your ${LANGUAGES.find(lang => lang.value === language)?.label || 'code'} here...`}
                            className="min-h-[700px] max-h-[700px] font-mono custom-scrollbar"
                            value={input}
                            onChange={handleInputChange}
                        />
                    </Card>
                </div>
                <Card className="p-4">
                    {error ? (
                        <div className="space-y-2">
                            <p className="text-destructive font-medium">Format Error</p>
                            <p className="text-muted-foreground text-sm">{error}</p>
                        </div>
                    ) : (
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-0 h-8 w-8 z-10"
                                onClick={copyToClipboard}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                            <div className="min-h-[700px] max-h-[700px] overflow-auto custom-scrollbar">
                                <SyntaxHighlighter
                                    code={output}
                                    language={language}
                                    className="text-sm !bg-transparent"
                                />
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
} 