"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Wrench, Code2, Database, Lock, Search, FileJson, Hash, Binary, FileCode2, Regex, Terminal, Braces, TicketCheck } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

const tools = [
  {
    name: "JSON Formatter",
    description: "Format and validate JSON data with syntax highlighting",
    icon: Braces,
    href: "/tools/json-formatter",
    category: "Data Format",
  },
  {
    name: "Code Generator",
    description: "Generate code from everything",
    icon: FileCode2,
    href: "/tools/code",
    category: "Code",
  },
  {
    name: "SQL Formatter",
    description: "Format SQL queries for better readability",
    icon: Database,
    href: "/tools/sql-formatter",
    category: "Data Format",
  },
  {
    name: "Timestamp Converter",
    description: "Convert timestamps to human-readable formats",
    icon: Hash,
    href: "/tools/timestamp",
    category: "Date & Time",
  },
  {
    name: "Base64 Encoder/Decoder",
    description: "Encode and decode Base64 strings",
    icon: Binary,
    href: "/tools/base64",
    category: "Encoding",
  },
  {
    name: "URL Encoder/Decoder",
    description: "Encode and decode URLs",
    icon: Lock,
    href: "/tools/url-codec",
    category: "Encoding",
  },
  {
    name: "JWT Decoder",
    description: "Decode and verify JSON Web Tokens",
    icon: FileJson,
    href: "/tools/jwt",
    category: "Security",
  },
  {
    name: "Hash Generator",
    description: "Generate various hash formats (MD5, SHA-1, SHA-256)",
    icon: Hash,
    href: "/tools/hash",
    category: "Security",
  },
  {
    name: "Code Beautifier",
    description: "Beautify and format various programming languages",
    icon: FileCode2,
    href: "/tools/code-beautifier",
    category: "Code",
  },
  {
    name: "Regex Tester",
    description: "Test and validate regular expressions",
    icon: Regex,
    href: "/tools/regex",
    category: "Code",
  },
  {
    name: "Cron Expression Generator",
    description: "Generate and validate cron expressions",
    icon: Terminal,
    href: "/tools/cron",
    category: "DevOps",
  },
  {
    name: "Proto Beautifier",
    description: "Beautify Protocol Buffers and Renumber the fields",
    icon: TicketCheck,
    href: "/tools/proto",
    category: "DevOps",
  },
  {
    name: "Image Compressor",
    description: "Compress images to reduce file size",
    icon: TicketCheck,
    href: "/tools/image-compressor",
    category: "Image",
  },
  {
    name: "Git Repo Card",
    description: "Make a git repo card",
    icon: TicketCheck,
    href: "/tools/repo-card",
    category: "Image",
  },

]

const ITEMS_PER_PAGE = 9

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = Array.from(new Set(tools.map(tool => tool.category)))

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || tool.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.ceil(filteredTools.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedTools = filteredTools.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen space-y-8 py-8">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 blur-3xl" />
          <h1 className="text-5xl font-bold bg-gradient-to-br from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Developer Tools Hub
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-4">
            A comprehensive collection of essential tools for developers. Format, encode, decode, and validate with ease.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6 px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tools..."
            className="pl-10 h-12 text-lg"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedCategory(null)
              setCurrentPage(1)
            }}
            className="rounded-full"
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedCategory(category)
                setCurrentPage(1)
              }}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4"
      >
        {paginatedTools.map((tool) => {
          const Icon = tool.icon
          return (
            <motion.div key={tool.href} variants={item}>
              <Link href={tool.href}>
                <Card className="group p-6 hover:bg-muted/50 transition-all hover:scale-[1.02] cursor-pointer border hover:border-primary/20">
                  <div className="space-y-4">
                    <div className="bg-primary/5 w-12 h-12 rounded-xl flex items-center justify-center transition-colors group-hover:bg-primary/10">
                      <Icon className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="font-semibold text-xl">{tool.name}</h2>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className="px-3 py-1 rounded-full bg-primary/5 text-primary/80 font-medium">
                        {tool.category}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="rounded-full px-4"
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className="rounded-full w-8 h-8 p-0"
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="rounded-full px-4"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
