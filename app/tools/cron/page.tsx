"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Copy } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface CronParts {
    minutes: string
    hours: string
    dayOfMonth: string
    month: string
    dayOfWeek: string
}

const MINUTES_PRESETS = [
    { label: "Every minute", value: "*" },
    { label: "Every 5 minutes", value: "*/5" },
    { label: "Every 10 minutes", value: "*/10" },
    { label: "Every 15 minutes", value: "*/15" },
    { label: "Every 30 minutes", value: "*/30" },
]

const HOURS_PRESETS = [
    { label: "Every hour", value: "*" },
    { label: "Every 2 hours", value: "*/2" },
    { label: "Every 3 hours", value: "*/3" },
    { label: "Every 4 hours", value: "*/4" },
    { label: "Every 6 hours", value: "*/6" },
    { label: "Every 12 hours", value: "*/12" },
]

const DAYS_PRESETS = [
    { label: "Every day", value: "*" },
    { label: "Every 2 days", value: "*/2" },
    { label: "Every week", value: "*/7" },
    { label: "First day of month", value: "1" },
    { label: "Last day of month", value: "L" },
]

const MONTHS_PRESETS = [
    { label: "Every month", value: "*" },
    { label: "Every 2 months", value: "*/2" },
    { label: "Every 3 months", value: "*/3" },
    { label: "Every 6 months", value: "*/6" },
    { label: "January", value: "1" },
    { label: "First quarter", value: "1,4,7,10" },
]

const WEEKDAYS_PRESETS = [
    { label: "Every day", value: "*" },
    { label: "Weekdays", value: "1-5" },
    { label: "Weekends", value: "0,6" },
    { label: "Monday", value: "1" },
    { label: "Friday", value: "5" },
]

const COMMON_EXPRESSIONS = [
    { label: "Every minute", expression: "* * * * *" },
    { label: "Every hour", expression: "0 * * * *" },
    { label: "Every day at midnight", expression: "0 0 * * *" },
    { label: "Every Monday at 9am", expression: "0 9 * * 1" },
    { label: "Every weekday at 9am", expression: "0 9 * * 1-5" },
    { label: "First day of month at midnight", expression: "0 0 1 * *" },
]

