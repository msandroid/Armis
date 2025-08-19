'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Eye, 
  Copy, 
  Star,
  StarOff,
  Folder,
  FolderOpen,
  Code,
  Briefcase,
  GraduationCap,
  Stethoscope,
  Wrench,
  Palette,
  BookOpen,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface Template {
  id: string
  title: string
  description: string
  category: string
  systemPrompt: string
  scriptName: string
  tags: string[]
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
  usage: number
  structure?: any
  visualElements?: any
  contentGuidelines?: any
}

interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  count: number
}

interface TemplateManagerProps {
  onTemplateSelect?: (template: Template) => void
  onTemplateCreate?: (template: Template) => void
  onTemplateUpdate?: (template: Template) => void
  onTemplateDelete?: (templateId: string) => void
  selectedTemplateId?: string
  className?: string
}

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: 'all', name: 'すべて', description: '全てのテンプレート', icon: <Folder className="h-4 w-4" />, count: 0 },
  { id: 'business', name: 'ビジネス', description: 'ビジネスプレゼンテーション', icon: <Briefcase className="h-4 w-4" />, count: 0 },
  { id: 'technical', name: '技術', description: '技術文書・コーディング', icon: <Code className="h-4 w-4" />, count: 0 },
  { id: 'educational', name: '教育', description: '教育・学習コンテンツ', icon: <GraduationCap className="h-4 w-4" />, count: 0 },
  { id: 'professional', name: '専門職', description: '医療・工学・研究', icon: <Stethoscope className="h-4 w-4" />, count: 0 },
  { id: 'creative', name: 'クリエイティブ', description: 'アニメ・コミック・アート', icon: <Palette className="h-4 w-4" />, count: 0 },
  { id: 'other', name: 'その他', description: 'その他のテンプレート', icon: <BookOpen className="h-4 w-4" />, count: 0 }
]

