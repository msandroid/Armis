import { 
  getFileIconProps, 
  getFileTypeIconName, 
  getIconPath, 
  getAvailableIconPacks, 
  changeIconPack 
} from '@/utils/material-icons'

// Material Icon Themeの使用例
export const materialIconsExamples = {
  // 基本的なファイルアイコン取得例
  basicFileIconExample: () => {
    const fileName = 'example.ts'
    const props = getFileIconProps(fileName)
    
    console.log('File Icon Props:', props)
    // 出力例: { iconName: 'typescript', iconPath: '/node_modules/material-icon-theme/icons/typescript.svg', alt: 'example.ts icon' }
    
    return props
  },

  // 様々なファイルタイプのアイコン例
  fileTypeExamples: () => {
    const files = [
      'document.txt',
      'image.png',
      'video.mp4',
      'audio.mp3',
      'code.ts',
      'archive.zip',
      'config.json',
      'markdown.md',
      'python.py',
      'dockerfile',
      'package.json',
      'webpack.config.js'
    ]

    return files.map(fileName => ({
      fileName,
      iconProps: getFileIconProps(fileName)
    }))
  },

  // ファイルタイプ別アイコン例
  fileTypeIconExamples: () => {
    const fileTypes = ['text', 'image', 'video', 'audio', 'code', 'archive', 'document', 'other']
    
    return fileTypes.map(fileType => ({
      fileType,
      iconName: getFileTypeIconName(fileType),
      iconPath: getIconPath(getFileTypeIconName(fileType))
    }))
  },

  // 利用可能なアイコンパック例
  availableIconPacksExample: () => {
    const iconPacks = getAvailableIconPacks()
    console.log('Available Icon Packs:', iconPacks)
    
    return iconPacks
  },

  // アイコンパック変更例
  changeIconPackExample: (iconPack: string) => {
    const success = changeIconPack(iconPack as any)
    console.log(`Icon pack changed to ${iconPack}:`, success)
    
    return success
  }
}

// ファイル拡張子別のアイコン例
export const fileExtensionExamples = {
  // プログラミング言語
  programmingLanguages: [
    'app.js',
    'component.tsx',
    'main.py',
    'index.html',
    'styles.css',
    'script.php',
    'main.go',
    'lib.rs',
    'app.swift',
    'Main.java',
    'app.cs',
    'script.rb'
  ],

  // データファイル
  dataFiles: [
    'data.json',
    'config.xml',
    'users.csv',
    'database.sql',
    'settings.yaml',
    'config.toml',
    'data.db',
    'backup.sqlite'
  ],

  // ドキュメント
  documents: [
    'report.pdf',
    'document.docx',
    'spreadsheet.xlsx',
    'presentation.pptx',
    'readme.md',
    'manual.txt',
    'notes.rtf'
  ],

  // メディアファイル
  mediaFiles: [
    'photo.jpg',
    'image.png',
    'icon.svg',
    'video.mp4',
    'movie.avi',
    'audio.mp3',
    'music.wav',
    'podcast.m4a'
  ],

  // アーカイブ
  archives: [
    'backup.zip',
    'archive.rar',
    'compressed.7z',
    'data.tar.gz',
    'files.tar.bz2'
  ],

  // 設定ファイル
  configFiles: [
    '.env',
    '.gitignore',
    'package.json',
    'tsconfig.json',
    'webpack.config.js',
    'docker-compose.yml',
    '.eslintrc.js',
    'babel.config.js'
  ]
}

// アイコン表示のテスト関数
export const testIconDisplay = () => {
  const testFiles = [
    'example.ts',
    'component.tsx',
    'styles.css',
    'data.json',
    'image.png',
    'video.mp4',
    'document.pdf',
    'archive.zip'
  ]

  return testFiles.map(fileName => {
    const props = getFileIconProps(fileName)
    return {
      fileName,
      iconName: props.iconName,
      iconPath: props.iconPath,
      // 実際のアイコンパスを構築
      fullPath: `/node_modules/material-icon-theme/icons/${props.iconName}.svg`
    }
  })
}

// アイコンパックの切り替えテスト
export const testIconPackSwitching = () => {
  const iconPacks = getAvailableIconPacks()
  const results = []

  for (const pack of iconPacks) {
    const success = changeIconPack(pack)
    results.push({
      pack,
      success,
      timestamp: new Date().toISOString()
    })
  }

  return results
}

// ファイルアイコンの一括テスト
export const bulkFileIconTest = () => {
  const allFiles = [
    ...fileExtensionExamples.programmingLanguages,
    ...fileExtensionExamples.dataFiles,
    ...fileExtensionExamples.documents,
    ...fileExtensionExamples.mediaFiles,
    ...fileExtensionExamples.archives,
    ...fileExtensionExamples.configFiles
  ]

  return allFiles.map(fileName => {
    try {
      const props = getFileIconProps(fileName)
      return {
        fileName,
        success: true,
        iconName: props.iconName,
        iconPath: props.iconPath
      }
    } catch (error) {
      return {
        fileName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
}
