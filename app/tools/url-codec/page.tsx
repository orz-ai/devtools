"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function UrlCodec() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")

  const encode = () => {
    try {
      setOutput(encodeURIComponent(input))
    } catch (e) {
      setOutput("Error encoding URL")
    }
  }

  const decode = () => {
    try {
      setOutput(decodeURIComponent(input))
    } catch (e) {
      setOutput("Error decoding URL")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">URL Encoder/Decoder</h1>
        <p className="text-muted-foreground">Encode and decode URLs</p>
      </div>
      <Tabs defaultValue="encode" className="space-y-4">
        <TabsList>
          <TabsTrigger value="encode">Encode</TabsTrigger>
          <TabsTrigger value="decode">Decode</TabsTrigger>
        </TabsList>
        <TabsContent value="encode" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 space-y-4">
              <Textarea
                placeholder="Enter URL to encode..."
                className="min-h-[400px] font-mono"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button onClick={encode}>Encode URL</Button>
            </Card>
            <Card className="p-4">
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
                placeholder="Enter encoded URL to decode..."
                className="min-h-[400px] font-mono"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button onClick={decode}>Decode URL</Button>
            </Card>
            <Card className="p-4">
              <pre className="whitespace-pre-wrap font-mono min-h-[400px] text-sm">
                {output}
              </pre>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}