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
import { Input } from "@/components/ui/input"

interface FormatOptions {
    startNumber: number
    increment: number
    renumberFields: boolean
}

export default function ProtoBeautifier() {
    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [options, setOptions] = useState<FormatOptions>({
        startNumber: 1,
        increment: 1,
        renumberFields: true
    })

    const formatProto = (value: string, opts: FormatOptions) => {
        if (!value.trim()) {
            setOutput("")
            setError(null)
            return
        }

        try {
            // 预处理：清理空白字符和分号
            let formatted = value
                .replace(/\s+/g, ' ')
                .replace(/;+/g, ';')
                .replace(/\s*;\s*/g, ';')
                .trim()

            // 处理 rpc 方法，确保每个方法独占一行
            formatted = formatted.replace(/rpc\s+\w+\s*\([^)]+\)\s*returns\s*\([^)]+\);/g, match => {
                return '\n  ' + match
            })

            // 处理错误的换行和分隔
            formatted = formatted
                .replace(/;\s*option/g, ';\noption')
                .replace(/;\s*package/g, ';\npackage')
                .replace(/;\s*service/g, ';\n\nservice')
                .replace(/;\s*message/g, ';\n\nmessage')
                .replace(/}\s*message/g, '}\n\nmessage')
                .replace(/{\s*/g, ' {\n')
                .replace(/\s*}/g, '\n}')

            // 分离和处理各个部分
            const parts = formatted.split('\n')
            const declarations: string[] = []
            const services: string[] = []
            const messages: string[] = []

            let currentBlock: string[] = []
            let isInBlock = false
            let isInService = false

            parts.forEach(part => {
                const trimmedPart = part.trim()

                if (trimmedPart.startsWith('syntax') ||
                    trimmedPart.startsWith('package') ||
                    trimmedPart.startsWith('option')) {
                    if (!trimmedPart.endsWith(';')) {
                        declarations.push(trimmedPart + ';')
                    } else {
                        declarations.push(trimmedPart)
                    }
                }
                else if (trimmedPart.startsWith('service')) {
                    isInBlock = true
                    isInService = true
                    currentBlock = [trimmedPart]
                }
                else if (trimmedPart.startsWith('message')) {
                    isInBlock = true
                    isInService = false
                    currentBlock = [trimmedPart]
                }
                else if (trimmedPart === '}') {
                    if (isInService) {
                        // 处理 service 块的结束
                        const serviceContent = currentBlock.join('\n')
                        const formattedService = serviceContent
                            .replace(/rpc\s+/g, '\n  rpc ') // 确保每个 rpc 方法都有正确的缩进和换行
                            .replace(/\n\n/g, '\n') // 移除多余的空行
                        services.push(formattedService + '\n}')
                    } else {
                        // 处理 message 块的结束
                        currentBlock.push(trimmedPart)
                        messages.push(currentBlock.join('\n'))
                    }
                    isInBlock = false
                    isInService = false
                }
                else if (isInBlock && trimmedPart) {
                    if (trimmedPart.startsWith('rpc')) {
                        // 不在这里添加缩进，因为已经在上面处理了
                        currentBlock.push(trimmedPart)
                    } else {
                        currentBlock.push('  ' + trimmedPart)
                    }
                }
            })

            // 组合最终结果
            formatted = [
                ...declarations,
                '',
                ...services,
                '',
                ...messages
            ]
                .filter(line => line.trim())
                .join('\n')
                .replace(/\n{3,}/g, '\n\n')
                .trim()

            setOutput(formatted)
            setError(null)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to format Proto")
            setOutput("")
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        setInput(newValue)
        formatProto(newValue, options)
    }

    const handleOptionChange = (key: keyof FormatOptions, value: any) => {
        const newOptions = { ...options, [key]: value }
        setOptions(newOptions)
        formatProto(input, newOptions)
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Proto Beautifier</h1>
                <p className="text-muted-foreground">Beautify Protocol Buffers and Renumber the fields</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <Card className="p-4">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="space-y-2 flex-1">
                                    <label className="text-sm font-medium">Start Number</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={options.startNumber}
                                        onChange={(e) => handleOptionChange('startNumber', parseInt(e.target.value) || 1)}
                                        placeholder="Start from..."
                                        className="font-mono"
                                    />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <label className="text-sm font-medium">Increment</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={options.increment}
                                        onChange={(e) => handleOptionChange('increment', parseInt(e.target.value) || 1)}
                                        placeholder="Step by..."
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="renumberFields"
                                    checked={options.renumberFields}
                                    onChange={(e) => handleOptionChange('renumberFields', e.target.checked)}
                                    className="form-checkbox h-4 w-4"
                                />
                                <label htmlFor="renumberFields" className="text-sm font-medium">
                                    Renumber Fields
                                </label>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <Textarea
                            placeholder="Paste your Proto definition here..."
                            className="min-h-[600px] max-h-[600px] font-mono custom-scrollbar"
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
                                    language="protobuf"
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