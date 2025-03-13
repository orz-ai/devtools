"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileImage, Upload, Download, Copy } from "lucide-react"

export default function Base64Tool() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const encode = () => {
    try {
      setOutput(btoa(input))
      setImagePreview(null)
    } catch (e) {
      setOutput("Error: Invalid input for Base64 encoding")
    }
  }

  const decode = () => {
    try {
      setOutput(atob(input))
      setImagePreview(null)
    } catch (e) {
      setOutput("Error: Invalid Base64 string")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (result) {
        // 提取 base64 部分 (去掉 data:image/jpeg;base64, 前缀)
        const base64Data = result.split(',')[1]
        setInput(base64Data)
        setImagePreview(result)
      }
    }
    reader.readAsDataURL(file)
  }

  const downloadImage = () => {
    if (!input) return

    try {
      // 尝试确定图片类型
      let mimeType = "image/png" // 默认类型

      // 如果有预览图，使用预览图的 MIME 类型
      if (imagePreview && imagePreview.includes('data:')) {
        const mimeMatch = imagePreview.match(/data:(.*?);base64/)
        if (mimeMatch && mimeMatch[1]) {
          mimeType = mimeMatch[1]
        }
      }

      // 创建下载链接
      const dataUrl = `data:${mimeType};base64,${input}`
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `image.${mimeType.split('/')[1] || 'png'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      setOutput("Error: Could not download image. Invalid Base64 data.")
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Base64 Encoder/Decoder</h1>
        <p className="text-muted-foreground">Convert text and images to and from Base64 format</p>
      </div>
      <Tabs defaultValue="encode" className="space-y-4">
        <TabsList>
          <TabsTrigger value="encode">Encode</TabsTrigger>
          <TabsTrigger value="decode">Decode</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
        </TabsList>
        <TabsContent value="encode" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 space-y-4">
              <Textarea
                placeholder="Enter text to encode..."
                className="min-h-[400px] font-mono"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button onClick={encode}>Encode to Base64</Button>
            </Card>
            <Card className="p-4 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 h-8 w-8"
                onClick={copyToClipboard}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <pre className="whitespace-pre-wrap font-mono min-h-[400px] text-sm">
                {output}
              </pre>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="decode" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 space-y-4">
              <Textarea
                placeholder="Enter Base64 to decode..."
                className="min-h-[400px] font-mono"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button onClick={decode}>Decode from Base64</Button>
            </Card>
            <Card className="p-4 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 h-8 w-8"
                onClick={copyToClipboard}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <pre className="whitespace-pre-wrap font-mono min-h-[400px] text-sm">
                {output}
              </pre>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="image" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 space-y-4">
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 min-h-[300px]">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-[280px] object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <FileImage className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Upload an image to convert to Base64
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    onClick={downloadImage}
                    variant="outline"
                    disabled={!input || !input.trim()}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Image
                  </Button>
                </div>
              </div>
            </Card>
            <Card className="p-4 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 h-8 w-8"
                onClick={() => navigator.clipboard.writeText(input)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Textarea
                placeholder="Base64 image data will appear here..."
                className="min-h-[400px] font-mono"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  // 尝试更新图片预览
                  try {
                    setImagePreview(`data:image/png;base64,${e.target.value}`)
                  } catch (e) {
                    setImagePreview(null)
                  }
                }}
              />
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}