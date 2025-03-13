"use client"

import { useState, useRef, useEffect } from "react"
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!originalImage) return

            if (e.key === 'ArrowLeft') {
                e.preventDefault()
                setQuality(prev => {
                    const newValue = Math.max(1, prev[0] - 1)
                    return [newValue]
                })
            } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                setQuality(prev => {
                    const newValue = Math.min(100, prev[0] + 1)
                    return [newValue]
                })
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [originalImage])

    useEffect(() => {
        if (originalImage && quality[0]) {
            if (quality[0] === 100) {
                setCompressedImage({
                    file: originalImage.file,
                    preview: originalImage.preview,
                    size: originalImage.size
                })
            } else {
                compressImage(originalImage.file, quality[0])
            }
        }
    }, [quality, originalImage])

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            const imageInfo = {
                file: file,
                preview: e.target?.result as string,
                size: file.size
            }
            setOriginalImage(imageInfo)
            setCompressedImage(imageInfo)
            setQuality([80])
        }
        reader.readAsDataURL(file)
    }

    const compressImage = async (file: File, qualityValue: number) => {
        try {
            setIsCompressing(true)

            if (qualityValue === 100) {
                setCompressedImage(originalImage)
                setIsCompressing(false)
                return
            }

            const options = {
                maxSizeMB: file.size / (1024 * 1024),
                maxWidthOrHeight: 4096,
                useWebWorker: true,
                quality: qualityValue / 100,
                initialQuality: qualityValue / 100,
            }

            const compressedFile = await imageCompression(file, options)
            const reader = new FileReader()

            reader.onload = (e) => {
                setCompressedImage({
                    file: compressedFile,
                    preview: e.target?.result as string,
                    size: compressedFile.size
                })
                setIsCompressing(false)
            }
            reader.readAsDataURL(compressedFile)
        } catch (error) {
            console.error('Error compressing image:', error)
            alert('Error compressing image')
            setIsCompressing(false)
        }
    }

    const handleQualityChange = (value: number[]) => {
        setQuality(value)
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
                <p className="text-muted-foreground">
                    Compress and optimize your images. Use arrow keys to fine-tune quality.
                </p>
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
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">
                                            Quality: {quality[0]}%
                                        </label>
                                        <span className="text-xs text-muted-foreground">
                                            Use ← → keys to adjust
                                        </span>
                                    </div>
                                    <Slider
                                        value={quality}
                                        onValueChange={handleQualityChange}
                                        min={1}
                                        max={100}
                                        step={1}
                                        className="w-full"
                                        disabled={isCompressing}
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