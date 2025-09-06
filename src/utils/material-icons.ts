import { generateManifest, type ManifestConfig, type IconPackValue, availableIconPacks } from 'material-icon-theme'

// Material Icon Themeの設定
const defaultConfig: ManifestConfig = {
  activeIconPack: 'angular',
  hidesExplorerArrows: true,
  folders: {
    theme: 'classic',
    associations: {}
  },
  files: {
    associations: {}
  },
  languages: {
    associations: {}
  }
}

// マニフェストを生成
let iconManifest: any = null

const getIconManifest = () => {
  if (!iconManifest) {
    try {
      iconManifest = generateManifest(defaultConfig)
    } catch (error) {
      console.warn('Failed to generate Material Icon Theme manifest:', error)
      iconManifest = {}
    }
  }
  return iconManifest
}

// ファイル拡張子からアイコンファイル名を取得
export const getFileIconName = (fileName: string): string => {
  const manifest = getIconManifest()
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  if (!extension) {
    return 'default_file'
  }

  // ファイル拡張子に基づくアイコンマッピング
  const iconMapping: Record<string, string> = {
    // テキストファイル
    'txt': 'text',
    'md': 'markdown',
    'json': 'json',
    'xml': 'xml',
    'csv': 'csv',
    'log': 'log',
    
    // プログラミング言語
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'react',
    'tsx': 'react_ts',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'r': 'r',
    'm': 'matlab',
    'sql': 'sql',
    'pl': 'perl',
    'sh': 'shell',
    'ps1': 'powershell',
    'bat': 'batch',
    'dockerfile': 'docker',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'ini': 'ini',
    'cfg': 'config',
    'conf': 'config',
    
    // ウェブ技術
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'sass',
    'sass': 'sass',
    'less': 'less',
    'vue': 'vue',
    'svelte': 'svelte',
    'astro': 'astro',
    
    // データファイル
    'db': 'database',
    'sqlite': 'database',
    'sqlite3': 'database',
    'mdb': 'database',
    'accdb': 'database',
    
    // 画像ファイル
    'png': 'image',
    'jpg': 'image',
    'jpeg': 'image',
    'gif': 'image',
    'svg': 'svg',
    'ico': 'image',
    'bmp': 'image',
    'tiff': 'image',
    'webp': 'image',
    'avif': 'image',
    
    // 動画ファイル
    'mp4': 'video',
    'avi': 'video',
    'mov': 'video',
    'wmv': 'video',
    'flv': 'video',
    'webm': 'video',
    'mkv': 'video',
    'm4v': 'video',
    
    // 音声ファイル
    'mp3': 'audio',
    'wav': 'audio',
    'flac': 'audio',
    'aac': 'audio',
    'ogg': 'audio',
    'wma': 'audio',
    'm4a': 'audio',
    
    // ドキュメント
    'pdf': 'pdf',
    'doc': 'word',
    'docx': 'word',
    'xls': 'excel',
    'xlsx': 'excel',
    'ppt': 'powerpoint',
    'pptx': 'powerpoint',
    'odt': 'libreoffice',
    'ods': 'libreoffice',
    'odp': 'libreoffice',
    
    // アーカイブ
    'zip': 'zip',
    'rar': 'archive',
    '7z': 'archive',
    'tar': 'archive',
    'gz': 'archive',
    'bz2': 'archive',
    'xz': 'archive',
    
    // 設定ファイル
    'env': 'config',
    'gitignore': 'git',
    'gitattributes': 'git',
    'editorconfig': 'config',
    'eslintrc': 'eslint',
    'prettierrc': 'prettier',
    'babelrc': 'babel',
    'webpack': 'webpack',
    'rollup': 'rollup',
    'vite': 'vite',
    'package': 'npm',
    'package-lock': 'npm',
    'yarn': 'yarn',
    'pnpm': 'pnpm',
    
    // その他
    'lock': 'lock',
    'key': 'key',
    'pem': 'key',
    'crt': 'certificate',
    'cer': 'certificate',
    'p12': 'certificate',
    'pfx': 'certificate'
  }

  return iconMapping[extension] || 'default_file'
}

// ファイルタイプからアイコンファイル名を取得
export const getFileTypeIconName = (fileType: string): string => {
  const typeMapping: Record<string, string> = {
    'text': 'text',
    'image': 'image',
    'video': 'video',
    'audio': 'audio',
    'code': 'typescript',
    'archive': 'archive',
    'document': 'word',
    'other': 'default_file'
  }

  return typeMapping[fileType] || 'default_file'
}

// アイコンファイルのパスを取得
export const getIconPath = (iconName: string): string => {
  try {
    // Material Icon Themeのアイコンファイルパスを構築
    const manifest = getIconManifest()
    const iconInfo = manifest.fileNames?.[iconName] || manifest.fileExtensions?.[iconName]
    
    if (iconInfo) {
      return `/node_modules/material-icon-theme/icons/${iconInfo.icon}`
    }
    
    // フォールバック: 一般的なアイコンパス
    return `/node_modules/material-icon-theme/icons/${iconName}.svg`
  } catch (error) {
    console.warn('Failed to get icon path:', error)
    return `/node_modules/material-icon-theme/icons/default_file.svg`
  }
}

// 利用可能なアイコンパックを取得
export const getAvailableIconPacks = (): IconPackValue[] => {
  return availableIconPacks
}

// アイコンパックを変更
export const changeIconPack = (iconPack: IconPackValue) => {
  const newConfig: ManifestConfig = {
    ...defaultConfig,
    activeIconPack: iconPack
  }
  
  try {
    iconManifest = generateManifest(newConfig)
    return true
  } catch (error) {
    console.error('Failed to change icon pack:', error)
    return false
  }
}

// ファイル名からアイコンコンポーネント用のプロパティを取得
export const getFileIconProps = (fileName: string) => {
  const iconName = getFileIconName(fileName)
  const iconPath = getIconPath(iconName)
  
  return {
    iconName,
    iconPath,
    alt: `${fileName} icon`
  }
}
