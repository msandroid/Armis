'use client'

import React, { useState, useMemo } from 'react'
import { Check, ChevronsUpDown, Search, Globe, Star, Zap } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { cn } from '../lib/utils'
import { 
  SUPPORTED_LANGUAGES, 
  LANGUAGE_GROUPS, 
  getLanguageByCode, 
  getPopularLanguages,
  searchLanguages,
  type Language 
} from '../lib/stt-languages'
import type { LanguageOption, LanguageGroup } from '../types/stt'

interface LanguageSelectorProps {
  /** 現在選択されている言語 */
  value: string
  /** 言語変更時のコールバック */
  onValueChange: (language: string) => void
  /** サポートするプロバイダー */
  provider?: 'web-speech' | 'openai-whisper' | 'all'
  /** 最小品質フィルター */
  minQuality?: number
  /** 人気言語のみ表示 */
  popularOnly?: boolean
  /** コンパクトモード */
  compact?: boolean
  /** 無効状態 */
  disabled?: boolean
  /** プレースホルダー */
  placeholder?: string
  /** クラス名 */
  className?: string
}

export function LanguageSelector({
  value,
  onValueChange,
  provider = 'all',
  minQuality = 0,
  popularOnly = false,
  compact = false,
  disabled = false,
  placeholder = '言語を選択...',
  className
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // 言語リストのフィルタリング
  const filteredLanguages = useMemo(() => {
    let languages = popularOnly ? getPopularLanguages() : SUPPORTED_LANGUAGES
    
    // プロバイダーフィルター
    if (provider !== 'all') {
      languages = languages.filter(lang => {
        if (provider === 'web-speech') return lang.support.webSpeech
        if (provider === 'openai-whisper') return lang.support.whisper
        return true
      })
    }
    
    // 品質フィルター
    if (minQuality > 0) {
      languages = languages.filter(lang => lang.quality >= minQuality)
    }
    
    // 検索フィルター
    if (searchQuery) {
      languages = searchLanguages(searchQuery).filter(lang => 
        languages.some(l => l.code === lang.code)
      )
    }
    
    return languages
  }, [provider, minQuality, popularOnly, searchQuery])

  // 言語をグループ化
  const languageGroups = useMemo(() => {
    const groups: Record<string, Language[]> = {}
    
    filteredLanguages.forEach(language => {
      // 地域別グループ化
      const groupKey = Object.keys(LANGUAGE_GROUPS).find(key => 
        LANGUAGE_GROUPS[key as keyof typeof LANGUAGE_GROUPS].languages.includes(language.code)
      ) || 'OTHER'
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(language)
    })
    
    return groups
  }, [filteredLanguages])

  const selectedLanguage = getLanguageByCode(value)

  const handleSelect = (languageCode: string) => {
    onValueChange(languageCode)
    setOpen(false)
  }

  if (compact) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between", className)}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {selectedLanguage ? selectedLanguage.nativeName : placeholder}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <Command>
            <CommandInput placeholder="言語を検索..." />
            <CommandEmpty>言語が見つかりません。</CommandEmpty>
            <CommandList>
              {Object.entries(languageGroups).map(([groupKey, languages]) => (
                <CommandGroup key={groupKey} heading={
                  LANGUAGE_GROUPS[groupKey as keyof typeof LANGUAGE_GROUPS]?.name || 'その他'
                }>
                  {languages.map((language) => (
                    <CommandItem
                      key={language.code}
                      value={language.code}
                      onSelect={handleSelect}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === language.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <span>{language.nativeName}</span>
                        {language.name !== language.nativeName && (
                          <span className="text-sm text-muted-foreground">({language.name})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {language.quality >= 5 && <Star className="h-3 w-3 text-yellow-500" />}
                        {language.quality >= 4 && <Zap className="h-3 w-3 text-blue-500" />}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="language-selector">認識言語</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={disabled}
            >
              {selectedLanguage ? (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>{selectedLanguage.nativeName}</span>
                  {selectedLanguage.name !== selectedLanguage.nativeName && (
                    <span className="text-sm text-muted-foreground">({selectedLanguage.name})</span>
                  )}
                </div>
              ) : (
                <>
                  <Globe className="h-4 w-4" />
                  {placeholder}
                </>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="言語を検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <ScrollArea className="h-80">
              <div className="p-1">
                {Object.entries(languageGroups).map(([groupKey, languages]) => {
                  const groupInfo = LANGUAGE_GROUPS[groupKey as keyof typeof LANGUAGE_GROUPS]
                  return (
                    <Collapsible key={groupKey} defaultOpen={groupKey === 'EAST_ASIA'}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start font-medium">
                          <ChevronsUpDown className="mr-2 h-4 w-4" />
                          {groupInfo?.name || 'その他'} ({languages.length})
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1">
                        {languages.map((language) => (
                          <Button
                            key={language.code}
                            variant={value === language.code ? "secondary" : "ghost"}
                            className="w-full justify-start h-auto p-3"
                            onClick={() => handleSelect(language.code)}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{language.nativeName}</span>
                                  {language.name !== language.nativeName && (
                                    <span className="text-sm text-muted-foreground">
                                      {language.name}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {language.region}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {language.quality >= 5 && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    高品質
                                  </Badge>
                                )}
                                {language.quality >= 4 && language.quality < 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    <Zap className="h-3 w-3 mr-1" />
                                    推奨
                                  </Badge>
                                )}
                                {value === language.code && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </div>
            </ScrollArea>
            <div className="border-t p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="h-3 w-3" />
                <span>高品質</span>
                <Separator orientation="vertical" className="h-3" />
                <Zap className="h-3 w-3" />
                <span>推奨</span>
                <Separator orientation="vertical" className="h-3" />
                <span>{filteredLanguages.length} 言語利用可能</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {selectedLanguage && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">
              {selectedLanguage.direction === 'rtl' ? '右から左' : '左から右'}
            </Badge>
            <Badge variant="outline">
              品質: {selectedLanguage.quality}/5
            </Badge>
            {selectedLanguage.support.webSpeech && (
              <Badge variant="secondary">Web Speech</Badge>
            )}
            {selectedLanguage.support.whisper && (
              <Badge variant="secondary">Whisper</Badge>
            )}
          </div>
          
          {provider !== 'all' && !selectedLanguage.support[provider] && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
              選択された言語は {provider === 'web-speech' ? 'Web Speech API' : 'Whisper'} でサポートされていません。
            </div>
          )}
        </div>
      )}
    </div>
  )
}
