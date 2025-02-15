"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Copy } from "lucide-react"
import { SyntaxHighlighter } from "@/components/syntax-highlighter"

interface JwtParts {
    header: any
    payload: any
    signature: string
}

export default function JwtDecoder() {
    const [input, setInput] = useState("")
    const [decoded, setDecoded] = useState<JwtParts | null>(null)
    const [error, setError] = useState<string | null>(null)

    const decodeJwt = (token: string) => {
        if (!token.trim()) {
            setDecoded(null)
            setError(null)
            return
        }

        try {
            // 分割 JWT
            const parts = token.split('.')
            if (parts.length !== 3) {
                throw new Error("Invalid JWT format")
            }

            // 解码每个部分
            const decoded = {
                header: JSON.parse(atob(parts[0])),
                payload: JSON.parse(atob(parts[1])),
                signature: parts[2]
            }

            // 检查过期时间
            const now = Math.floor(Date.now() / 1000)
            const exp = decoded.payload.exp
            const isExpired = exp && now > exp

            if (isExpired) {
                setError(`Token expired at ${new Date(exp * 1000).toLocaleString()}`)
            } else {
                setError(null)
            }

            setDecoded(decoded)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to decode JWT")
            setDecoded(null)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        setInput(newValue)
        decodeJwt(newValue)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString()
    }

    const renderTokenPart = (title: string, data: any, originalPart: string) => (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{title}</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
                >
                    <Copy className="h-4 w-4" />
                </Button>
            </div>
            <div className="space-y-2">
                <div className="overflow-auto custom-scrollbar">
                    <SyntaxHighlighter
                        code={JSON.stringify(data, null, 2)}
                        language="json"
                        className="text-sm !bg-transparent"
                    />
                </div>
                <div className="text-xs text-muted-foreground break-all">
                    Raw: {originalPart}
                </div>
            </div>
        </Card>
    )

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">JWT Decoder</h1>
                <p className="text-muted-foreground">Decode and verify JSON Web Tokens</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
                <Card className="p-4">
                    <Textarea
                        placeholder="Paste your JWT here..."
                        className="min-h-[100px] max-h-[200px] font-mono custom-scrollbar"
                        value={input}
                        onChange={handleInputChange}
                    />
                </Card>

                {error && (
                    <Card className="p-4 border-destructive">
                        <p className="text-destructive font-medium">Error</p>
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </Card>
                )}

                {decoded && (
                    <div className="space-y-4">
                        {/* Header */}
                        {renderTokenPart("Header", decoded.header, input.split('.')[0])}

                        {/* Payload */}
                        <Card className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium">Payload</h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => copyToClipboard(JSON.stringify(decoded.payload, null, 2))}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {/* 重要的时间信息 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    {decoded.payload.exp && (
                                        <div className="p-2 bg-muted rounded">
                                            <span className="text-muted-foreground">Expires: </span>
                                            <span>{formatDate(decoded.payload.exp)}</span>
                                        </div>
                                    )}
                                    {decoded.payload.iat && (
                                        <div className="p-2 bg-muted rounded">
                                            <span className="text-muted-foreground">Issued At: </span>
                                            <span>{formatDate(decoded.payload.iat)}</span>
                                        </div>
                                    )}
                                    {decoded.payload.nbf && (
                                        <div className="p-2 bg-muted rounded">
                                            <span className="text-muted-foreground">Not Before: </span>
                                            <span>{formatDate(decoded.payload.nbf)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* 完整的 payload */}
                                <div className="overflow-auto custom-scrollbar">
                                    <SyntaxHighlighter
                                        code={JSON.stringify(decoded.payload, null, 2)}
                                        language="json"
                                        className="text-sm !bg-transparent"
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground break-all">
                                    Raw: {input.split('.')[1]}
                                </div>
                            </div>
                        </Card>

                        {/* Signature */}
                        <Card className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium">Signature</h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => copyToClipboard(decoded.signature)}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="text-sm font-mono break-all">{decoded.signature}</div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
} 