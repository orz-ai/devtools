export type Locale = 'zh' | 'en'

export const translations = {
    zh: {
        // Navigation
        devToolsHub: 'DevTools Hub',

        // Tool names
        tools: {
            jsonFormatter: 'JSON 格式化',
            sqlFormatter: 'SQL 格式化',
            base64: 'Base64 编码/解码',
            urlCodec: 'URL 编码/解码',
            idWatermark: '身份证水印',
            codeGenerator: '代码生成器',
            timestamp: '时间戳转换',
            jwt: 'JWT 解码',
            hash: '哈希生成器',
            codeBeautifier: '代码美化',
            regex: '正则测试',
            cron: 'Cron 表达式',
            proto: 'Proto 美化',
            imageCompressor: '图片压缩',
            repoCard: '仓库卡片',
        },

        // Home page
        home: {
            title: '开发工具集合',
            subtitle: '一站式开发工具平台，提供各种实用的开发工具',
            searchPlaceholder: '搜索工具...',
            allTools: '全部工具',
            categories: {
                all: '全部',
                dataFormat: '数据格式',
                code: '代码',
                dateTime: '日期时间',
                encoding: '编码',
                security: '安全',
                devops: 'DevOps',
                image: '图片',
            }
        },

        // Tool descriptions
        descriptions: {
            jsonFormatter: '格式化和验证 JSON 数据，支持语法高亮',
            codeGenerator: '从任何内容生成代码',
            sqlFormatter: '格式化 SQL 查询语句，提高可读性',
            timestamp: '时间戳转换为人类可读格式',
            base64: '编码和解码 Base64 字符串',
            urlCodec: '编码和解码 URL',
            jwt: '解码和验证 JSON Web Tokens',
            hash: '生成各种哈希格式（MD5, SHA-1, SHA-256）',
            codeBeautifier: '美化和格式化各种编程语言',
            regex: '测试和验证正则表达式',
            cron: '生成和验证 Cron 表达式',
            proto: '美化 Protocol Buffers 并重新编号字段',
            imageCompressor: '压缩图片以减小文件大小',
            repoCard: '生成 GitHub 仓库卡片',
            idWatermark: '为身份证图片添加斜向重复水印，保护隐私安全',
        },

        // ID Watermark tool
        idWatermark: {
            title: '身份证水印工具',
            subtitle: '为身份证图片添加斜向重复水印，保护隐私安全',
            settings: '设置',
            preview: '预览',
            selectImage: '选择图片',
            watermarkText: '水印文本',
            watermarkPlaceholder: '请输入水印文字',
            fontSize: '字体大小',
            opacity: '透明度',
            angle: '旋转角度',
            spacing: '水印间距',
            upload: '选择图片',
            download: '下载',
            reset: '重置',
            dropzoneText: '请上传身份证图片',
            dropzoneSubtext: '支持 JPG、PNG 等格式',
            instructions: '使用说明',
            instruction1: '• 上传身份证照片后，会自动添加水印',
            instruction2: '• 可以自定义水印文字，如"仅供银行开户使用"',
            instruction3: '• 调整字体大小、透明度、角度和间距以获得最佳效果',
            instruction4: '• 建议透明度设置为 20-40%，既能看清身份证内容，又能防止盗用',
            instruction5: '• 建议角度设置为 315-345° 以获得最佳视觉效果',
            instruction6: '• 下载的图片为 PNG 格式，保持原始分辨率',
            alertSelectImage: '请选择图片文件',
        },

        // Common
        common: {
            loading: '加载中...',
            error: '错误',
            success: '成功',
            cancel: '取消',
            confirm: '确认',
            close: '关闭',
            save: '保存',
        },

        // Footer
        footer: {
            description: '为开发者提供实用工具的一站式平台',
            quickLinks: '快速链接',
            resources: '资源',
            contact: '联系我们',
            allRightsReserved: '版权所有',
            builtWith: '使用',
            and: '和',
            madeWith: '用',
            in: '制作于',
            email: '邮箱',
            github: 'GitHub 仓库',
            documentation: '文档',
            reportIssue: '报告问题',
            requestFeature: '功能请求',
        }
    },
    en: {
        // Navigation
        devToolsHub: 'DevTools Hub',

        // Tool names
        tools: {
            jsonFormatter: 'JSON Formatter',
            sqlFormatter: 'SQL Formatter',
            base64: 'Base64 Encoder/Decoder',
            urlCodec: 'URL Encoder/Decoder',
            idWatermark: 'ID Watermark',
            codeGenerator: 'Code Generator',
            timestamp: 'Timestamp Converter',
            jwt: 'JWT Decoder',
            hash: 'Hash Generator',
            codeBeautifier: 'Code Beautifier',
            regex: 'Regex Tester',
            cron: 'Cron Expression',
            proto: 'Proto Beautifier',
            imageCompressor: 'Image Compressor',
            repoCard: 'Repo Card',
        },

        // Home page
        home: {
            title: 'Developer Tools Collection',
            subtitle: 'One-stop developer tools platform with various practical development tools',
            searchPlaceholder: 'Search tools...',
            allTools: 'All Tools',
            categories: {
                all: 'All',
                dataFormat: 'Data Format',
                code: 'Code',
                dateTime: 'Date & Time',
                encoding: 'Encoding',
                security: 'Security',
                devops: 'DevOps',
                image: 'Image',
            }
        },

        // Tool descriptions
        descriptions: {
            jsonFormatter: 'Format and validate JSON data with syntax highlighting',
            codeGenerator: 'Generate code from everything',
            sqlFormatter: 'Format SQL queries for better readability',
            timestamp: 'Convert timestamps to human-readable formats',
            base64: 'Encode and decode Base64 strings',
            urlCodec: 'Encode and decode URLs',
            jwt: 'Decode and verify JSON Web Tokens',
            hash: 'Generate various hash formats (MD5, SHA-1, SHA-256)',
            codeBeautifier: 'Beautify and format various programming languages',
            regex: 'Test and validate regular expressions',
            cron: 'Generate and validate cron expressions',
            proto: 'Beautify Protocol Buffers and Renumber the fields',
            imageCompressor: 'Compress images to reduce file size',
            repoCard: 'Generate GitHub repository cards',
            idWatermark: 'Add diagonal watermarks to ID card images for privacy protection',
        },

        // ID Watermark tool
        idWatermark: {
            title: 'ID Watermark Tool',
            subtitle: 'Add diagonal watermarks to ID card images for privacy protection',
            settings: 'Settings',
            preview: 'Preview',
            selectImage: 'Select Image',
            watermarkText: 'Watermark Text',
            watermarkPlaceholder: 'Enter watermark text',
            fontSize: 'Font Size',
            opacity: 'Opacity',
            angle: 'Rotation Angle',
            spacing: 'Watermark Spacing',
            upload: 'Select Image',
            download: 'Download',
            reset: 'Reset',
            dropzoneText: 'Please upload ID card image',
            dropzoneSubtext: 'Supports JPG, PNG and other formats',
            instructions: 'Instructions',
            instruction1: '• Watermark will be automatically added after uploading ID card photo',
            instruction2: '• Customize watermark text, such as "For Bank Account Opening Only"',
            instruction3: '• Adjust font size, opacity, angle and spacing for best results',
            instruction4: '• Recommended opacity: 20-40%, visible yet protective',
            instruction5: '• Recommended angle: 315-345° for best visual effect',
            instruction6: '• Downloaded image is in PNG format, maintaining original resolution',
            alertSelectImage: 'Please select an image file',
        },

        // Common
        common: {
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            cancel: 'Cancel',
            confirm: 'Confirm',
            close: 'Close',
            save: 'Save',
        },

        // Footer
        footer: {
            description: 'One-stop platform providing practical tools for developers',
            quickLinks: 'Quick Links',
            resources: 'Resources',
            contact: 'Contact',
            allRightsReserved: 'All rights reserved',
            builtWith: 'Built with',
            and: 'and',
            madeWith: 'Made with',
            in: 'in',
            email: 'Email',
            github: 'GitHub Repository',
            documentation: 'Documentation',
            reportIssue: 'Report Issue',
            requestFeature: 'Request Feature',
        }
    }
} as const

export type TranslationKey = keyof typeof translations.zh
