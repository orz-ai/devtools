"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Copy } from "lucide-react"
import { SyntaxHighlighter } from "@/components/syntax-highlighter"

export default function SqlFormatter() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)

  const formatSql = (value: string) => {
    if (!value.trim()) {
      setOutput("")
      setError(null)
      return
    }

    try {
      // Basic SQL formatting - in a real app, use a proper SQL formatter library
      const formatted = value
        .replace(/\s+/g, " ")
        .replace(/\s*([,()])\s*/g, "$1 ")
        .replace(/\s*([=<>])\s*/g, " $1 ")
        .replace(/\bSELECT\b/gi, "\nSELECT")
        .replace(/\bFROM\b/gi, "\nFROM")
        .replace(/\bWHERE\b/gi, "\nWHERE")
        .replace(/\bAND\b/gi, "\n  AND")
        .replace(/\bOR\b/gi, "\n  OR")
        .replace(/\bGROUP BY\b/gi, "\nGROUP BY")
        .replace(/\bORDER BY\b/gi, "\nORDER BY")
        .replace(/\bLIMIT\b/gi, "\nLIMIT")
        .trim()

      setOutput(formatted)
      setError(null)
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message)
      }
      setOutput("")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInput(newValue)
    formatSql(newValue)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SQL Formatter</h1>
        <p className="text-muted-foreground">Format SQL queries for better readability</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <Textarea
            placeholder="Paste your SQL query here..."
            className="min-h-[700px] max-h-[700px] font-mono custom-scrollbar"
            value={input}
            onChange={handleInputChange}
          />
        </Card>
        <Card className="p-4">
          {error ? (
            <div className="space-y-2">
              <p className="text-destructive font-medium">SQL 语法错误</p>
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
                  language="sql"
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