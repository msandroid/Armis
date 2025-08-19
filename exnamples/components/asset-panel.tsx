"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Video, ImageIcon, FileText, Music, Youtube } from "lucide-react"

interface AssetPanelProps {
  onAssetSelect: (assetId: string) => void
}

export function AssetPanel({ onAssetSelect }: AssetPanelProps) {
  const [assets, setAssets] = useState([
    { id: "1", type: "video", name: "intro.mp4", thumbnail: "/placeholder.svg?height=80&width=120" },
    { id: "2", type: "image", name: "slide1.png", thumbnail: "/placeholder.svg?height=80&width=120" },
    { id: "3", type: "document", name: "script.pdf", thumbnail: "/placeholder.svg?height=80&width=120" },
    { id: "4", type: "audio", name: "narration.mp3", thumbnail: "/placeholder.svg?height=80&width=120" },
    { id: "5", type: "youtube", name: "参考動画", thumbnail: "/placeholder.svg?height=80&width=120" },
  ])

  return (
    <div className="w-64 border-r border-zinc-800 bg-black flex flex-col">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-sm font-medium mb-2 text-white">アセット</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="w-full border-zinc-700 text-zinc-300">
            <Upload className="h-3.5 w-3.5 mr-1" />
            アップロード
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <div className="px-2 pt-2">
          <TabsList className="w-full bg-zinc-900">
            <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-zinc-800">
              すべて
            </TabsTrigger>
            <TabsTrigger value="video" className="flex-1 data-[state=active]:bg-zinc-800">
              動画
            </TabsTrigger>
            <TabsTrigger value="image" className="flex-1 data-[state=active]:bg-zinc-800">
              画像
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex-1 data-[state=active]:bg-zinc-800">
              音声
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="flex-1 overflow-y-auto p-2 space-y-2">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="p-2 rounded-md hover:bg-zinc-900 cursor-pointer"
              onClick={() => onAssetSelect(asset.id)}
            >
              <div className="relative">
                <img
                  src={asset.thumbnail || "/placeholder.svg"}
                  alt={asset.name}
                  className="w-full h-20 object-cover rounded-md bg-zinc-800"
                />
                {asset.type === "video" && (
                  <Video className="absolute top-1 left-1 h-4 w-4 text-white bg-black/70 rounded-full p-0.5" />
                )}
                {asset.type === "image" && (
                  <ImageIcon className="absolute top-1 left-1 h-4 w-4 text-white bg-black/70 rounded-full p-0.5" />
                )}
                {asset.type === "document" && (
                  <FileText className="absolute top-1 left-1 h-4 w-4 text-white bg-black/70 rounded-full p-0.5" />
                )}
                {asset.type === "audio" && (
                  <Music className="absolute top-1 left-1 h-4 w-4 text-white bg-black/70 rounded-full p-0.5" />
                )}
                {asset.type === "youtube" && (
                  <Youtube className="absolute top-1 left-1 h-4 w-4 text-white bg-black/70 rounded-full p-0.5" />
                )}
              </div>
              <p className="text-xs mt-1 truncate text-zinc-300">{asset.name}</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="video" className="flex-1 overflow-y-auto p-2">
          {assets
            .filter((a) => a.type === "video")
            .map((asset) => (
              <div
                key={asset.id}
                className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                onClick={() => onAssetSelect(asset.id)}
              >
                <img
                  src={asset.thumbnail || "/placeholder.svg"}
                  alt={asset.name}
                  className="w-full h-20 object-cover rounded-md bg-zinc-200 dark:bg-zinc-800"
                />
                <p className="text-xs mt-1 truncate">{asset.name}</p>
              </div>
            ))}
        </TabsContent>

        {/* Similar content for other tabs */}
      </Tabs>
    </div>
  )
}
