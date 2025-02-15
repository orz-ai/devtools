"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Copy } from "lucide-react"
import { SyntaxHighlighter } from "@/components/syntax-highlighter"

interface TimeResult {
    timestamp: number
    timestampMs: number
    date: string
    utc: string
}

export default function TimestampConverter() {
    const [currentTime, setCurrentTime] = useState<TimeResult>({
        timestamp: 0,
        timestampMs: 0,
        date: "",
        utc: ""
    })
    const [inputTimestamp, setInputTimestamp] = useState("")
    const [inputDate, setInputDate] = useState("")
    const [convertedTime, setConvertedTime] = useState<TimeResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    // 更新当前时间
    useEffect(() => {
        const updateCurrentTime = () => {
            const now = new Date()
            setCurrentTime({
                timestamp: Math.floor(now.getTime() / 1000),
                timestampMs: now.getTime(),
                date: now.toLocaleString(),
                utc: now.toUTCString()
            })
        }

        updateCurrentTime()
        const timer = setInterval(updateCurrentTime, 1000)
        return () => clearInterval(timer)
    }, [])

    // 时间戳转日期
    const timestampToDate = (value: string) => {
        try {
            setError(null)
            const num = parseInt(value.trim())
            if (isNaN(num)) {
                throw new Error("Invalid timestamp")
            }

            // 判断是秒还是毫秒
            const timestamp = num.toString().length > 10 ? num : num * 1000
            const date = new Date(timestamp)

            if (date.toString() === "Invalid Date") {
                throw new Error("Invalid timestamp")
            }

            setConvertedTime({
                timestamp: Math.floor(date.getTime() / 1000),
                timestampMs: date.getTime(),
                date: date.toLocaleString(),
                utc: date.toUTCString()
            })
        } catch (e) {
            setError("Invalid timestamp format")
            setConvertedTime(null)
        }
    }

    // 日期转时间戳
    const dateToTimestamp = (value: string) => {
        try {
            setError(null)
            const date = new Date(value)
            if (date.toString() === "Invalid Date") {
                throw new Error("Invalid date")
            }

            setConvertedTime({
                timestamp: Math.floor(date.getTime() / 1000),
                timestampMs: date.getTime(),
                date: date.toLocaleString(),
                utc: date.toUTCString()
            })
        } catch (e) {
            setError("Invalid date format")
            setConvertedTime(null)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Timestamp Converter</h1>
                <p className="text-muted-foreground">Convert between timestamps and human-readable dates</p>
            </div>

            {/* Current Time Section */}
            <Card className="p-4">
                <h2 className="text-lg font-semibold mb-4">Current Time</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Timestamp (s):</span>
                            <div className="flex items-center gap-2">
                                <span>{currentTime.timestamp}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => copyToClipboard(currentTime.timestamp.toString())}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Timestamp (ms):</span>
                            <div className="flex items-center gap-2">
                                <span>{currentTime.timestampMs}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => copyToClipboard(currentTime.timestampMs.toString())}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Local Time:</span>
                            <div className="flex items-center gap-2">
                                <span>{currentTime.date}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => copyToClipboard(currentTime.date)}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">UTC Time:</span>
                            <div className="flex items-center gap-2">
                                <span>{currentTime.utc}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => copyToClipboard(currentTime.utc)}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Converter Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Timestamp to Date */}
                <Card className="p-4 space-y-4">
                    <h2 className="text-lg font-semibold">Timestamp to Date</h2>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter timestamp (s or ms)..."
                            value={inputTimestamp}
                            onChange={(e) => {
                                setInputTimestamp(e.target.value)
                                timestampToDate(e.target.value)
                            }}
                        />
                    </div>
                </Card>

                {/* Date to Timestamp */}
                <Card className="p-4 space-y-4">
                    <h2 className="text-lg font-semibold">Date to Timestamp</h2>
                    <div className="flex gap-2">
                        <Input
                            type="datetime-local"
                            value={inputDate}
                            onChange={(e) => {
                                setInputDate(e.target.value)
                                dateToTimestamp(e.target.value)
                            }}
                        />
                    </div>
                </Card>
            </div>

            {/* Results Section */}
            {error ? (
                <Card className="p-4">
                    <p className="text-destructive">{error}</p>
                </Card>
            ) : convertedTime && (
                <Card className="p-4 space-y-4">
                    <h2 className="text-lg font-semibold">Conversion Result</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Timestamp (s):</span>
                                <div className="flex items-center gap-2">
                                    <span>{convertedTime.timestamp}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => copyToClipboard(convertedTime.timestamp.toString())}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Timestamp (ms):</span>
                                <div className="flex items-center gap-2">
                                    <span>{convertedTime.timestampMs}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => copyToClipboard(convertedTime.timestampMs.toString())}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Local Time:</span>
                                <div className="flex items-center gap-2">
                                    <span>{convertedTime.date}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => copyToClipboard(convertedTime.date)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">UTC Time:</span>
                                <div className="flex items-center gap-2">
                                    <span>{convertedTime.utc}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => copyToClipboard(convertedTime.utc)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    )
} 