export default function CronGenerator() {
    const [cron, setCron] = useState<CronParts>({
        minutes: "*",
        hours: "*",
        dayOfMonth: "*",
        month: "*",
        dayOfWeek: "*"
    })
    const [nextRuns, setNextRuns] = useState<Date[]>([])
    const [cronInput, setCronInput] = useState("")
    const [error, setError] = useState<string | null>(null)

    const updateCronPart = (part: keyof CronParts, value: string) => {
        setCron(prev => {
            const newCron = { ...prev, [part]: value }
            calculateNextRuns(formatCronExpression(newCron))
            return newCron
        })
    }

    const formatCronExpression = (parts: CronParts) => {
        return `${parts.minutes} ${parts.hours} ${parts.dayOfMonth} ${parts.month} ${parts.dayOfWeek}`
    }

    const calculateNextRuns = (expression: string) => {
        try {
            const runs: Date[] = []
            let date = new Date()

            // 简单的下一次运行时间计算逻辑
            for (let i = 0; i < 5; i++) {
                date = getNextRunTime(expression, date)
                runs.push(new Date(date))
                date.setMinutes(date.getMinutes() + 1)
            }

            setNextRuns(runs)
        } catch (e) {
            setNextRuns([])
        }
    }

    const getNextRunTime = (expression: string, fromDate: Date): Date => {
        // 这里是一个简化的实现，实际应用中应该使用更复杂的逻辑
        const parts = expression.split(' ')
        const date = new Date(fromDate)

        if (parts[0] !== '*') date.setMinutes(parseInt(parts[0]))
        if (parts[1] !== '*') date.setHours(parseInt(parts[1]))
        if (parts[2] !== '*') date.setDate(parseInt(parts[2]))
        if (parts[3] !== '*') date.setMonth(parseInt(parts[3]) - 1)

        return date
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(formatCronExpression(cron))
    }

    const applyCommonExpression = (expression: string) => {
        const parts = expression.split(' ')
        setCron({
            minutes: parts[0],
            hours: parts[1],
            dayOfMonth: parts[2],
            month: parts[3],
            dayOfWeek: parts[4]
        })
        calculateNextRuns(expression)
    }

    const parseCronExpression = (expression: string) => {
        try {
            const parts = expression.trim().split(/\s+/)
            if (parts.length !== 5) {
                throw new Error("Invalid cron expression format")
            }

            const [minutes, hours, dayOfMonth, month, dayOfWeek] = parts

            // 验证每个部分的格式
            const validatePart = (part: string, min: number, max: number) => {
                if (part === '*') return true
                if (part.includes('/')) {
                    const [, step] = part.split('/')
                    return !isNaN(Number(step))
                }
                if (part.includes('-')) {
                    const [start, end] = part.split('-').map(Number)
                    return !isNaN(start) && !isNaN(end) && start >= min && end <= max
                }
                if (part.includes(',')) {
                    return part.split(',').every(n => !isNaN(Number(n)))
                }
                return !isNaN(Number(part))
            }

            // 验证每个部分
            if (!validatePart(minutes, 0, 59) ||
                !validatePart(hours, 0, 23) ||
                !validatePart(dayOfMonth, 1, 31) ||
                !validatePart(month, 1, 12) ||
                !validatePart(dayOfWeek, 0, 6)) {
                throw new Error("Invalid values in cron expression")
            }

            // 更新选择器
            setCron({
                minutes,
                hours,
                dayOfMonth,
                month,
                dayOfWeek
            })

            // 计算下次运行时间
            calculateNextRuns(expression)

            return true
        } catch (e) {
            setError(e instanceof Error ? e.message : "Invalid cron expression")
            return false
        }
    }

    const handleCronInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setCronInput(value)
        if (value.trim()) {
            parseCronExpression(value)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Cron Expression Generator</h1>
                <p className="text-muted-foreground">Generate and validate cron expressions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {/* 添加 Cron 表达式输入框 */}
                    <Card className="p-4">
                        <h2 className="text-lg font-semibold mb-4">Parse Cron Expression</h2>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter cron expression (e.g. * * * * *)"
                                value={cronInput}
                                onChange={handleCronInputChange}
                                className="font-mono"
                            />
                        </div>
                        {error && (
                            <p className="text-destructive text-sm mt-2">{error}</p>
                        )}
                    </Card>

                    {/* Common Expressions */}
                    <Card className="p-4">
                        <h2 className="text-lg font-semibold mb-4">Common Patterns</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {COMMON_EXPRESSIONS.map(({ label, expression }) => (
                                <Button
                                    key={expression}
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() => {
                                        setCronInput(expression)
                                        applyCommonExpression(expression)
                                    }}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                    </Card>

                    {/* Expression Builder */}
                    <Card className="p-4 space-y-4">
                        <h2 className="text-lg font-semibold">Expression Builder</h2>

                        {/* Minutes */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Minutes</label>
                            <Select value={cron.minutes} onValueChange={v => updateCronPart('minutes', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MINUTES_PRESETS.map(preset => (
                                        <SelectItem key={preset.value} value={preset.value}>
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Hours */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Hours</label>
                            <Select value={cron.hours} onValueChange={v => updateCronPart('hours', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {HOURS_PRESETS.map(preset => (
                                        <SelectItem key={preset.value} value={preset.value}>
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Day of Month */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Day of Month</label>
                            <Select value={cron.dayOfMonth} onValueChange={v => updateCronPart('dayOfMonth', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DAYS_PRESETS.map(preset => (
                                        <SelectItem key={preset.value} value={preset.value}>
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Month */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Month</label>
                            <Select value={cron.month} onValueChange={v => updateCronPart('month', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTHS_PRESETS.map(preset => (
                                        <SelectItem key={preset.value} value={preset.value}>
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Day of Week */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Day of Week</label>
                            <Select value={cron.dayOfWeek} onValueChange={v => updateCronPart('dayOfWeek', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {WEEKDAYS_PRESETS.map(preset => (
                                        <SelectItem key={preset.value} value={preset.value}>
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </Card>
                </div>

                {/* Result */}
                <div className="space-y-6">
                    <Card className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Generated Expression</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={copyToClipboard}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="font-mono text-lg bg-muted p-4 rounded-md">
                            {formatCronExpression(cron)}
                        </div>
                    </Card>

                    <Card className="p-4">
                        <h2 className="text-lg font-semibold mb-4">Next Runs</h2>
                        <div className="space-y-2">
                            {nextRuns.map((date, index) => (
                                <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                                    <span className="text-muted-foreground">Run {index + 1}:</span>
                                    <span>{date.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
} 