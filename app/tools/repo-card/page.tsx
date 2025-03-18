"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Download, Github, GitBranch, Star, Eye, GitFork, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import html2canvas from "html2canvas"
import domtoimage from 'dom-to-image-more'

interface RepoInfo {
    name: string
    owner: string
    description: string
    stars: number
    forks: number
    watchers: number
    language: string
    languageColor: string
    avatar: string
    url: string
    platform: "github" | "gitlab" | "gitee"
}

const LANGUAGE_COLORS: Record<string, string> = {
    "JavaScript": "#f1e05a",
    "TypeScript": "#3178c6",
    "Python": "#3572A5",
    "Java": "#b07219",
    "Go": "#00ADD8",
    "C++": "#f34b7d",
    "C#": "#178600",
    "PHP": "#4F5D95",
    "Ruby": "#701516",
    "Swift": "#F05138",
    "Kotlin": "#A97BFF",
    "Rust": "#dea584",
    "Dart": "#00B4AB",
    "HTML": "#e34c26",
    "CSS": "#563d7c",
    "Shell": "#89e051",
    "Vue": "#41b883",
    "React": "#61dafb",
    "Angular": "#dd0031",
    "Other": "#ededed"
}

const THEMES = {
    light: {
        bg: "bg-white",
        text: "text-gray-800",
        border: "border-gray-200",
        secondaryText: "text-gray-500",
        accent: "bg-blue-500 text-white"
    },
    dark: {
        bg: "bg-gray-900",
        text: "text-gray-100",
        border: "border-gray-700",
        secondaryText: "text-gray-400",
        accent: "bg-blue-600 text-white"
    },
    github: {
        bg: "bg-white",
        text: "text-gray-900",
        border: "border-gray-200",
        secondaryText: "text-gray-600",
        accent: "bg-gray-100 text-gray-800"
    },
    gitlab: {
        bg: "bg-white",
        text: "text-gray-900",
        border: "border-orange-200",
        secondaryText: "text-gray-600",
        accent: "bg-orange-500 text-white"
    },
    gitee: {
        bg: "bg-white",
        text: "text-gray-900",
        border: "border-red-200",
        secondaryText: "text-gray-600",
        accent: "bg-red-500 text-white"
    }
}

