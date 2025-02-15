"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface RegexFlags {
    global: boolean
    ignoreCase: boolean
    multiline: boolean
    dotAll: boolean
    unicode: boolean
    sticky: boolean
}

interface Match {
    text: string
    index: number
    length: number
    groups?: { [key: string]: string }
}

export default function RegexTester() {
    const [pattern, setPattern] = useState("")
    const [text, setText] = useState("")
    const [flags, setFlags] = useState<RegexFlags>({
        global: true,
        ignoreCase: false,
        multiline: false,
        dotAll: false,
        unicode: false,
        sticky: false
    })
    const [error, setError] = useState<string | null>(null)
    const [matches, setMatches] = useState<Match[]>([])
    const [selectedMatch, setSelectedMatch] = useState<number | null>(null)

    const getFlagsString = (flags: RegexFlags): string => {
        return Object.entries(flags)
            .filter(([_, value]) => value)
            .map(([key]) => {
                switch (key) {
                    case 'global': return 'g'
                    case 'ignoreCase': return 'i'
                    case 'multiline': return 'm'
                    case 'dotAll': return 's'
                    case 'unicode': return 'u'
                    case 'sticky': return 'y'
                    default: return ''
                }
            })
            .join('')
    }

    const testRegex = () => {
        if (!pattern.trim()) {
            setMatches([])
            setError(null)
            return
        }

        try {
            const flagsStr = getFlagsString(flags)
            const regex = new RegExp(pattern, flagsStr)
            const matches: Match[] = []

            if (flags.global) {
                let match
                while ((match = regex.exec(text)) !== null) {
                    matches.push({
                        text: match[0],
                        index: match.index,
                        length: match[0].length,
                        groups: match.groups
                    })
                    if (!match[0].length) regex.lastIndex++ // 防止零长度匹配导致的无限循环
                }
            } else {
                const match = regex.exec(text)
                if (match) {
                    matches.push({
                        text: match[0],
                        index: match.index,
                        length: match[0].length,
                        groups: match.groups
                    })
                }
            }

            setMatches(matches)
            setError(null)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Invalid regular expression")
            setMatches([])
        }
    }

    const toggleFlag = (flag: keyof RegexFlags) => {
        setFlags(prev => {
            const newFlags = { ...prev, [flag]: !prev[flag] }
            return newFlags
        })
    }

    const getHighlightedText = () => {
        if (!matches.length) return text

        let result = []
        let lastIndex = 0

        matches.forEach((match, idx) => {
            // 添加匹配前的文本
            result.push(text.slice(lastIndex, match.index))

            // 添加高亮的匹配文本
            const isSelected = idx === selectedMatch
            result.push(
                <span
                    key={match.index}
                    className={`cursor-pointer ${isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-accent'
                        }`}
                    onClick={() => setSelectedMatch(idx)}
                >
                    {match.text}
                </span>
            )

            lastIndex = match.index + match.length
        })

        // 添加最后一段文本
        result.push(text.slice(lastIndex))

        return result
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Regex Tester</h1>
                <p className="text-muted-foreground">Test and validate regular expressions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <Card className="p-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Pattern</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={pattern}
                                        onChange={(e) => {
                                            setPattern(e.target.value)
                                            testRegex()
                                        }}
                                        placeholder="/pattern/"
                                        className="font-mono"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Flags</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(flags).map(([key, value]) => (
                                        <Button
                                            key={key}
                                            variant={value ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => {
                                                toggleFlag(key as keyof RegexFlags)
                                                testRegex()
                                            }}
                                        >
                                            {key}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Test String</label>
                            <Textarea
                                value={text}
                                onChange={(e) => {
                                    setText(e.target.value)
                                    testRegex()
                                }}
                                placeholder="Enter text to test..."
                                className="min-h-[200px] font-mono custom-scrollbar"
                            />
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    {error ? (
                        <Card className="p-4">
                            <div className="space-y-2">
                                <p className="text-destructive font-medium">Error</p>
                                <p className="text-muted-foreground text-sm">{error}</p>
                            </div>
                        </Card>
                    ) : (
                        <>
                            <Card className="p-4">
                                <div className="space-y-2">
                                    <h3 className="font-medium">Matches ({matches.length})</h3>
                                    <div className="min-h-[200px] max-h-[200px] overflow-auto custom-scrollbar space-y-2">
                                        {matches.map((match, index) => (
                                            <div
                                                key={index}
                                                className={`p-2 rounded cursor-pointer ${index === selectedMatch
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted hover:bg-accent'
                                                    }`}
                                                onClick={() => setSelectedMatch(index)}
                                            >
                                                <div className="flex justify-between text-sm">
                                                    <span>Match {index + 1}</span>
                                                    <span>Index: {match.index}</span>
                                                </div>
                                                <div className="font-mono text-sm mt-1 break-all">
                                                    {match.text}
                                                </div>
                                                {match.groups && Object.keys(match.groups).length > 0 && (
                                                    <div className="mt-2 text-sm">
                                                        <div className="font-medium">Groups:</div>
                                                        {Object.entries(match.groups).map(([name, value]) => (
                                                            <div key={name} className="ml-2">
                                                                {name}: {value}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4">
                                <div className="space-y-2">
                                    <h3 className="font-medium">Preview</h3>
                                    <div className="min-h-[200px] max-h-[200px] overflow-auto custom-scrollbar p-2 bg-muted rounded font-mono text-sm whitespace-pre-wrap">
                                        {getHighlightedText()}
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
} 