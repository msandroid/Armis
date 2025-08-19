"use client"

import * as React from "react"
import { AtSign, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AddContextButtonProps {
  onAddContext: (type: string) => void
  className?: string
}

const CONTEXT_TYPES = [
  {
    id: 'file',
    name: 'ファイル',
    description: 'ファイルをコンテキストに追加',
    icon: Plus
  },
  {
    id: 'url',
    name: 'URL',
    description: 'ウェブページをコンテキストに追加',
    icon: Plus
  },
  {
    id: 'text',
    name: 'テキスト',
    description: 'テキストをコンテキストに追加',
    icon: Plus
  },
  {
    id: 'image',
    name: '画像',
    description: '画像をコンテキストに追加',
    icon: Plus
  }
]

export function AddContextButton({
  onAddContext,
  className = ""
}: AddContextButtonProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={`h-8 px-3 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300 ${className}`}
        >
          <div className="flex items-center space-x-2">
            <AtSign className="h-4 w-4" />
            <span>Add Context</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="start">
        <DropdownMenuLabel>コンテキスト追加</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {CONTEXT_TYPES.map((type) => {
          const Icon = type.icon
          
          return (
            <DropdownMenuItem
              key={type.id}
              onClick={() => {
                onAddContext(type.id)
                setOpen(false)
              }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {type.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {type.description}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