export default function RepoCardGenerator() {
    const [repoUrl, setRepoUrl] = useState("")
    const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [theme, setTheme] = useState<keyof typeof THEMES>("light")
    const [language, setLanguage] = useState("JavaScript")
    const cardRef = useRef<HTMLDivElement>(null)
    const [isCapturing, setIsCapturing] = useState(false)

    const parseRepoUrl = (url: string): { platform: "github" | "gitlab" | "gitee", owner: string, repo: string } | null => {
        try {
            const urlObj = new URL(url)
            let platform: "github" | "gitlab" | "gitee"

            if (urlObj.hostname === "github.com" || urlObj.hostname.includes("github")) {
                platform = "github"
            } else if (urlObj.hostname === "gitlab.com" || urlObj.hostname.includes("gitlab")) {
                platform = "gitlab"
            } else if (urlObj.hostname === "gitee.com" || urlObj.hostname.includes("gitee")) {
                platform = "gitee"
            } else {
                return null
            }

            const parts = urlObj.pathname.split("/").filter(Boolean)
            if (parts.length < 2) return null

            return {
                platform,
                owner: parts[0],
                repo: parts[1]
            }
        } catch (e) {
            // Try simple format like "owner/repo"
            const parts = url.split("/").filter(Boolean)
            if (parts.length === 2) {
                return {
                    platform: "github", // Default to GitHub
                    owner: parts[0],
                    repo: parts[1]
                }
            }
            return null
        }
    }

    const fetchRepoInfo = async () => {
        setError(null)
        setLoading(true)

        const parsed = parseRepoUrl(repoUrl)
        if (!parsed) {
            setError("Invalid repository URL. Please enter a valid GitHub, GitLab, or Gitee repository URL.")
            setLoading(false)
            return
        }

        try {
            if (parsed.platform === "github") {
                // Fetch from GitHub API
                const response = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`)

                if (!response.ok) {
                    throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`)
                }

                const data = await response.json()

                // Fetch language data
                const languagesResponse = await fetch(data.languages_url)
                const languagesData = await languagesResponse.json()

                // Determine primary language
                let primaryLanguage = data.language || "Other"

                // Fetch owner avatar
                const ownerResponse = await fetch(`https://api.github.com/users/${parsed.owner}`)
                const ownerData = await ownerResponse.json()

                const repoInfo: RepoInfo = {
                    name: data.name,
                    owner: data.owner.login,
                    description: data.description || "No description provided",
                    stars: data.stargazers_count,
                    forks: data.forks_count,
                    watchers: data.subscribers_count,
                    language: primaryLanguage,
                    languageColor: LANGUAGE_COLORS[primaryLanguage] || LANGUAGE_COLORS.Other,
                    avatar: ownerData.avatar_url,
                    url: data.html_url,
                    platform: "github"
                }

                setRepoInfo(repoInfo)
            } else if (parsed.platform === "gitlab") {
                // For GitLab, we would use their API
                // This is a simplified example
                const response = await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(`${parsed.owner}/${parsed.repo}`)}`)

                if (!response.ok) {
                    throw new Error(`GitLab API returned ${response.status}: ${response.statusText}`)
                }

                const data = await response.json()

                const repoInfo: RepoInfo = {
                    name: data.name,
                    owner: parsed.owner,
                    description: data.description || "No description provided",
                    stars: data.star_count,
                    forks: data.forks_count,
                    watchers: data.star_count, // GitLab doesn't have watchers
                    language: data.repository_language || "Other",
                    languageColor: LANGUAGE_COLORS[data.repository_language] || LANGUAGE_COLORS.Other,
                    avatar: data.avatar_url || `https://gitlab.com/${parsed.owner}.png`,
                    url: data.web_url,
                    platform: "gitlab"
                }

                setRepoInfo(repoInfo)
            } else {
                // For Gitee, we would use their API
                // Since Gitee API requires authentication, we'll use mock data for this example
                const mockRepoInfo: RepoInfo = {
                    name: parsed.repo,
                    owner: parsed.owner,
                    description: "Repository information from Gitee (mock data)",
                    stars: 123,
                    forks: 45,
                    watchers: 67,
                    language: "JavaScript",
                    languageColor: LANGUAGE_COLORS["JavaScript"],
                    avatar: `https://gitee.com/assets/favicon.ico`,
                    url: `https://gitee.com/${parsed.owner}/${parsed.repo}`,
                    platform: "gitee"
                }

                setRepoInfo(mockRepoInfo)
            }
        } catch (e) {
            console.error("Error fetching repo info:", e)
            setError(`Failed to fetch repository information: ${e instanceof Error ? e.message : "Unknown error"}`)
        } finally {
            setLoading(false)
        }
    }

    const downloadCard = async () => {
        if (!cardRef.current) return

        try {
            setIsCapturing(true)

            // 给浏览器一点时间来应用截图样式
            setTimeout(async () => {
                try {
                    const canvas = await html2canvas(cardRef.current, {
                        scale: 2,
                        backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff"
                    })

                    const link = document.createElement("a")
                    link.download = `${repoInfo?.owner}-${repoInfo?.name}-card.png`
                    link.href = canvas.toDataURL("image/png")
                    link.click()
                } catch (e) {
                    console.error("Failed to download card:", e)
                    setError(`Failed to download image: ${e instanceof Error ? e.message : "Unknown error"}`)
                } finally {
                    setIsCapturing(false)
                }
            }, 100)
        } catch (e) {
            console.error("Failed to download card:", e)
            setError(`Failed to download image: ${e instanceof Error ? e.message : "Unknown error"}`)
            setIsCapturing(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Repository Card Generator</h1>
                <p className="text-muted-foreground">Generate beautiful cards for GitHub, GitLab, or Gitee repositories</p>
            </div>

            <Card className="p-4">
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Label htmlFor="repo-url">Repository URL</Label>
                            <div className="flex mt-1.5">
                                <Input
                                    id="repo-url"
                                    placeholder="https://github.com/username/repo or username/repo"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={fetchRepoInfo}
                                    disabled={loading}
                                    className="ml-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Loading
                                        </>
                                    ) : (
                                        "Generate"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="theme">Theme</Label>
                            <Select value={theme} onValueChange={(value) => setTheme(value as keyof typeof THEMES)}>
                                <SelectTrigger id="theme" className="mt-1.5">
                                    <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="github">GitHub</SelectItem>
                                    <SelectItem value="gitlab">GitLab</SelectItem>
                                    <SelectItem value="gitee">Gitee</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="language">Primary Language</Label>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger id="language" className="mt-1.5">
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(LANGUAGE_COLORS).map(lang => (
                                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            {repoInfo && (
                                <Button
                                    onClick={downloadCard}
                                    className="w-full"
                                    variant="outline"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download as Image
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-md">
                    {error}
                </div>
            )}

            {repoInfo && (
                <div className="flex justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <div
                        ref={cardRef}
                        className={`w-full max-w-2xl rounded-lg overflow-hidden border shadow-lg ${THEMES[theme].bg} ${THEMES[theme].border} ${isCapturing ? 'screenshot-mode' : ''}`}
                        style={{
                            maxWidth: "600px",
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                            WebkitFontSmoothing: "antialiased",
                            MozOsxFontSmoothing: "grayscale"
                        }}
                    >
                        <div className="p-6">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mr-4">
                                    <img
                                        src={repoInfo.avatar}
                                        alt={`${repoInfo.owner}'s avatar`}
                                        className="w-12 h-12 rounded-full"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center">
                                        {repoInfo.platform === "github" && <Github className={`h-5 w-5 mr-2 ${THEMES[theme].secondaryText}`} />}
                                        {repoInfo.platform === "gitlab" && <span className={`h-5 w-5 mr-2 ${THEMES[theme].secondaryText}`}>🦊</span>}
                                        {repoInfo.platform === "gitee" && <span className={`h-5 w-5 mr-2 ${THEMES[theme].secondaryText}`}>🔱</span>}
                                        <h2 className={`text-xl font-bold ${THEMES[theme].text}`}>
                                            <a href={repoInfo.url} target="_blank" rel="noopener noreferrer">
                                                {repoInfo.owner}/{repoInfo.name}
                                            </a>
                                        </h2>
                                    </div>
                                    <p className={`mt-2 ${THEMES[theme].secondaryText}`}>
                                        {repoInfo.description}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap items-center gap-4">
                                <div className="flex items-center">
                                    <div
                                        className="w-3 h-3 rounded-full mr-2"
                                        style={{ backgroundColor: repoInfo.languageColor }}
                                    ></div>
                                    <span className={THEMES[theme].secondaryText}>{repoInfo.language}</span>
                                </div>

                                <div className="flex items-center">
                                    <Star className={`h-4 w-4 mr-1 ${THEMES[theme].secondaryText}`} />
                                    <span className={THEMES[theme].secondaryText}>{repoInfo.stars.toLocaleString()}</span>
                                </div>

                                <div className="flex items-center">
                                    <GitFork className={`h-4 w-4 mr-1 ${THEMES[theme].secondaryText}`} />
                                    <span className={THEMES[theme].secondaryText}>{repoInfo.forks.toLocaleString()}</span>
                                </div>

                                <div className="flex items-center">
                                    <Eye className={`h-4 w-4 mr-1 ${THEMES[theme].secondaryText}`} />
                                    <span className={THEMES[theme].secondaryText}>{repoInfo.watchers.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <a
                                    href={repoInfo.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${THEMES[theme].accent}`}
                                >
                                    <GitBranch className="mr-2 h-4 w-4" />
                                    View Repository
                                </a>
                            </div>
                        </div>

                        <div className={`px-6 py-3 text-xs ${THEMES[theme].secondaryText} border-t ${THEMES[theme].border}`}>
                            Generated with Repository Card Generator
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
} 