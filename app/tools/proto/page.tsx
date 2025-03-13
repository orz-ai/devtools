"use client"

import { useState, useEffect } from "react"
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
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const formatProto = (value: string, opts: FormatOptions) => {
        if (!value.trim()) {
            setOutput("")
            setError(null)
            return
        }

        try {
            // 预处理：保留原始结构，只规范化空白字符
            let cleanedInput = value
                .replace(/\r\n/g, '\n')  // 统一换行符
                .replace(/\t/g, '  ');   // 将制表符替换为两个空格

            // 按行分割输入
            const inputLines = cleanedInput.split('\n');
            const formattedLines: string[] = [];

            let indentLevel = 0;
            let inBlock = false;
            let lastLineWasBlockEnd = false;

            for (let i = 0; i < inputLines.length; i++) {
                let line = inputLines[i].trim();
                if (!line) continue; // 跳过空行

                // 检查是否是纯注释行
                if (line.startsWith('//')) {
                    formattedLines.push('  '.repeat(indentLevel) + line);
                    continue;
                }

                // 分离代码和注释
                let codePart = line;
                let commentPart = '';

                const commentIndex = line.indexOf('//');
                if (commentIndex >= 0) {
                    codePart = line.substring(0, commentIndex).trim();
                    commentPart = line.substring(commentIndex);
                }

                // 处理 service 定义
                if (codePart.startsWith('service')) {
                    if (formattedLines.length > 0) {
                        formattedLines.push('');  // 添加空行
                    }

                    // 规范化 service 定义
                    let serviceLine = codePart.replace(/\s+/g, ' ').replace(/\s*{\s*$/, '');
                    formattedLines.push(serviceLine + ' {');
                    indentLevel = 1;
                    inBlock = true;
                    lastLineWasBlockEnd = false;
                    continue;
                }

                // 处理 message 定义
                if (codePart.startsWith('message')) {
                    if (formattedLines.length > 0) {
                        formattedLines.push('');  // 添加空行
                    }

                    // 规范化 message 定义
                    let messageLine = codePart.replace(/\s+/g, ' ').replace(/\s*{\s*$/, '');
                    formattedLines.push(messageLine + ' {');
                    indentLevel = 1;
                    inBlock = true;
                    lastLineWasBlockEnd = false;
                    continue;
                }

                // 处理块结束
                if (codePart === '}') {
                    indentLevel = Math.max(0, indentLevel - 1);
                    formattedLines.push('  '.repeat(indentLevel) + '}');
                    lastLineWasBlockEnd = true;
                    inBlock = false;
                    continue;
                }

                // 处理 rpc 方法
                if (codePart.startsWith('rpc')) {
                    // 规范化 rpc 方法定义
                    let rpcLine = codePart
                        .replace(/\s+/g, ' ')
                        .replace(/\(\s*/g, '(')
                        .replace(/\s*\)/g, ')')
                        .replace(/\s*returns\s*/g, ' returns ')
                        .replace(/stream\s+/g, 'stream ')
                        .replace(/;\s*$/, '');

                    formattedLines.push('  '.repeat(indentLevel) + rpcLine + ';' + (commentPart ? ' ' + commentPart : ''));
                    continue;
                }

                // 处理字段定义
                if (inBlock && (codePart.includes('=') || codePart.startsWith('reserved'))) {
                    // 规范化字段定义
                    let fieldLine = codePart
                        .replace(/\s+/g, ' ')
                        .replace(/\s*=\s*/g, ' = ')
                        .replace(/;\s*$/, '');

                    formattedLines.push('  '.repeat(indentLevel) + fieldLine + ';' + (commentPart ? ' ' + commentPart : ''));
                    continue;
                }

                // 处理声明语句
                if (codePart.startsWith('syntax') || codePart.startsWith('package') || codePart.startsWith('option')) {
                    let declLine = codePart.replace(/\s+/g, ' ').replace(/;\s*$/, '');
                    formattedLines.push(declLine + ';' + (commentPart ? ' ' + commentPart : ''));
                    continue;
                }

                // 处理其他内容
                formattedLines.push('  '.repeat(indentLevel) + codePart + (commentPart ? ' ' + commentPart : ''));
            }

            // 如果启用了字段重新编号
            if (opts.renumberFields) {
                let currentNumber = opts.startNumber;
                const increment = opts.increment;

                // 遍历格式化后的行，查找并替换字段编号
                for (let i = 0; i < formattedLines.length; i++) {
                    const line = formattedLines[i];

                    // 检查是否是字段定义行（包含等号和分号）
                    if (line.includes(' = ') && line.includes(';') && !line.includes('reserved')) {
                        // 提取字段名称和类型
                        const parts = line.split(' = ');
                        if (parts.length === 2) {
                            const fieldPart = parts[0];
                            const valuePart = parts[1];

                            // 提取字段编号和可能的注释
                            const valueMatch = valuePart.match(/(\d+)(;)(.*)$/);
                            if (valueMatch) {
                                const fieldNumber = valueMatch[1];
                                const semicolon = valueMatch[2];
                                const comment = valueMatch[3] || '';

                                // 替换字段编号
                                const newLine = `${fieldPart} = ${currentNumber}${semicolon}${comment}`;
                                formattedLines[i] = newLine;

                                // 增加编号
                                currentNumber += increment;
                            }
                        }
                    }
                }
            }

            setOutput(formattedLines.join('\n'));
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to format Proto");
            setOutput("");
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
                                {isClient ? (
                                    <SyntaxHighlighter
                                        code={output}
                                        language="protobuf"
                                        className="text-sm !bg-transparent"
                                    />
                                ) : (
                                    <pre className="text-sm !bg-transparent">
                                        {output}
                                    </pre>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
} 