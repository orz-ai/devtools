"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Copy, Wand2, ArrowLeftRight, Minimize } from "lucide-react"
import { SyntaxHighlighter } from "@/components/syntax-highlighter"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"

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
    // 美化功能状态
    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    const [language, setLanguage] = useState("javascript")
    const [error, setError] = useState<string | null>(null)
    
    // 压缩功能状态
    const [minifyInput, setMinifyInput] = useState("")
    const [minifyOutput, setMinifyOutput] = useState("")
    const [minifyLanguage, setMinifyLanguage] = useState("javascript")
    const [minifyError, setMinifyError] = useState<string | null>(null)
    
    // 对比功能状态
    const [compareLeft, setCompareLeft] = useState("")
    const [compareRight, setCompareRight] = useState("")
    const [compareDiff, setCompareDiff] = useState<Array<{type: string, value: string, lineNumber?: number}>>([])
    const [compareLanguage, setCompareLanguage] = useState("javascript")

    // 简单的代码格式化函数
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
                case "json":
                    // JSON 格式化
                    try {
                        formatted = JSON.stringify(JSON.parse(code), null, 2)
                    } catch (e) {
                        throw new Error("Invalid JSON")
                    }
                    break
                case "html":
                case "xml":
                    // HTML/XML 格式化 - 简单实现
                    formatted = formatHTML(code)
                    break
                case "css":
                    // CSS 格式化 - 简单实现
                    formatted = formatCSS(code)
                    break
                case "javascript":
                case "typescript":
                    // JS/TS 格式化 - 简单实现
                    formatted = formatJavaScript(code)
                    break
                default:
                    // 其他语言的基本格式化
                    formatted = formatGeneric(code)
            }

            setOutput(formatted)
            setError(null)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to format code")
            setOutput("")
        }
    }
    
    // HTML/XML 格式化
    const formatHTML = (code: string): string => {
        // 移除多余空白
        let formatted = code.trim()
        
        // 在标签之间添加换行
        formatted = formatted.replace(/>\s*</g, ">\n<")
        
        // 在标签后添加换行
        formatted = formatted.replace(/(<[^>]+>)(?![\n\r])/g, "$1\n")
        
        // 处理缩进
        const lines = formatted.split("\n")
        let indent = 0
        const indentSize = 2
        
        return lines.map(line => {
            line = line.trim()
            if (!line) return ""
            
            // 减少缩进的标签
            if (line.match(/^<\//) && indent > 0) {
                indent -= 1
            }
            
            // 添加当前缩进
            const result = " ".repeat(indent * indentSize) + line
            
            // 增加缩进的标签
            if (line.match(/^<[^\/].*[^\/]>$/) && !line.match(/<.*\/.*>/)) {
                indent += 1
            }
            
            return result
        }).filter(Boolean).join("\n")
    }
    
    // CSS 格式化
    const formatCSS = (code: string): string => {
        // 移除多余空白
        let formatted = code.trim()
        
        // 在大括号前后添加空格
        formatted = formatted.replace(/\s*{\s*/g, " {\n")
        formatted = formatted.replace(/\s*}\s*/g, "\n}\n")
        
        // 在分号后添加换行
        formatted = formatted.replace(/;\s*/g, ";\n")
        
        // 处理缩进
        const lines = formatted.split("\n")
        let indent = 0
        const indentSize = 2
        
        return lines.map(line => {
            line = line.trim()
            if (!line) return ""
            
            // 减少缩进的行
            if (line === "}") {
                indent = Math.max(0, indent - 1)
            }
            
            // 添加当前缩进
            const result = " ".repeat(indent * indentSize) + line
            
            // 增加缩进的行
            if (line.includes("{")) {
                indent += 1
            }
            
            return result
        }).filter(Boolean).join("\n")
    }
    
    // JavaScript/TypeScript 格式化
    const formatJavaScript = (code: string): string => {
        // 移除多余空白
        let formatted = code.trim()
        
        // 在大括号前后添加空格和换行
        formatted = formatted.replace(/\s*{\s*/g, " {\n")
        formatted = formatted.replace(/\s*}\s*/g, "\n}\n")
        
        // 在分号后添加换行
        formatted = formatted.replace(/;\s*/g, ";\n")
        
        // 在逗号后添加空格
        formatted = formatted.replace(/,\s*/g, ", ")
        
        // 处理缩进
        const lines = formatted.split("\n")
        let indent = 0
        const indentSize = 2
        
        return lines.map(line => {
            line = line.trim()
            if (!line) return ""
            
            // 减少缩进的行
            if (line === "}" || line === "});") {
                indent = Math.max(0, indent - 1)
            }
            
            // 添加当前缩进
            const result = " ".repeat(indent * indentSize) + line
            
            // 增加缩进的行
            if (line.includes("{") && !line.includes("}")) {
                indent += 1
            }
            
            return result
        }).filter(Boolean).join("\n")
    }
    
    // 通用格式化
    const formatGeneric = (code: string): string => {
        // 移除多余空白
        let formatted = code.trim()
        
        // 在分号后添加换行
        formatted = formatted.replace(/;\s*/g, ";\n")
        
        // 在大括号前后添加空格和换行
        formatted = formatted.replace(/\s*{\s*/g, " {\n")
        formatted = formatted.replace(/\s*}\s*/g, "\n}\n")
        
        // 在逗号后添加换行
        formatted = formatted.replace(/,\s*/g, ",\n")
        
        return formatted
    }
    
    // 代码压缩功能
    const minifyCode = (code: string, lang: string) => {
        if (!code.trim()) {
            setMinifyOutput("")
            setMinifyError(null)
            return
        }

        try {
            let minified = code

            // 根据不同语言进行压缩
            switch (lang) {
                case "javascript":
                case "typescript":
                    // JS/TS 压缩
                    minified = minifyJavaScript(code)
                    break
                case "json":
                    // JSON 压缩
                    minified = JSON.stringify(JSON.parse(code))
                    break
                case "html":
                case "xml":
                    // HTML/XML 压缩
                    minified = minifyXML(code)
                    break
                case "css":
                    // CSS 压缩
                    minified = minifyCSS(code)
                    break
                default:
                    // 其他语言暂时只做基本的空白处理
                    minified = code.replace(/\s+/g, ' ').trim()
            }

            setMinifyOutput(minified)
            setMinifyError(null)
        } catch (e) {
            setMinifyError(e instanceof Error ? e.message : "Failed to minify code")
            setMinifyOutput("")
        }
    }
    
    // 代码对比功能
    const compareCode = (left: string, right: string) => {
        if (!left.trim() || !right.trim()) {
            setCompareDiff([])
            return
        }
        
        try {
            // 行级别对比
            const leftLines = left.split('\n')
            const rightLines = right.split('\n')
            
            const diff: Array<{type: string, value: string, lineNumber?: number}> = []
            
            // 使用简单的行对比算法
            const maxLines = Math.max(leftLines.length, rightLines.length)
            
            for (let i = 0; i < maxLines; i++) {
                const leftLine = i < leftLines.length ? leftLines[i] : ''
                const rightLine = i < rightLines.length ? rightLines[i] : ''
                
                if (leftLine === rightLine) {
                    diff.push({ 
                        type: 'same', 
                        value: leftLine,
                        lineNumber: i + 1
                    })
                } else {
                    if (leftLine) {
                        diff.push({ 
                            type: 'removed', 
                            value: leftLine,
                            lineNumber: i + 1
                        })
                    }
                    if (rightLine) {
                        diff.push({ 
                            type: 'added', 
                            value: rightLine,
                            lineNumber: i + 1
                        })
                    }
                }
            }
            
            setCompareDiff(diff)
        } catch (e) {
            console.error('Error comparing code:', e)
            setCompareDiff([])
        }
    }

    // JavaScript 压缩
    const minifyJavaScript = (code: string) => {
        // 移除注释
        code = code.replace(/\/\/.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
        
        // 移除多余空白
        return code.replace(/\s+/g, ' ')
            .replace(/\s*([{}:;,=+\-*\/])\s*/g, '$1')
            .replace(/\s*\n\s*/g, '')
            .trim()
    }

    // XML/HTML 压缩
    const minifyXML = (code: string) => {
        // 移除注释
        code = code.replace(/<!--[\s\S]*?-->/g, '')
        
        // 移除多余空白
        return code.replace(/>\s+</g, '><')
            .replace(/\s+/g, ' ')
            .replace(/\s+>/g, '>')
            .replace(/<\s+/g, '<')
            .trim()
    }

    // CSS 压缩
    const minifyCSS = (code: string) => {
        // 移除注释
        code = code.replace(/\/\*[\s\S]*?\*\//g, '')
        
        // 移除多余空白
        return code.replace(/\s+/g, ' ')
            .replace(/\s*([{}:;,])\s*/g, '$1')
            .replace(/;\}/g, '}')
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
    
    const handleMinifyInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        setMinifyInput(newValue)
        minifyCode(newValue, minifyLanguage)
    }

    const handleMinifyLanguageChange = (value: string) => {
        setMinifyLanguage(value)
        minifyCode(minifyInput, value)
    }
    
    const handleCompareLeftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        setCompareLeft(newValue)
        compareCode(newValue, compareRight)
    }
    
    const handleCompareRightChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        setCompareRight(newValue)
        compareCode(compareLeft, newValue)
    }
    
    const handleCompareLanguageChange = (value: string) => {
        setCompareLanguage(value)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Code Tools</h1>
                <p className="text-muted-foreground">Beautify, minify, and compare code</p>
            </div>
            
            <Tabs defaultValue="beautify" className="space-y-4">
                <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="beautify" className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4" />
                        <span>Beautify</span>
                    </TabsTrigger>
                    <TabsTrigger value="minify" className="flex items-center gap-2">
                        <Minimize className="h-4 w-4" />
                        <span>Minify</span>
                    </TabsTrigger>
                    <TabsTrigger value="compare" className="flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4" />
                        <span>Compare</span>
                    </TabsTrigger>
                </TabsList>
                
                {/* 美化代码选项卡 */}
                <TabsContent value="beautify">
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
                                        onClick={() => copyToClipboard(output)}
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
                </TabsContent>
                
                {/* 压缩代码选项卡 */}
                <TabsContent value="minify">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Select
                                    value={minifyLanguage}
                                    onValueChange={handleMinifyLanguageChange}
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
                                    placeholder={`Paste your ${LANGUAGES.find(lang => lang.value === minifyLanguage)?.label || 'code'} here...`}
                                    className="min-h-[700px] max-h-[700px] font-mono custom-scrollbar"
                                    value={minifyInput}
                                    onChange={handleMinifyInputChange}
                                />
                            </Card>
                        </div>
                        <Card className="p-4">
                            {minifyError ? (
                                <div className="space-y-2">
                                    <p className="text-destructive font-medium">Minify Error</p>
                                    <p className="text-muted-foreground text-sm">{minifyError}</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-4 top-0 h-8 w-8 z-10"
                                        onClick={() => copyToClipboard(minifyOutput)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <div className="min-h-[700px] max-h-[700px] overflow-auto custom-scrollbar">
                                        <SyntaxHighlighter
                                            code={minifyOutput}
                                            language={minifyLanguage}
                                            className="text-sm !bg-transparent"
                                        />
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </TabsContent>
                
                {/* 代码对比选项卡 */}
                <TabsContent value="compare">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Select
                                value={compareLanguage}
                                onValueChange={handleCompareLanguageChange}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-4">
                                <Label htmlFor="compare-left" className="text-sm font-medium mb-2 block">Original Code</Label>
                                <Textarea
                                    id="compare-left"
                                    placeholder="Paste original code here..."
                                    className="min-h-[300px] max-h-[300px] font-mono custom-scrollbar"
                                    value={compareLeft}
                                    onChange={handleCompareLeftChange}
                                />
                            </Card>
                            <Card className="p-4">
                                <Label htmlFor="compare-right" className="text-sm font-medium mb-2 block">Modified Code</Label>
                                <Textarea
                                    id="compare-right"
                                    placeholder="Paste modified code here..."
                                    className="min-h-[300px] max-h-[300px] font-mono custom-scrollbar"
                                    value={compareRight}
                                    onChange={handleCompareRightChange}
                                />
                            </Card>
                        </div>
                        <Card className="p-4">
                            <Label className="text-sm font-medium mb-2 block">Differences</Label>
                            <div className="min-h-[300px] max-h-[300px] overflow-auto custom-scrollbar border rounded-md p-4 font-mono text-sm">
                                {compareDiff.length > 0 ? (
                                    <div>
                                        {compareDiff.map((line, index) => (
                                            <div 
                                                key={index} 
                                                className={
                                                    line.type === 'added' 
                                                        ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                                        : line.type === 'removed' 
                                                            ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                                                            : ''
                                                }
                                            >
                                                <span className="mr-2 text-muted-foreground">
                                                    {line.lineNumber}:
                                                </span>
                                                <span className="mr-2">
                                                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                                                </span>
                                                {line.value || ' '}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground text-center py-10">
                                        Enter code in both panels to see differences
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
} 