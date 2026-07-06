"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { SyntaxHighlighter } from "@/components/syntax-highlighter"

interface FormatOptions {
  startNumber: number
  increment: number
  renumberFields: boolean
}

type Segment = {
  text: string
  kind: "open" | "close" | "statement" | "comment"
  trailingComment?: string
}

type BlockContext = "message" | "enum" | "service" | "oneof" | "extend" | "block"

interface StackEntry {
  type: BlockContext
  nextFieldNumber?: number
}

const INDENT = "  "

function findLineCommentIndex(line: string) {
  let quote: "'" | '"' | null = null
  let escaped = false

  for (let i = 0; i < line.length - 1; i++) {
    const char = line[i]
    const next = line[i + 1]

    if (quote) {
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      continue
    }

    if (char === "/" && next === "/") {
      return i
    }
  }

  return -1
}

function splitCodeSegments(code: string, trailingComment?: string): Segment[] {
  const segments: Segment[] = []
  let buffer = ""
  let quote: "'" | '"' | null = null
  let escaped = false

  const pushStatement = () => {
    const text = buffer.trim()
    if (text) {
      segments.push({ text, kind: "statement" })
    }
    buffer = ""
  }

  for (let i = 0; i < code.length; i++) {
    const char = code[i]

    if (quote) {
      buffer += char
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      buffer += char
      continue
    }

    if (char === "{") {
      const text = buffer.trim()
      segments.push({ text, kind: "open" })
      buffer = ""
      continue
    }

    if (char === "}") {
      pushStatement()
      segments.push({ text: "}", kind: "close" })
      continue
    }

    if (char === ";") {
      pushStatement()
      continue
    }

    buffer += char
  }

  pushStatement()

  if (trailingComment && segments.length > 0) {
    segments[segments.length - 1].trailingComment = trailingComment.trim()
  }

  return segments
}

function normalizeSpaces(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*<\s*/g, "<")
    .replace(/\s*>\s*/g, ">")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*=\s*/g, " = ")
    .replace(/\(\s*/g, "(")
    .replace(/\s*\)/g, ")")
    .replace(/\[\s*/g, "[")
    .replace(/\s*\]/g, "]")
    .replace(/\s+;/g, ";")
}

function getBlockType(statement: string): BlockContext {
  const normalized = normalizeSpaces(statement)

  if (/^message\s+\w+/i.test(normalized)) return "message"
  if (/^enum\s+\w+/i.test(normalized)) return "enum"
  if (/^service\s+\w+/i.test(normalized)) return "service"
  if (/^oneof\s+\w+/i.test(normalized)) return "oneof"
  if (/^extend\s+/i.test(normalized)) return "extend"

  return "block"
}

function getActiveFieldScope(stack: StackEntry[]) {
  for (let i = stack.length - 1; i >= 0; i--) {
    const entry = stack[i]

    if (entry.type === "enum" || entry.type === "service") {
      return null
    }

    if (entry.type === "message" || entry.type === "extend") {
      return entry
    }
  }

  return null
}

function isFieldStatement(statement: string, stack: StackEntry[]) {
  if (!getActiveFieldScope(stack)) return false

  const normalized = normalizeSpaces(statement)

  if (
    /^(syntax|package|import|option|reserved|extensions|rpc|returns|message|enum|service|oneof|extend)\b/i.test(
      normalized
    )
  ) {
    return false
  }

  return /^(?:(?:optional|required|repeated)\s+)?(?:map<[^>]+>|\.?[\w.]+)\s+\w+\s*=\s*\d+\b/.test(
    normalized
  )
}

function renumberField(statement: string, scope: StackEntry, increment: number) {
  const normalized = normalizeSpaces(statement)
  const nextNumber = scope.nextFieldNumber ?? 1

  scope.nextFieldNumber = nextNumber + increment

  return normalized.replace(/=\s*\d+\b/, `= ${nextNumber}`)
}

function formatStatement(statement: string, stack: StackEntry[], options: FormatOptions) {
  const scope = getActiveFieldScope(stack)

  if (options.renumberFields && scope && isFieldStatement(statement, stack)) {
    return renumberField(statement, scope, options.increment)
  }

  return normalizeSpaces(statement)
}

function appendLine(lines: string[], line: string) {
  if (!line && lines[lines.length - 1] === "") return
  lines.push(line)
}

function isNumberedStatement(code: string) {
  return /^(?:(?:optional|required|repeated)\s+)?(?:map<[^>]+>|\.?[\w.]+)\s+\w+\s*=\s*\d+\b.*;$/.test(
    code.trim()
  )
}

function parseNumberedFieldLine(line: string) {
  const commentIndex = findLineCommentIndex(line)
  const code = (commentIndex >= 0 ? line.slice(0, commentIndex) : line).trimEnd()
  const comment = commentIndex >= 0 ? line.slice(commentIndex).trim() : ""
  const match = code.match(
    /^(\s*(?:(?:optional|required|repeated)\s+)?(?:map<[^>]+>|\.?[\w.]+)\s+\w+)\s*=\s*(\d+\b.*;)$/
  )

  if (!match || !isNumberedStatement(code)) return null

  return {
    prefix: match[1].trimEnd(),
    value: match[2].trim(),
    comment,
  }
}

