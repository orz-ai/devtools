"use client"

import Link from "next/link"
import { Github, Mail, Heart } from "lucide-react"
import { useI18n } from "./i18n-provider"

export function Footer() {
    const { t } = useI18n()
    const currentYear = new Date().getFullYear()

    const toolLinks = [
        { key: 'jsonFormatter', href: '/tools/json-formatter' },
        { key: 'sqlFormatter', href: '/tools/sql-formatter' },
        { key: 'base64', href: '/tools/base64' },
        { key: 'idWatermark', href: '/tools/id-watermark' },
    ]

    return (
        <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* 品牌和描述 */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="bg-gradient-to-br from-primary/20 to-primary/10 w-8 h-8 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-4 h-4 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </div>
                            <span className="font-bold text-lg">{t('devToolsHub')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {t('footer.description')}
                        </p>
                    </div>

                    {/* 快速链接 */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm">{t('footer.quickLinks')}</h3>
                        <ul className="space-y-2">
                            {toolLinks.map((tool) => (
                                <li key={tool.href}>
                                    <Link
                                        href={tool.href}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {t(`tools.${tool.key}`)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 资源 */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm">{t('footer.resources')}</h3>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="https://github.com/orz-ai/devtools"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {t('footer.documentation')}
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/orz-ai/devtools/issues"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {t('footer.reportIssue')}
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/orz-ai/devtools/issues/new"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {t('footer.requestFeature')}
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* 联系方式 */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm">{t('footer.contact')}</h3>
                        <ul className="space-y-3">
                            <li>
                                <a
                                    href="mailto:admin@orz.ai"
                                    className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                                >
                                    <Mail className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                    <span>{t('footer.email')}</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/orz-ai/devtools"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                                >
                                    <Github className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                    <span>{t('footer.github')}</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>


            </div>
        </footer>
    )
}
