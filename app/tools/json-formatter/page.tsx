"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Copy } from "lucide-react"

function JsonView({ data, level = 0 }: { data: any; level?: number }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const indent = "  ".repeat(level)

  if (Array.isArray(data)) {
    if (data.length === 0) return <span>[]</span>
    return (
      <div>
        <span
          className="cursor-pointer hover:text-blue-500"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? "▶ [...]" : "▼ ["}
        </span>
        {!isCollapsed && (
          <>
            <div className="ml-4">
              {data.map((item, index) => (
                <div key={index}>
                  <JsonView data={item} level={level + 1} />
                  {index < data.length - 1 && ","}
                </div>
              ))}
            </div>
            {indent}]
          </>
        )}
      </div>
    )
  }

  if (typeof data === "object" && data !== null) {
    const entries = Object.entries(data)
    if (entries.length === 0) return <span>{"{}"}</span>
    return (
      <div>
        <span
          className="cursor-pointer hover:text-blue-500"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? "▶ {...}" : "▼ {"}
        </span>
        {!isCollapsed && (
          <>
            <div className="ml-4">
              {entries.map(([key, value], index) => (
                <div key={key}>
                  <span className="text-blue-500">"{key}"</span>:{" "}
                  <JsonView data={value} level={level + 1} />
                  {index < entries.length - 1 && ","}
                </div>
              ))}
            </div>
            {indent}{"}"}
          </>
        )}
      </div>
    )
  }

  return (
    <span>
      {typeof data === "string"
        ? `"${data}"`
        : typeof data === "undefined"
          ? "undefined"
          : String(data)}
    </span>
  )
}

interface JsonError {
  line: number
  column: number
  message: string
}

function getJsonErrorDetails(jsonString: string, error: Error): JsonError {
  const lines = jsonString.split('\n')
  const match = error.message.match(/at position (\d+)/)

  if (!match) {
    return {
      line: 1,
      column: 1,
      message: error.message
    }
  }

  const position = parseInt(match[1])
  let line = 1
  let column = position

  for (let i = 0; i < lines.length; i++) {
    if (column > lines[i].length + 1) { // +1 for newline
      column -= lines[i].length + 1
      line++
    } else {
      break
    }
  }

  // Clean up the error message
  let message = error.message
    .replace(/at position \d+/, '')
    .replace('JSON.parse: ', '')
    .trim()

  return { line, column, message }
}

export default function JsonFormatter() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState<JsonError | null>(null)

  const formatJson = (value: string) => {
    if (!value.trim()) {
      setOutput("")
      setError(null)
      return
    }

    try {
      const parsed = JSON.parse(value)
      setOutput(parsed)
      setError(null)
    } catch (e) {
      if (e instanceof Error) {
        const errorDetails = getJsonErrorDetails(value, e)
        setError(errorDetails)
      }
      setOutput("")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInput(newValue)
    formatJson(newValue)
  }

  const copyToClipboard = () => {
    const formattedJson = JSON.stringify(output, null, 2)
    navigator.clipboard.writeText(formattedJson)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">JSON Formatter</h1>
        <p className="text-muted-foreground">Format and validate JSON data</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <Textarea
            placeholder="Paste your JSON here..."
            className="min-h-[700px] max-h-[700px] font-mono custom-scrollbar"
            value={input}
            onChange={handleInputChange}
          />
        </Card>
        <Card className="p-4">
          {error ? (
            <div className="space-y-2">
              <p className="text-destructive font-medium">JSON 语法错误</p>
              <div className="text-sm space-y-1">
                <p>第 {error.line} 行，第 {error.column} 列</p>
                <p className="text-muted-foreground">{error.message}</p>
                <pre className="bg-muted p-2 rounded text-xs overflow-x-auto custom-scrollbar">
                  {input.split('\n')[error.line - 1]}
                  {'\n'}
                  {' '.repeat(error.column - 1)}^
                </pre>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-0 h-8 w-8"
                onClick={copyToClipboard}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <div className="font-mono min-h-[700px] max-h-[700px] text-sm overflow-auto custom-scrollbar">
                <JsonView data={output} />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}