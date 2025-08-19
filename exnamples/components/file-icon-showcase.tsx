"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileIcon, FolderFileIcon, getFileType, getFileTypeColor } from "@/components/file-icons"

// ファイルアイコンのショーケースコンポーネント
export function FileIconShowcase() {
  const fileExamples = [
    // コードファイル
    { name: 'App.tsx', category: 'React TypeScript' },
    { name: 'index.js', category: 'JavaScript' },
    { name: 'styles.css', category: 'CSS' },
    { name: 'config.json', category: 'JSON' },
    { name: 'README.md', category: 'Markdown' },
    { name: 'main.py', category: 'Python' },
    { name: 'Server.java', category: 'Java' },
    { name: 'app.go', category: 'Go' },
    
    // 画像ファイル
    { name: 'photo.jpg', category: 'JPEG Image' },
    { name: 'logo.png', category: 'PNG Image' },
    { name: 'icon.svg', category: 'SVG Vector' },
    { name: 'design.psd', category: 'Photoshop' },
    
    // 動画・音声
    { name: 'video.mp4', category: 'MP4 Video' },
    { name: 'song.mp3', category: 'MP3 Audio' },
    { name: 'podcast.wav', category: 'WAV Audio' },
    
    // ドキュメント
    { name: 'document.pdf', category: 'PDF Document' },
    { name: 'report.docx', category: 'Word Document' },
    { name: 'data.xlsx', category: 'Excel Spreadsheet' },
    { name: 'slides.pptx', category: 'PowerPoint' },
    
    // アーカイブ
    { name: 'archive.zip', category: 'ZIP Archive' },
    { name: 'backup.rar', category: 'RAR Archive' },
    
    // システムファイル
    { name: 'script.sh', category: 'Shell Script' },
    { name: 'app.exe', category: 'Executable' },
    { name: 'database.db', category: 'Database' },
    { name: 'security.key', category: 'Key File' },
  ]

  const groupedFiles = fileExamples.reduce((groups, file) => {
    const type = getFileType(file.name)
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(file)
    return groups
  }, {} as Record<string, typeof fileExamples>)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderFileIcon size="medium" />
            Material Icons ファイルアイコン一覧
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* フォルダーアイコン */}
          <div>
            <h3 className="text-lg font-semibold mb-3">フォルダー</h3>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <FolderFileIcon isOpen={false} size="large" />
                <p className="text-xs mt-1">閉じた状態</p>
              </div>
              <div className="text-center">
                <FolderFileIcon isOpen={true} size="large" />
                <p className="text-xs mt-1">開いた状態</p>
              </div>
            </div>
          </div>

          {/* ファイルタイプ別グループ */}
          {Object.entries(groupedFiles).map(([type, files]) => (
            <div key={type}>
              <h3 className="text-lg font-semibold mb-3 capitalize">
                {type === 'unknown' ? 'その他' : type} ファイル
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {files.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FileIcon fileName={file.name} fileType="file" size="medium" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.category}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* アイコンサイズ例 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">アイコンサイズ</h3>
            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <FileIcon fileName="example.tsx" fileType="file" size="small" />
                <p className="text-xs mt-1">Small (16px)</p>
              </div>
              <div className="text-center">
                <FileIcon fileName="example.tsx" fileType="file" size="medium" />
                <p className="text-xs mt-1">Medium (20px)</p>
              </div>
              <div className="text-center">
                <FileIcon fileName="example.tsx" fileType="file" size="large" />
                <p className="text-xs mt-1">Large (24px)</p>
              </div>
              <div className="text-center">
                <FileIcon fileName="example.tsx" fileType="file" sx={{ fontSize: 32 }} />
                <p className="text-xs mt-1">Custom (32px)</p>
              </div>
            </div>
          </div>

          {/* 技術情報 */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">技術仕様</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">対応ファイル拡張子</h4>
                <div className="flex flex-wrap gap-1">
                  {[
                    'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'java', 
                    'png', 'jpg', 'svg', 'mp4', 'mp3', 'pdf', 'zip'
                  ].map(ext => (
                    <Badge key={ext} variant="outline" className="text-xs">
                      .{ext}
                    </Badge>
                  ))}
                  <Badge variant="secondary" className="text-xs">
                    +50種類以上
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">特徴</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Material Design Icons使用</li>
                  <li>• ファイルタイプ別の自動色分け</li>
                  <li>• 3種類のサイズプリセット</li>
                  <li>• カスタムスタイル対応</li>
                  <li>• TypeScript完全対応</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ファイルタイプ別統計コンポーネント
export function FileTypeStats({ files }: { files: Array<{ name: string; type: 'file' | 'folder' }> }) {
  const fileStats = files.filter(f => f.type === 'file').reduce((stats, file) => {
    const type = getFileType(file.name)
    stats[type] = (stats[type] || 0) + 1
    return stats
  }, {} as Record<string, number>)

  const folderCount = files.filter(f => f.type === 'folder').length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">ファイル統計</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderFileIcon size="small" />
            <span className="text-sm">フォルダー</span>
          </div>
          <Badge variant="outline">{folderCount}</Badge>
        </div>
        
        {Object.entries(fileStats).map(([type, count]) => (
          <div key={type} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileIcon fileName={`example.${type}`} fileType="file" size="small" />
              <span className="text-sm capitalize">{type}</span>
            </div>
            <Badge variant="outline">{count}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