export function TemplateManager({
  onTemplateSelect,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  selectedTemplateId,
  className = ''
}: TemplateManagerProps) {
  // テンプレート管理
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // フィルタリング・検索
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'usage'>('name')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  
  // テンプレート詳細・編集
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Partial<Template>>({})
  
  // ダイアログ状態
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  // テンプレート読み込み
  const loadTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      // 既存のテンプレートファイルを読み込み
      const templateFiles = [
        'business.json',
        'coding.json',
        'html.json',
        'text_only.json',
        'ani.json',
        'ani_ja.json',
        'characters.json',
        'children_book.json',
        'comic_strips.json',
        'ghost_comic.json',
        'onepiece_comic.json',
        'sensei_and_taro.json',
        'professional_bioinformatics.json',
        'professional_engineering.json',
        'professional_medical.json'
      ]

      const loadedTemplates: Template[] = []

      for (const fileName of templateFiles) {
        try {
          const response = await fetch(`/assets/mulmocast/templates/${fileName}`)
          if (response.ok) {
            const templateData = await response.json()
            
            // カテゴリを推定
            let category = 'other'
            if (fileName.includes('business')) category = 'business'
            else if (fileName.includes('coding') || fileName.includes('html')) category = 'technical'
            else if (fileName.includes('professional')) category = 'professional'
            else if (fileName.includes('ani') || fileName.includes('comic') || fileName.includes('ghost')) category = 'creative'
            else if (fileName.includes('children') || fileName.includes('sensei')) category = 'educational'

            const template: Template = {
              id: fileName.replace('.json', ''),
              title: templateData.title || fileName.replace('.json', '').replace(/_/g, ' '),
              description: templateData.description || 'テンプレートの説明がありません',
              category,
              systemPrompt: templateData.systemPrompt || '',
              scriptName: templateData.scriptName || fileName,
              tags: templateData.tags || [],
              isFavorite: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              usage: Math.floor(Math.random() * 100), // 仮の使用回数
              structure: templateData.script_structure,
              visualElements: templateData.visual_elements,
              contentGuidelines: templateData.content_guidelines
            }

            loadedTemplates.push(template)
          }
        } catch (error) {
          console.error(`Failed to load template ${fileName}:`, error)
        }
      }

      setTemplates(loadedTemplates)
      toast.success(`${loadedTemplates.length}個のテンプレートを読み込みました`)
    } catch (error) {
      console.error('Failed to load templates:', error)
      toast.error('テンプレートの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // フィルタリング処理
  const applyFilters = useCallback(() => {
    let filtered = templates

    // カテゴリフィルタ
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }

    // お気に入りフィルタ
    if (showFavoritesOnly) {
      filtered = filtered.filter(template => template.isFavorite)
    }

    // 検索フィルタ
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.updatedAt.getTime() - a.updatedAt.getTime()
        case 'usage':
          return b.usage - a.usage
        case 'name':
        default:
          return a.title.localeCompare(b.title)
      }
    })

    setFilteredTemplates(filtered)
  }, [templates, selectedCategory, showFavoritesOnly, searchQuery, sortBy])

  // 初期化
  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  // フィルタ適用
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // カテゴリ別カウント更新
  const updateCategoryCounts = useCallback(() => {
    const counts = templates.reduce((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    TEMPLATE_CATEGORIES.forEach(category => {
      if (category.id === 'all') {
        category.count = templates.length
      } else {
        category.count = counts[category.id] || 0
      }
    })
  }, [templates])

  useEffect(() => {
    updateCategoryCounts()
  }, [updateCategoryCounts])

  // テンプレート選択
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    onTemplateSelect?.(template)
    
    // 使用回数を増加
    setTemplates(prev => prev.map(t => 
      t.id === template.id ? { ...t, usage: t.usage + 1 } : t
    ))
  }

  // お気に入り切り替え
  const toggleFavorite = (templateId: string) => {
    setTemplates(prev => prev.map(template =>
      template.id === templateId
        ? { ...template, isFavorite: !template.isFavorite }
        : template
    ))
  }

  // テンプレート詳細表示
  const showTemplateDetail = (template: Template) => {
    setSelectedTemplate(template)
    setShowDetailDialog(true)
  }

  // テンプレート編集開始
  const startEditing = (template: Template) => {
    setEditingTemplate(template)
    setIsEditing(true)
    setShowDetailDialog(false)
  }

  // テンプレート複製
  const duplicateTemplate = (template: Template) => {
    const duplicated: Template = {
      ...template,
      id: `${template.id}_copy_${Date.now()}`,
      title: `${template.title} (コピー)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      usage: 0
    }
    
    setTemplates(prev => [...prev, duplicated])
    toast.success('テンプレートを複製しました')
  }

  // テンプレート削除
  const deleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId))
    onTemplateDelete?.(templateId)
    toast.success('テンプレートを削除しました')
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6" />
          <h2 className="text-2xl font-bold">テンプレート管理</h2>
          <Badge variant="outline">
            {filteredTemplates.length} / {templates.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            {showFavoritesOnly ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
            お気に入り
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        </div>
      </div>

      {/* フィルタ・検索バー */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="テンプレートを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      {category.icon}
                      {category.name}
                      <Badge variant="secondary" className="ml-auto">
                        {category.count}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">名前順</SelectItem>
                <SelectItem value="date">更新日順</SelectItem>
                <SelectItem value="usage">使用回数順</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* テンプレート一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">テンプレートが見つかりません</h3>
            <p className="text-muted-foreground mb-4">
              検索条件を変更するか、新しいテンプレートを作成してください
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              新規作成
            </Button>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplateId === template.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base line-clamp-1">
                      {template.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {TEMPLATE_CATEGORIES.find(c => c.id === template.category)?.name || template.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        使用: {template.usage}回
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(template.id)
                    }}
                  >
                    {template.isFavorite ? (
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {template.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        showTemplateDetail(template)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        duplicateTemplate(template)
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(template)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <span className="text-xs text-muted-foreground">
                    {template.updatedAt.toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* テンプレート詳細ダイアログ */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedTemplate?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">カテゴリ</Label>
                  <Badge variant="outline" className="mt-1">
                    {TEMPLATE_CATEGORIES.find(c => c.id === selectedTemplate.category)?.name}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">使用回数</Label>
                  <p className="text-sm mt-1">{selectedTemplate.usage}回</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">説明</Label>
                <p className="text-sm mt-1 text-muted-foreground">
                  {selectedTemplate.description}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">システムプロンプト</Label>
                <ScrollArea className="h-32 w-full border rounded-lg p-3 mt-1">
                  <pre className="text-xs whitespace-pre-wrap">
                    {selectedTemplate.systemPrompt}
                  </pre>
                </ScrollArea>
              </div>
              
              {selectedTemplate.structure && (
                <div>
                  <Label className="text-sm font-medium">構造情報</Label>
                  <ScrollArea className="h-32 w-full border rounded-lg p-3 mt-1">
                    <pre className="text-xs">
                      {JSON.stringify(selectedTemplate.structure, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => startEditing(selectedTemplate)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  編集
                </Button>
                <Button
                  variant="outline"
                  onClick={() => duplicateTemplate(selectedTemplate)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  複製
                </Button>
                <Button
                  onClick={() => handleTemplateSelect(selectedTemplate)}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  使用
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 新規作成・編集ダイアログ */}
      <Dialog open={showCreateDialog || isEditing} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false)
          setIsEditing(false)
          setEditingTemplate({})
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'テンプレート編集' : '新規テンプレート作成'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">タイトル</Label>
                <Input
                  id="title"
                  value={editingTemplate.title || ''}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="テンプレートのタイトル"
                />
              </div>
              <div>
                <Label htmlFor="category">カテゴリ</Label>
                <Select
                  value={editingTemplate.category || 'other'}
                  onValueChange={(value) => setEditingTemplate(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.filter(c => c.id !== 'all').map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          {category.icon}
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={editingTemplate.description || ''}
                onChange={(e) => setEditingTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="テンプレートの説明"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="systemPrompt">システムプロンプト</Label>
              <Textarea
                id="systemPrompt"
                value={editingTemplate.systemPrompt || ''}
                onChange={(e) => setEditingTemplate(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="システムプロンプトを入力..."
                rows={6}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setIsEditing(false)
                  setEditingTemplate({})
                }}
              >
                キャンセル
              </Button>
              <Button
                onClick={() => {
                  const template: Template = {
                    id: editingTemplate.id || `template_${Date.now()}`,
                    title: editingTemplate.title || '無題のテンプレート',
                    description: editingTemplate.description || '',
                    category: editingTemplate.category || 'other',
                    systemPrompt: editingTemplate.systemPrompt || '',
                    scriptName: `${editingTemplate.id || 'template'}.json`,
                    tags: editingTemplate.tags || [],
                    isFavorite: editingTemplate.isFavorite || false,
                    createdAt: editingTemplate.createdAt || new Date(),
                    updatedAt: new Date(),
                    usage: editingTemplate.usage || 0
                  }
                  
                  if (isEditing) {
                    setTemplates(prev => prev.map(t => t.id === template.id ? template : t))
                    onTemplateUpdate?.(template)
                    toast.success('テンプレートを更新しました')
                  } else {
                    setTemplates(prev => [...prev, template])
                    onTemplateCreate?.(template)
                    toast.success('テンプレートを作成しました')
                  }
                  
                  setShowCreateDialog(false)
                  setIsEditing(false)
                  setEditingTemplate({})
                }}
              >
                {isEditing ? '更新' : '作成'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