function alignNumberedFields(lines: string[]) {
  const aligned = [...lines]
  let group: number[] = []

  const flushGroup = () => {
    if (group.length < 2) {
      group = []
      return
    }

    const parts = group
      .map((index) => {
        const parsed = parseNumberedFieldLine(aligned[index])
        return parsed ? { index, ...parsed } : null
      })
      .filter((part): part is { index: number; prefix: string; value: string; comment: string } => Boolean(part))

    if (parts.length < 2) {
      group = []
      return
    }

    const equalColumn = Math.max(...parts.map((part) => part.prefix.length)) + 1
    const codeParts = parts.map((part) => ({
      ...part,
      code: `${part.prefix.padEnd(equalColumn)}= ${part.value}`,
    }))
    const commentParts = codeParts.filter((part) => part.comment)
    const commentColumn =
      commentParts.length > 1 ? Math.max(...codeParts.map((part) => part.code.length)) + 2 : 0

    for (const part of codeParts) {
      if (part.comment) {
        const padding = Math.max(1, commentColumn - part.code.length)
        aligned[part.index] = `${part.code}${" ".repeat(padding)}${part.comment}`
      } else {
        aligned[part.index] = part.code
      }
    }

    group = []
  }

  for (let i = 0; i < aligned.length; i++) {
    if (!parseNumberedFieldLine(aligned[i])) {
      flushGroup()
      continue
    }

    group.push(i)
  }

  flushGroup()

  return aligned
}

function formatProtoDefinition(value: string, options: FormatOptions) {
  const lines: string[] = []
  const stack: StackEntry[] = []
  const inputLines = value.replace(/\r\n/g, "\n").replace(/\t/g, INDENT).split("\n")

  for (const rawLine of inputLines) {
    const trimmedLine = rawLine.trim()

    if (!trimmedLine) {
      appendLine(lines, "")
      continue
    }

    const commentIndex = findLineCommentIndex(rawLine)
    const hasComment = commentIndex >= 0
    const codePart = (hasComment ? rawLine.slice(0, commentIndex) : rawLine).trim()
    const commentPart = hasComment ? rawLine.slice(commentIndex).trim() : undefined

    if (!codePart && commentPart) {
      appendLine(lines, `${INDENT.repeat(stack.length)}${commentPart}`)
      continue
    }

    const segments = splitCodeSegments(codePart, commentPart)

    for (const segment of segments) {
      if (segment.kind === "comment") {
        appendLine(lines, `${INDENT.repeat(stack.length)}${segment.text}`)
        continue
      }

      if (segment.kind === "close") {
        stack.pop()
        const line = `${INDENT.repeat(stack.length)}}${segment.trailingComment ? ` ${segment.trailingComment}` : ""}`
        appendLine(lines, line)
        continue
      }

      if (segment.kind === "open") {
        const statement = normalizeSpaces(segment.text)
        const blockType = getBlockType(statement)

        if (
          stack.length === 0 &&
          /^(message|enum|service)\b/i.test(statement) &&
          lines.length > 0 &&
          lines[lines.length - 1] !== ""
        ) {
          appendLine(lines, "")
        }

        const line = `${INDENT.repeat(stack.length)}${statement} {${segment.trailingComment ? ` ${segment.trailingComment}` : ""}`
        appendLine(lines, line)

        stack.push({
          type: blockType,
          nextFieldNumber:
            blockType === "message" || blockType === "extend" ? options.startNumber : undefined,
        })
        continue
      }

      const statement = formatStatement(segment.text, stack, options)
      const line = `${INDENT.repeat(stack.length)}${statement};${segment.trailingComment ? ` ${segment.trailingComment}` : ""}`
      appendLine(lines, line)
    }
  }

  return alignNumberedFields(lines).join("\n").trim()
}

export default function ProtoBeautifier() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<FormatOptions>({
    startNumber: 1,
    increment: 1,
    renumberFields: true,
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
      setOutput(formatProtoDefinition(value, opts))
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

  const handleOptionChange = <K extends keyof FormatOptions>(key: K, value: FormatOptions[K]) => {
    const newOptions = { ...options, [key]: value }
    setOptions(newOptions)
    formatProto(input, newOptions)
  }

  const copyToClipboard = () => {
    if (output) navigator.clipboard.writeText(output)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Proto Beautifier</h1>
        <p className="text-muted-foreground">
          Format Protocol Buffers definitions. Optional field renumbering only affects message fields.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="startNumber">Start Number</Label>
                  <Input
                    id="startNumber"
                    type="number"
                    min="1"
                    value={options.startNumber}
                    onChange={(e) =>
                      handleOptionChange("startNumber", Math.max(1, Number(e.target.value) || 1))
                    }
                    placeholder="Start from..."
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <Label htmlFor="increment">Increment</Label>
                  <Input
                    id="increment"
                    type="number"
                    min="1"
                    value={options.increment}
                    onChange={(e) =>
                      handleOptionChange("increment", Math.max(1, Number(e.target.value) || 1))
                    }
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
                  onChange={(e) => handleOptionChange("renumberFields", e.target.checked)}
                  className="form-checkbox h-4 w-4"
                />
                <Label htmlFor="renumberFields">Renumber message fields</Label>
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
                disabled={!output}
                aria-label="Copy formatted proto"
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
                  <pre className="text-sm !bg-transparent">{output}</pre>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
