"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Download, Upload } from "lucide-react"
import imageCompression from 'browser-image-compression'

interface ImageInfo {
    file: File
    preview: string
    size: number
}

export default function ImageCompressor() {
    const [originalImage, setOriginalImage] = useState<ImageInfo | null>(null)
    const [compressedImage, setCompressedImage] = useState<ImageInfo | null>(null)
    const [quality, setQuality] = useState([80])
    const [isCompressing, setIsCompressing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            setOriginalImage({
                file: file,
                preview: e.target?.result as string,
                size: file.size
            })
            compressImage(file, quality[0])
        }
        reader.readAsDataURL(file)
    }

    const compressImage = async (file: File, quality: number) => {
        try {
            setIsCompressing(true)

            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                quality: quality / 100
            }

            const compressedFile = await imageCompression(file, options)
            const reader = new FileReader()

            reader.onload = (e) => {
                setCompressedImage({
                    file: compressedFile,
                    preview: e.target?.result as string,
                    size: compressedFile.size
                })
            }
            reader.readAsDataURL(compressedFile)
        } catch (error) {
            console.error('Error compressing image:', error)
            alert('Error compressing image')
        } finally {
            setIsCompressing(false)
        }
    }

    const handleQualityChange = (value: number[]) => {
        setQuality(value)
        if (originalImage) {
            compressImage(originalImage.file, value[0])
        }
    }

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const calculateReduction = () => {
        if (!originalImage || !compressedImage) return 0
        return ((originalImage.size - compressedImage.size) / originalImage.size * 100).toFixed(1)
    }

    const downloadImage = () => {
        if (!compressedImage) return
        const link = document.createElement('a')
        link.href = compressedImage.preview
        link.download = `compressed_${originalImage?.file.name}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Image Compressor</h1>
                <p className="text-muted-foreground">Compress and optimize your images</p>
            </div>

            <div className="space-y-4">
                <Card className="p-4">
                    <div className="space-y-4">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            ref={fileInputRef}
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-32 border-dashed"
                            variant="outline"
                        >
                            <div className="flex flex-col items-center space-y-2">
                                <Upload className="h-8 w-8" />
                                <span>Click or drop image here</span>
                            </div>
                        </Button>

                        {originalImage && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Quality: {quality}%</label>
                                    <Slider
                                        value={quality}
                                        onValueChange={handleQualityChange}
                                        min={1}
                                        max={100}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {originalImage && compressedImage && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4 space-y-4">
                            <h3 className="font-medium">Original Image</h3>
                            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                <img
                                    src={originalImage.preview}
                                    alt="Original"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Size: {formatSize(originalImage.size)}
                            </p>
                        </Card>

                        <Card className="p-4 space-y-4">
                            <h3 className="font-medium">Compressed Image</h3>
                            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                {isCompressing ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span>Compressing...</span>
                                    </div>
                                ) : (
                                    <img
                                        src={compressedImage.preview}
                                        alt="Compressed"
                                        className="w-full h-full object-contain"
                                    />
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Size: {formatSize(compressedImage.size)}
                                    <span className="ml-2 text-green-500">
                                        ({calculateReduction()}% reduction)
                                    </span>
                                </p>
                                <Button
                                    onClick={downloadImage}
                                    size="sm"
                                    className="ml-auto"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
} 