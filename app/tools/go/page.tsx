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

interface GoOptions {
    packageName: string
    generateJson: boolean
    generateDb: boolean
    generateGorm: boolean
    usePointers: boolean
}

export default function GoTools() {
    const [sqlInput, setSqlInput] = useState("")
    const [protoInput, setProtoInput] = useState("")
    const [goInput, setGoInput] = useState("")
    const [output, setOutput] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [options, setOptions] = useState<GoOptions>({
        packageName: "main",
        generateJson: true,
        generateDb: false,
        generateGorm: true,
        usePointers: false
    })

    const handleOptionChange = (key: keyof GoOptions, value: any) => {
        const newOptions = { ...options, [key]: value }
        setOptions(newOptions)
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output)
    }

    // SQL 转 Go struct
    const sqlToGoStruct = () => {
        if (!sqlInput.trim()) {
            setError("Please enter SQL CREATE TABLE statement")
            setOutput("")
            return
        }

        try {
            // 解析 SQL CREATE TABLE 语句
            const tableName = extractTableName(sqlInput)
            const structName = camelCase(tableName, true)
            const columns = extractColumns(sqlInput)

            // 生成 Go struct
            let goStruct = `package ${options.packageName}\n\n`
            goStruct += `type ${structName} struct {\n`

            for (const col of columns) {
                const fieldName = camelCase(col.name, true)
                const fieldType = sqlTypeToGoType(col.type)

                goStruct += `\t${fieldName} ${options.usePointers ? '*' : ''}${fieldType}`

                // 添加 tag
                const tags: string[] = []
                if (options.generateJson) {
                    tags.push(`json:"${col.name.toLowerCase()}"`)
                }
                if (options.generateDb) {
                    tags.push(`db:"${col.name.toLowerCase()}"`)
                }
                if (options.generateGorm) {
                    let gormTag = `gorm:"column:${col.name}`

                    // 添加主键标记
                    if (col.name.toLowerCase() === 'id' || col.isPrimary) {
                        gormTag += ';primaryKey'
                    }

                    // 添加唯一索引标记
                    if (col.isUnique) {
                        gormTag += ';uniqueIndex'
                    }

                    // 添加自增标记
                    if (col.isAutoIncrement) {
                        gormTag += ';autoIncrement'
                    }

                    // 添加类型标记
                    if (col.type) {
                        gormTag += `;type:${col.type}`
                    }

                    // 添加默认值标记
                    if (col.defaultValue) {
                        gormTag += `;default:${col.defaultValue}`
                    }

                    gormTag += '"'
                    tags.push(gormTag)
                }

                if (tags.length > 0) {
                    goStruct += ` \`${tags.join(" ")}\``
                }

                goStruct += '\n'
            }

            goStruct += `}`

            setOutput(goStruct)
            setError(null)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to convert SQL to Go struct")
            setOutput("")
        }
    }

    // Proto 转 Go struct
    const protoToGoStruct = () => {
        if (!protoInput.trim()) {
            setError("Please enter Protocol Buffer definition")
            setOutput("")
            return
        }

        try {
            // 解析 Proto 定义
            const messages = extractProtoMessages(protoInput)

            // 生成 Go struct
            let goStruct = `package ${options.packageName}\n\n`

            for (const msg of messages) {
                goStruct += `type ${msg.name} struct {\n`

                for (const field of msg.fields) {
                    const fieldName = camelCase(field.name, true)
                    let fieldType

                    if (field.isMap) {
                        fieldType = protoTypeToGoType('', false, true, field.mapKeyType, field.mapValueType)
                    } else {
                        fieldType = protoTypeToGoType(field.type, field.repeated)
                    }

                    goStruct += `\t${fieldName} ${options.usePointers && !field.repeated && !field.isMap ? '*' : ''}${fieldType}`

                    // 添加 tag
                    const tags: string[] = []
                    if (options.generateJson) {
                        tags.push(`json:"${field.name.toLowerCase()}"`)
                    }
                    if (options.generateDb) {
                        tags.push(`db:"${field.name.toLowerCase()}"`)
                    }
                    if (options.generateGorm) {
                        tags.push(`gorm:"column:${field.name.toLowerCase()}"`)
                    }

                    if (tags.length > 0) {
                        goStruct += ` \`${tags.join(" ")}\``
                    }

                    goStruct += '\n'
                }

                goStruct += `}\n\n`
            }

            setOutput(goStruct.trim())
            setError(null)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to convert Proto to Go struct")
            setOutput("")
        }
    }

    // Go struct 转 SQL
    const goToSql = () => {
        if (!goInput.trim()) {
            setError("Please enter Go struct definition")
            setOutput("")
            return
        }

        try {
            // 解析 Go struct
            const structs = extractGoStructs(goInput)

            // 生成 SQL CREATE TABLE 语句
            let sql = ""

            for (const struct of structs) {
                sql += `CREATE TABLE ${snakeCase(struct.name)} (\n`

                const columns: string[] = []
                for (const field of struct.fields) {
                    const columnName = snakeCase(field.name)
                    const columnType = goTypeToSqlType(field.type)

                    columns.push(`  ${columnName} ${columnType}`)
                }

                sql += columns.join(",\n")
                sql += `\n);\n\n`
            }

            setOutput(sql.trim())
            setError(null)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to convert Go struct to SQL")
            setOutput("")
        }
    }

    // Go struct 转 Proto
    const goToProto = () => {
        if (!goInput.trim()) {
            setError("Please enter Go struct definition")
            setOutput("")
            return
        }

        try {
            // 解析 Go struct
            const structs = extractGoStructs(goInput)

            // 生成 Proto 定义
            let proto = `syntax = "proto3";\n\n`
            proto += `package ${options.packageName};\n\n`

            for (const struct of structs) {
                proto += `message ${struct.name} {\n`

                for (let i = 0; i < struct.fields.length; i++) {
                    const field = struct.fields[i]
                    const fieldName = snakeCase(field.name)
                    const fieldType = goTypeToProtoType(field.type)
                    const repeated = field.type.startsWith("[]")

                    proto += `  ${repeated ? 'repeated ' : ''}${fieldType} ${fieldName} = ${i + 1};\n`
                }

                proto += `}\n\n`
            }

            setOutput(proto.trim())
            setError(null)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to convert Go struct to Proto")
            setOutput("")
        }
    }

    // 辅助函数
    function extractTableName(sql: string): string {
        const match = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?/i)
        if (!match) throw new Error("Could not extract table name from SQL")
        return match[1]
    }

    function extractColumns(sql: string): { name: string, type: string, isPrimary: boolean, isUnique: boolean, isAutoIncrement: boolean, defaultValue: string | null }[] {
        // 提取表定义部分
        const tableDefMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(?:\w+)[`"']?\s*\(([\s\S]+?)\)(?:\s+ENGINE|$)/i)
        if (!tableDefMatch) throw new Error("Could not extract table definition from SQL")

        const tableDefinition = tableDefMatch[1]

        // 分割列定义和表约束
        const lines = tableDefinition.split(',').map(line => line.trim())

        const columns: {
            name: string,
            type: string,
            isPrimary: boolean,
            isUnique: boolean,
            isAutoIncrement: boolean,
            defaultValue: string | null
        }[] = []

        // 查找主键和唯一键约束
        const primaryKeys: string[] = []
        const uniqueKeys: Set<string> = new Set()

        for (const line of lines) {
            if (line.toUpperCase().includes('PRIMARY KEY')) {
                const pkMatch = line.match(/PRIMARY\s+KEY\s*\(\s*[`"']?(\w+)[`"']?\s*\)/i)
                if (pkMatch) {
                    primaryKeys.push(pkMatch[1])
                }
            }

            if (line.toUpperCase().includes('UNIQUE KEY')) {
                const ukMatch = line.match(/UNIQUE\s+KEY\s*[`"']?\w+[`"']?\s*\(\s*[`"']?(\w+)[`"']?\s*\)/i)
                if (ukMatch) {
                    uniqueKeys.add(ukMatch[1])
                }
            }
        }

        // 解析列定义
        for (const line of lines) {
            // 跳过表约束行
            if (line.toUpperCase().startsWith('PRIMARY KEY') ||
                line.toUpperCase().startsWith('FOREIGN KEY') ||
                line.toUpperCase().startsWith('UNIQUE KEY') ||
                line.toUpperCase().startsWith('KEY') ||
                line.toUpperCase().startsWith('INDEX')) {
                continue
            }

            // 匹配列定义，如 `id` bigint(18) NOT NULL AUTO_INCREMENT
            const columnMatch = line.match(/[`"']?(\w+)[`"']?\s+([^\s,]+(?:\([^)]+\))?)\s*(.*)/i)
            if (!columnMatch) continue

            const name = columnMatch[1]
            const type = columnMatch[2]
            const constraints = columnMatch[3] || ''

            // 检查是否为主键
            const isPrimary = primaryKeys.includes(name) || constraints.toUpperCase().includes('PRIMARY KEY')

            // 检查是否为唯一键
            const isUnique = uniqueKeys.has(name) || constraints.toUpperCase().includes('UNIQUE')

            // 检查是否自增
            const isAutoIncrement = constraints.toUpperCase().includes('AUTO_INCREMENT')

            // 提取默认值
            let defaultValue: string | null = null
            const defaultMatch = constraints.match(/DEFAULT\s+['"]?([^'"]+)['"]?/i)
            if (defaultMatch) {
                defaultValue = defaultMatch[1]
            }

            columns.push({
                name,
                type,
                isPrimary,
                isUnique,
                isAutoIncrement,
                defaultValue
            })
        }

        return columns
    }

    function sqlTypeToGoType(sqlType: string): string {
        const typeMap: Record<string, string> = {
            'INT': 'int',
            'INTEGER': 'int',
            'TINYINT': 'int8',
            'SMALLINT': 'int16',
            'MEDIUMINT': 'int32',
            'BIGINT': 'int64',
            'FLOAT': 'float32',
            'DOUBLE': 'float64',
            'DECIMAL': 'float64',
            'CHAR': 'string',
            'VARCHAR': 'string',
            'TEXT': 'string',
            'LONGTEXT': 'string',
            'DATE': 'time.Time',
            'DATETIME': 'time.Time',
            'TIMESTAMP': 'time.Time',
            'BOOLEAN': 'bool',
            'BOOL': 'bool',
            'BLOB': '[]byte',
            'JSON': 'json.RawMessage',
        }

        // 处理带括号的类型，如 VARCHAR(255)
        const baseType = sqlType.split('(')[0].toUpperCase()
        return typeMap[baseType] || 'interface{}'
    }

    function extractProtoMessages(proto: string): { name: string, fields: { name: string, type: string, repeated: boolean, isMap: boolean, mapKeyType?: string, mapValueType?: string }[] }[] {
        const messages: {
            name: string,
            fields: {
                name: string,
                type: string,
                repeated: boolean,
                isMap: boolean,
                mapKeyType?: string,
                mapValueType?: string
            }[]
        }[] = []

        // 提取消息定义
        const messageRegex = /message\s+(\w+)\s*\{([^}]*)\}/gs
        let match

        while ((match = messageRegex.exec(proto)) !== null) {
            const messageName = match[1]
            const messageBody = match[2]

            const fields: {
                name: string,
                type: string,
                repeated: boolean,
                isMap: boolean,
                mapKeyType?: string,
                mapValueType?: string
            }[] = []

            // 分割字段定义，按行处理
            const lines = messageBody.split(/[\r\n;]+/).map(line => line.trim()).filter(Boolean)

            for (const line of lines) {
                // 跳过纯注释行和保留字段
                if (line.startsWith('//') || line.startsWith('reserved')) {
                    continue
                }

                // 提取行中的注释部分
                const commentIndex = line.indexOf('//')
                const codeLine = commentIndex >= 0 ? line.substring(0, commentIndex).trim() : line.trim()
                if (!codeLine) continue

                // 处理 map 类型
                const mapMatch = codeLine.match(/map\s*<\s*(\w+)\s*,\s*(\w+)\s*>\s*(\w+)\s*=\s*\d+/)
                if (mapMatch) {
                    const mapKeyType = mapMatch[1]
                    const mapValueType = mapMatch[2]
                    const fieldName = mapMatch[3]

                    fields.push({
                        name: fieldName,
                        type: `map<${mapKeyType},${mapValueType}>`,
                        repeated: false,
                        isMap: true,
                        mapKeyType,
                        mapValueType
                    })
                    continue
                }

                // 处理普通字段和重复字段
                const fieldMatch = codeLine.match(/(repeated)?\s*(\w+(?:\.\w+)?)\s+(\w+)\s*=\s*\d+/)
                if (fieldMatch) {
                    const repeated = !!fieldMatch[1]
                    const fieldType = fieldMatch[2]
                    const fieldName = fieldMatch[3]

                    fields.push({
                        name: fieldName,
                        type: fieldType,
                        repeated,
                        isMap: false
                    })
                }
            }

            messages.push({
                name: messageName,
                fields
            })
        }

        return messages
    }

    function protoTypeToGoType(protoType: string, repeated: boolean, isMap: boolean = false, mapKeyType?: string, mapValueType?: string): string {
        if (isMap && mapKeyType && mapValueType) {
            return `map[${protoTypeToGoType(mapKeyType, false)}]${protoTypeToGoType(mapValueType, false)}`
        }

        const typeMap: Record<string, string> = {
            'double': 'float64',
            'float': 'float32',
            'int32': 'int32',
            'int64': 'int64',
            'uint32': 'uint32',
            'uint64': 'uint64',
            'sint32': 'int32',
            'sint64': 'int64',
            'fixed32': 'uint32',
            'fixed64': 'uint64',
            'sfixed32': 'int32',
            'sfixed64': 'int64',
            'bool': 'bool',
            'string': 'string',
            'bytes': '[]byte',
            'google.protobuf.Timestamp': 'time.Time'
        }

        const goType = typeMap[protoType] || protoType

        if (repeated) {
            return `[]${goType}`
        }

        return goType
    }

    function extractGoStructs(goCode: string): { name: string, fields: { name: string, type: string }[] }[] {
        const structs: { name: string, fields: { name: string, type: string }[] }[] = []

        // 匹配 struct 定义
        const structRegex = /type\s+(\w+)\s+struct\s*{([^}]*)}/g
        let structMatch

        while ((structMatch = structRegex.exec(goCode)) !== null) {
            const structName = structMatch[1]
            const structBody = structMatch[2]

            const fields: { name: string, type: string }[] = []

            // 匹配字段定义
            const fieldLines = structBody.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'))

            for (const line of fieldLines) {
                // 匹配字段定义，如 "Name string `json:"name"`"
                const fieldMatch = line.match(/(\w+)\s+([*\[\]]*\w+(?:\.\w+)?)/)
                if (!fieldMatch) continue

                const fieldName = fieldMatch[1]
                const fieldType = fieldMatch[2]

                fields.push({ name: fieldName, type: fieldType })
            }

            structs.push({ name: structName, fields })
        }

        return structs
    }

    function goTypeToSqlType(goType: string): string {
        const typeMap: Record<string, string> = {
            'int': 'INTEGER',
            'int8': 'TINYINT',
            'int16': 'SMALLINT',
            'int32': 'INT',
            'int64': 'BIGINT',
            'uint': 'INTEGER UNSIGNED',
            'uint8': 'TINYINT UNSIGNED',
            'uint16': 'SMALLINT UNSIGNED',
            'uint32': 'INT UNSIGNED',
            'uint64': 'BIGINT UNSIGNED',
            'float32': 'FLOAT',
            'float64': 'DOUBLE',
            'string': 'VARCHAR(255)',
            'bool': 'BOOLEAN',
            '[]byte': 'BLOB',
            'time.Time': 'DATETIME',
            'json.RawMessage': 'JSON',
        }

        // 处理指针类型
        if (goType.startsWith('*')) {
            return goTypeToSqlType(goType.substring(1))
        }

        // 处理切片类型
        if (goType.startsWith('[]')) {
            return 'JSON'
        }

        return typeMap[goType] || 'TEXT'
    }

    function goTypeToProtoType(goType: string): string {
        const typeMap: Record<string, string> = {
            'int': 'int32',
            'int8': 'int32',
            'int16': 'int32',
            'int32': 'int32',
            'int64': 'int64',
            'uint': 'uint32',
            'uint8': 'uint32',
            'uint16': 'uint32',
            'uint32': 'uint32',
            'uint64': 'uint64',
            'float32': 'float',
            'float64': 'double',
            'string': 'string',
            'bool': 'bool',
            '[]byte': 'bytes',
            'time.Time': 'google.protobuf.Timestamp',
            'json.RawMessage': 'bytes',
        }

        // 处理指针类型
        if (goType.startsWith('*')) {
            return goTypeToProtoType(goType.substring(1))
        }

        // 处理切片类型
        if (goType.startsWith('[]')) {
            return goTypeToProtoType(goType.substring(2))
        }

        return typeMap[goType] || goType
    }

    function camelCase(str: string, capitalizeFirst: boolean = false): string {
        const words = str.split(/[_\s-]/).filter(Boolean)

        return words.map((word, index) => {
            if (index === 0 && !capitalizeFirst) {
                return word.toLowerCase()
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        }).join('')
    }

    function snakeCase(str: string): string {
        return str
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '')
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Go Tools</h1>
                <p className="text-muted-foreground">Convert between SQL, Protocol Buffers and Go structs</p>
            </div>

            <Card className="p-4">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            />
                            <Label htmlFor="generateGorm">GORM Tags</Label>
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Checkbox
                                id="usePointers"
                                checked={options.usePointers}
                                onCheckedChange={(checked) => handleOptionChange('usePointers', !!checked)}
                            />
                            <Label htmlFor="usePointers">Use Pointers</Label>
                        </div>
                    </div>
                </div>
            </Card>

            <Tabs defaultValue="sql-to-go" className="space-y-4">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
                    <TabsTrigger value="sql-to-go">SQL → Go</TabsTrigger>
                    <TabsTrigger value="proto-to-go">Proto → Go</TabsTrigger>
                    <TabsTrigger value="go-to-sql">Go → SQL</TabsTrigger>
                    <TabsTrigger value="go-to-proto">Go → Proto</TabsTrigger>
                </TabsList>

                <TabsContent value="sql-to-go" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4 space-y-4">
                            <Textarea
                                placeholder="Enter SQL CREATE TABLE statement..."
                                className="min-h-[400px] font-mono"
                                value={sqlInput}
                                onChange={(e) => setSqlInput(e.target.value)}
                            />
                            <Button onClick={sqlToGoStruct}>Convert to Go Struct</Button>
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
                                            language="go"
                                            className="text-sm !bg-transparent"
                                        />
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="proto-to-go" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4 space-y-4">
                            <Textarea
                                placeholder="Enter Protocol Buffer definition..."
                                className="min-h-[400px] font-mono"
                                value={protoInput}
                                onChange={(e) => setProtoInput(e.target.value)}
                            />
                            <Button onClick={protoToGoStruct}>Convert to Go Struct</Button>
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
                                            language="go"
                                            className="text-sm !bg-transparent"
                                        />
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="go-to-sql" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4 space-y-4">
                            <Textarea
                                placeholder="Enter Go struct definition..."
                                className="min-h-[400px] font-mono"
                                value={goInput}
                                onChange={(e) => setGoInput(e.target.value)}
                            />
                            <Button onClick={goToSql}>Convert to SQL</Button>
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

                <TabsContent value="go-to-proto" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4 space-y-4">
                            <Textarea
                                placeholder="Enter Go struct definition..."
                                className="min-h-[400px] font-mono"
                                value={goInput}
                                onChange={(e) => setGoInput(e.target.value)}
                            />
                            <Button onClick={goToProto}>Convert to Proto</Button>
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