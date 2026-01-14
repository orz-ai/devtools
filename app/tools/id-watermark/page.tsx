"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Download, Upload, ImageIcon } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"

interface ImageInfo {
    file: File
    preview: string
    width: number
    height: number
}

export default function IDWatermark() {
    const { t, locale } = useI18n()
    const [originalImage, setOriginalImage] = useState<ImageInfo | null>(null)
    const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null)
    const [watermarkText, setWatermarkText] = useState(locale === 'zh' ? "仅供XXX使用" : "For XXX Use Only")
    const [fontSize, setFontSize] = useState([40])
    const [opacity, setOpacity] = useState([30])
    const [angle, setAngle] = useState([330])
    const [spacing, setSpacing] = useState([200])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert(t('idWatermark.alertSelectImage'))
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const imageInfo: ImageInfo = {
                    file: file,
                    preview: e.target?.result as string,
                    width: img.width,
                    height: img.height
                }
                setOriginalImage(imageInfo)
                generateWatermark(imageInfo)
            }
            img.src = e.target?.result as string
        }
        reader.readAsDataURL(file)
    }

    const generateWatermark = (imageInfo: ImageInfo = originalImage!) => {
        if (!imageInfo) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const img = new Image()
        img.onload = () => {
            // 设置画布尺寸
            canvas.width = imageInfo.width
            canvas.height = imageInfo.height

            // 绘制原图
            ctx.drawImage(img, 0, 0)

            // 设置水印样式
            ctx.fillStyle = `rgba(0, 0, 0, ${opacity[0] / 100})`
            ctx.font = `bold ${fontSize[0]}px Arial, sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'

            // 保存当前状态
            ctx.save()

            // 计算水印的行列数
            const textWidth = ctx.measureText(watermarkText).width
            const spacingValue = spacing[0]
            const angleRad = (angle[0] * Math.PI) / 180

            // 计算需要覆盖的范围（考虑旋转后的边界）
            const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2)
            const cols = Math.ceil(diagonal / spacingValue) + 2
            const rows = Math.ceil(diagonal / spacingValue) + 2

            // 从中心开始，向四周绘制水印
            const centerX = canvas.width / 2
            const centerY = canvas.height / 2

            for (let row = -rows; row <= rows; row++) {
                for (let col = -cols; col <= cols; col++) {
                    const x = centerX + col * spacingValue
                    const y = centerY + row * spacingValue

                    ctx.save()
                    ctx.translate(x, y)
                    ctx.rotate(angleRad)
                    ctx.fillText(watermarkText, 0, 0)
                    ctx.restore()
                }
            }

            ctx.restore()

            // 输出结果
            const watermarked = canvas.toDataURL('image/png', 1.0)
            setWatermarkedImage(watermarked)
        }
        img.src = imageInfo.preview
    }

    const handleDownload = () => {
        if (!watermarkedImage) return

        const link = document.createElement('a')
        link.href = watermarkedImage
        link.download = `watermarked_${originalImage?.file.name || 'image.png'}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleReset = () => {
        setOriginalImage(null)
        setWatermarkedImage(null)
        setWatermarkText(locale === 'zh' ? "仅供XXX使用" : "For XXX Use Only")
        setFontSize([40])
        setOpacity([30])
        setAngle([330])
        setSpacing([200])
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // 当参数变化时重新生成水印
    const handleParameterChange = () => {
        if (originalImage) {
            generateWatermark(originalImage)
        }
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">{t('idWatermark.title')}</h1>
                <p className="text-muted-foreground">
                    {t('idWatermark.subtitle')}
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* 左侧：控制面板 */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">设置</h2>

                    {/* 文件上传 */}
                    <div className="space-y-4 mb-6">
                        <div>
                            <Label htmlFor="file">选择图片</Label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    id="file"
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        {/* 水印文本 */}
                        <div>
                            <Label htmlFor="text">{t('idWatermark.watermarkText')}</Label>
                            <Input
                                id="text"
                                type="text"
                                value={watermarkText}
                                onChange={(e) => {
                                    setWatermarkText(e.target.value)
                                    setTimeout(handleParameterChange, 100)
                                }}
                                placeholder={t('idWatermark.watermarkPlaceholder')}
                                className="mt-2"
                            />
                        </div>

                        {/* 字体大小 */}
                        <div>
                            <Label>{t('idWatermark.fontSize')}: {fontSize[0]}px</Label>
                            <Slider
                                value={fontSize}
                                onValueChange={(value) => {
                                    setFontSize(value)
                                }}
                                onValueCommit={handleParameterChange}
                                min={20}
                                max={100}
                                step={1}
                                className="mt-2"
                            />
                        </div>

                        {/* 透明度 */}
                        <div>
                            <Label>{t('idWatermark.opacity')}: {opacity[0]}%</Label>
                            <Slider
                                value={opacity}
                                onValueChange={(value) => {
                                    setOpacity(value)
                                }}
                                onValueCommit={handleParameterChange}
                                min={10}
                                max={80}
                                step={5}
                                className="mt-2"
                            />
                        </div>

                        {/* 旋转角度 */}
                        <div>
                            <Label>{t('idWatermark.angle')}: {angle[0]}°</Label>
                            <Slider
                                value={angle}
                                onValueChange={(value) => {
                                    setAngle(value)
                                }}
                                onValueCommit={handleParameterChange}
                                min={0}
                                max={360}
                                step={15}
                                className="mt-2"
                            />
                        </div>

                        {/* 水印间距 */}
                        <div>
                            <Label>{t('idWatermark.spacing')}: {spacing[0]}px</Label>
                            <Slider
                                value={spacing}
                                onValueChange={(value) => {
                                    setSpacing(value)
                                }}
                                onValueCommit={handleParameterChange}
                                min={100}
                                max={400}
                                step={20}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="flex-1"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {t('idWatermark.upload')}
                        </Button>
                        <Button
                            onClick={handleDownload}
                            disabled={!watermarkedImage}
                            className="flex-1"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            {t('idWatermark.download')}
                        </Button>
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            disabled={!originalImage}
                        >
                            {t('idWatermark.reset')}
                        </Button>
                    </div>
                </Card>

                {/* 右侧：预览区域 */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">{t('idWatermark.preview')}</h2>

                    {!originalImage ? (
                        <div className="flex flex-col items-center justify-center h-[600px] border-2 border-dashed rounded-lg">
                            <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-center">
                                {t('idWatermark.dropzoneText')}<br />
                                {t('idWatermark.dropzoneSubtext')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
                                {watermarkedImage && (
                                    <img
                                        src={watermarkedImage}
                                        alt="带水印的图片"
                                        className="w-full h-auto"
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* 隐藏的canvas用于生成水印 */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* 使用说明 */}
            <Card className="p-6 mt-6">
                <h2 className="text-xl font-semibold mb-4">{t('idWatermark.instructions')}</h2>
                <div className="space-y-2 text-sm text-muted-foreground">
                    <p>{t('idWatermark.instruction1')}</p>
                    <p>{t('idWatermark.instruction2')}</p>
                    <p>{t('idWatermark.instruction3')}</p>
                    <p>{t('idWatermark.instruction4')}</p>
                    <p>{t('idWatermark.instruction5')}</p>
                    <p>{t('idWatermark.instruction6')}</p>
                </div>
            </Card>
        </div>
    )
}
