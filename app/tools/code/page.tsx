"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Copy } from "lucide-react"
import { SyntaxHighlighter } from "@/components/syntax-highlighter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
    sqlToGo,
    protoToGo,
    goToSql,
    goToProto,
    sqlToJava,
    protoToJava,
    javaToSql,
    javaToProto,
    sqlToPython,
    protoToPython,
    pythonToSql,
    pythonToProto,
    sqlToTypeScript,
    protoToTypeScript,
    typeScriptToSql,
    typeScriptToProto
} from "@/lib/code-converters"

type Language = "go" | "java" | "python" | "typescript"

interface ConversionOptions {
    packageName: string
    generateJson: boolean
    generateDb: boolean
    generateGorm: boolean
    usePointers: boolean
    language: Language
}

export default function CodeConverterTools() {
    const [sqlInput, setSqlInput] = useState("")
    const [protoInput, setProtoInput] = useState("")
    const [codeInput, setCodeInput] = useState("")
    const [output, setOutput] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [options, setOptions] = useState<ConversionOptions>({
        packageName: "main",
        generateJson: true,
        generateDb: false,
        generateGorm: true,
        usePointers: false,
        language: "go"
    })

    const handleOptionChange = (key: keyof ConversionOptions, value: any) => {
        const newOptions = { ...options, [key]: value }
        setOptions(newOptions)
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output)
    }

    // SQL 转代码
    const sqlToCode = () => {
        if (!sqlInput.trim()) {
            setError("Please enter SQL CREATE TABLE statement")
            setOutput("")
            return
        }

        try {
            let result = ""

            switch (options.language) {
                case "go":
                    result = sqlToGo(sqlInput, options)
                    break
                case "java":
                    result = sqlToJava(sqlInput, options)
                    break
                case "python":
                    result = sqlToPython(sqlInput, options)
                    break
                case "typescript":
                    result = sqlToTypeScript(sqlInput, options)
                    break
            }

            setOutput(result)
            setError(null)
        } catch (e) {
            setError(e instanceof Error ? e.message : `Failed to convert SQL to ${options.language}`)
            setOutput("")
        }
    }

    // Proto 转代码
    const protoToCode = () => {
        if (!protoInput.trim()) {
            setError("Please enter Protocol Buffer definition")
            setOutput("")
            return
        }

        try {
            let result = ""

            switch (options.language) {
                case "go":
                    result = protoToGo(protoInput, options)
                    break
                case "java":
                    result = protoToJava(protoInput, options)
                    break
                case "python":
                    result = protoToPython(protoInput, options)
                    break
                case "typescript":
                    result = protoToTypeScript(protoInput, options)
                    break
            }

            setOutput(result)
            setError(null)
        } catch (e) {
            setError(e instanceof Error ? e.message : `Failed to convert Proto to ${options.language}`)
            setOutput("")
        }
    }

    // 代码转 SQL
    const codeToSql = () => {
        if (!codeInput.trim()) {
            setError(`Please enter ${options.language} code`)
            setOutput("")
            return
        }

        try {
            let result = ""

            switch (options.language) {
                case "go":
                    result = goToSql(codeInput, options)
                    break
                case "java":
                    result = javaToSql(codeInput, options)
                    break
                case "python":
                    result = pythonToSql(codeInput, options)
                    break
                case "typescript":
                    result = typeScriptToSql(codeInput, options)
                    break
            }

            setOutput(result)
            setError(null)
        } catch (e) {
            setError(e instanceof Error ? e.message : `Failed to convert ${options.language} to SQL`)
            setOutput("")
        }
    }

    // 代码转 Proto
    const codeToProto = () => {
        if (!codeInput.trim()) {
            setError(`Please enter ${options.language} code`)
            setOutput("")
            return
        }

        try {
            let result = ""

            switch (options.language) {
                case "go":
                    result = goToProto(codeInput, options)
                    break
                case "java":
                    result = javaToProto(codeInput, options)
                    break
                case "python":
                    result = pythonToProto(codeInput, options)
                    break
                case "typescript":
                    result = typeScriptToProto(codeInput, options)
                    break
            }

            setOutput(result)
            setError(null)
        } catch (e) {
            setError(e instanceof Error ? e.message : `Failed to convert ${options.language} to Proto`)
            setOutput("")
        }
    }

    // 获取当前语言的输入占位符
    const getCodePlaceholder = () => {
        switch (options.language) {
            case "go":
                return "Enter Go struct definition..."
            case "java":
                return "Enter Java class definition..."
            case "python":
                return "Enter Python class definition..."
            case "typescript":
                return "Enter TypeScript interface definition..."
            default:
                return "Enter code..."
        }
    }

    // 获取当前语言的语法高亮语言
    const getSyntaxLanguage = () => {
        switch (options.language) {
            case "go":
                return "go"
            case "java":
                return "java"
            case "python":
                return "python"
            case "typescript":
                return "typescript"
            default:
                return "text"
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Code Generator</h1>
                <p className="text-muted-foreground">Convert between SQL, Protocol Buffers and various programming languages</p>
            </div>

            <Card className="p-4">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="language">Language</Label>
                            <Select
                                value={options.language}
                                onValueChange={(value) => handleOptionChange('language', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="go">Go</SelectItem>
                                    <SelectItem value="java">Java</SelectItem>
                                    <SelectItem value="python">Python</SelectItem>
                                    <SelectItem value="typescript">TypeScript</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="packageName">Package Name</Label>
                            <Input
                                id="packageName"
                                value={options.packageName}
                                onChange={(e) => handleOptionChange('packageName', e.target.value)}
                                placeholder="main"
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Checkbox
                                id="generateJson"
                                checked={options.generateJson}
                                onCheckedChange={(checked) => handleOptionChange('generateJson', !!checked)}
                            />
                            <Label htmlFor="generateJson">JSON Tags</Label>
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Checkbox
                                id="generateDb"
                                checked={options.generateDb}
                                onCheckedChange={(checked) => handleOptionChange('generateDb', !!checked)}
                            />
                            <Label htmlFor="generateDb">DB Tags</Label>
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Checkbox
                                id="generateGorm"
                                checked={options.generateGorm}
                                onCheckedChange={(checked) => handleOptionChange('generateGorm', !!checked)}
                                disabled={options.language !== "go"}
                            />
                            <Label htmlFor="generateGorm">GORM Tags</Label>
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Checkbox
                                id="usePointers"
                                checked={options.usePointers}
                                onCheckedChange={(checked) => handleOptionChange('usePointers', !!checked)}
                                disabled={options.language !== "go"}
                            />
                            <Label htmlFor="usePointers">Use Pointers</Label>
                        </div>
                    </div>
                </div>
            </Card>

            <Tabs defaultValue="sql-to-code" className="space-y-4">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
                    <TabsTrigger value="sql-to-code">SQL → {options.language.toUpperCase()}</TabsTrigger>
                    <TabsTrigger value="proto-to-code">Proto → {options.language.toUpperCase()}</TabsTrigger>
                    <TabsTrigger value="code-to-sql">{options.language.toUpperCase()} → SQL</TabsTrigger>
                    <TabsTrigger value="code-to-proto">{options.language.toUpperCase()} → Proto</TabsTrigger>
                </TabsList>

                <TabsContent value="sql-to-code" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4 space-y-4">
                            <Textarea
                                placeholder="Enter SQL CREATE TABLE statement..."
                                className="min-h-[400px] font-mono"
                                value={sqlInput}
                                onChange={(e) => setSqlInput(e.target.value)}
                            />
                            <Button onClick={sqlToCode}>Convert to {options.language.toUpperCase()}</Button>
                        </Card>
                        <Card className="p-4 relative">
                            {error ? (
                                <div className="space-y-2">
                                    <p className="text-destructive font-medium">Error</p>
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
                                    <div className="min-h-[600px] max-h-[600px] overflow-auto custom-scrollbar">
                                        <SyntaxHighlighter
                                            code={output}
                                            language={getSyntaxLanguage()}
                                            className="text-sm !bg-transparent"
                                        />
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="proto-to-code" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4 space-y-4">
                            <Textarea
                                placeholder="Enter Protocol Buffer definition..."
                                className="min-h-[400px] font-mono"
                                value={protoInput}
                                onChange={(e) => setProtoInput(e.target.value)}
                            />
                            <Button onClick={protoToCode}>Convert to {options.language.toUpperCase()}</Button>
                        </Card>
                        <Card className="p-4 relative">
                            {error ? (
                                <div className="space-y-2">
                                    <p className="text-destructive font-medium">Error</p>
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
                                    <div className="min-h-[600px] max-h-[600px] overflow-auto custom-scrollbar">
                                        <SyntaxHighlighter
                                            code={output}
                                            language={getSyntaxLanguage()}
                                            className="text-sm !bg-transparent"
                                        />
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="code-to-sql" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4 space-y-4">
                            <Textarea
                                placeholder={getCodePlaceholder()}
                                className="min-h-[400px] font-mono"
                                value={codeInput}
                                onChange={(e) => setCodeInput(e.target.value)}
                            />
                            <Button onClick={codeToSql}>Convert to SQL</Button>
                        </Card>
                        <Card className="p-4 relative">
                            {error ? (
                                <div className="space-y-2">
                                    <p className="text-destructive font-medium">Error</p>
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
                                    <div className="min-h-[600px] max-h-[600px] overflow-auto custom-scrollbar">
                                        <SyntaxHighlighter
                                            code={output}
                                            language="sql"
                                            className="text-sm !bg-transparent"
                                        />
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="code-to-proto" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4 space-y-4">
                            <Textarea
                                placeholder={getCodePlaceholder()}
                                className="min-h-[400px] font-mono"
                                value={codeInput}
                                onChange={(e) => setCodeInput(e.target.value)}
                            />
                            <Button onClick={codeToProto}>Convert to Proto</Button>
                        </Card>
                        <Card className="p-4 relative">
                            {error ? (
                                <div className="space-y-2">
                                    <p className="text-destructive font-medium">Error</p>
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
                                    <div className="min-h-[600px] max-h-[600px] overflow-auto custom-scrollbar">
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
                </TabsContent>
            </Tabs>
        </div>
    )
} 