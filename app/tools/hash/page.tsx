"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Copy } from "lucide-react"
import { SyntaxHighlighter } from "@/components/syntax-highlighter"
import crypto from 'crypto'

interface HashResult {
    md5: string
    sha1: string
    sha256: string
    sha512: string
}

export default function HashGenerator() {
    const [input, setInput] = useState("")
    const [output, setOutput] = useState<HashResult>({
        md5: "",
        sha1: "",
        sha256: "",
        sha512: ""
    })

    const generateHashes = (value: string) => {
        if (!value.trim()) {
            setOutput({
                md5: "",
                sha1: "",
                sha256: "",
                sha512: ""
            })
            return
        }

        const hashes = {
            md5: crypto.createHash('md5').update(value).digest('hex'),
            sha1: crypto.createHash('sha1').update(value).digest('hex'),
            sha256: crypto.createHash('sha256').update(value).digest('hex'),
            sha512: crypto.createHash('sha512').update(value).digest('hex')
        }

        setOutput(hashes)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        setInput(newValue)
        generateHashes(newValue)
    }

    const copyToClipboard = (hash: string) => {
        navigator.clipboard.writeText(hash)
    }

    const formatHashOutput = () => {
        return Object.entries(output)
            .map(([type, hash]) => `${type.toUpperCase()}: ${hash}`)
            .join('\n')
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Hash Generator</h1>
                <p className="text-muted-foreground">Generate various hash formats (MD5, SHA-1, SHA-256, SHA-512)</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                    <Textarea
                        placeholder="Enter text to hash..."
                        className="min-h-[700px] max-h-[700px] font-mono custom-scrollbar"
                        value={input}
                        onChange={handleInputChange}
                    />
                </Card>
                <div className="space-y-4">
                    {Object.entries(output).map(([type, hash]) => (
                        <Card key={type} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium capitalize">{type.toUpperCase()}</h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => copyToClipboard(hash)}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="overflow-auto custom-scrollbar">
                                <SyntaxHighlighter
                                    code={hash || "Hash will appear here..."}
                                    language="plaintext"
                                    className="text-sm !bg-transparent"
                                />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
